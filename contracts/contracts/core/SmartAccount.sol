// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/UserOperation.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title SmartAccount
 * @dev Minimal ERC-4337 Smart Contract Wallet for TrustLedger users.
 * Validates UserOperations signed by the owner EOA and executes on-chain calls.
 */
contract SmartAccount is IAccount {
    using ECDSA for bytes32;

    address public owner;
    IEntryPoint private immutable _entryPoint;

    event SmartAccountInitialized(IEntryPoint indexed entryPoint, address indexed owner);
    event Executed(address indexed target, uint256 value, bytes data);

    modifier onlyEntryPointOrOwner() {
        require(
            msg.sender == address(_entryPoint) || msg.sender == owner,
            "SmartAccount: caller not EntryPoint or Owner"
        );
        _;
    }

    constructor(IEntryPoint entryPoint_, address owner_) {
        _entryPoint = entryPoint_;
        owner = owner_;
        emit SmartAccountInitialized(entryPoint_, owner_);
    }

    function entryPoint() public view returns (IEntryPoint) {
        return _entryPoint;
    }

    /**
     * @notice Validates the UserOperation signature against the account owner.
     * @param userOp The operation that is about to be executed.
     * @param userOpHash Hash of the user's request data.
     * @param missingAccountFunds Missing funds required for execution to be paid to entryPoint.
     * @return validationData 0 if valid, 1 if signature failed.
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256 validationData) {
        require(msg.sender == address(_entryPoint), "SmartAccount: not from EntryPoint");

        bytes32 hash = userOpHash.toEthSignedMessageHash();
        address recovered = hash.recover(userOp.signature);

        if (recovered != owner) {
            return 1; // SIG_VALIDATION_FAILED
        }

        if (missingAccountFunds > 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            (success);
        }

        return 0; // Valid
    }

    /**
     * @notice Execute a transaction through this smart contract wallet.
     */
    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external onlyEntryPointOrOwner returns (bytes memory) {
        (bool success, bytes memory result) = dest.call{value: value}(func);
        require(success, "SmartAccount: execution failed");
        emit Executed(dest, value, func);
        return result;
    }

    /**
     * @notice Execute multiple transactions in a batch.
     */
    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external onlyEntryPointOrOwner returns (bytes[] memory) {
        require(dest.length == func.length && dest.length == value.length, "SmartAccount: length mismatch");
        bytes[] memory results = new bytes[](dest.length);

        for (uint256 i = 0; i < dest.length; i++) {
            (bool success, bytes memory result) = dest[i].call{value: value[i]}(func[i]);
            require(success, "SmartAccount: batch execution failed");
            emit Executed(dest[i], value[i], func[i]);
            results[i] = result;
        }

        return results;
    }

    receive() external payable {}
}
