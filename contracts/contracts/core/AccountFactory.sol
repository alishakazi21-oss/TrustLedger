// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "./SmartAccount.sol";

/**
 * @title AccountFactory
 * @dev Deploys SmartAccount instances for TrustLedger users deterministically via CREATE2.
 */
contract AccountFactory {
    IEntryPoint public immutable entryPoint;

    event AccountCreated(address indexed account, address indexed owner, uint256 salt);

    constructor(IEntryPoint entryPoint_) {
        entryPoint = entryPoint_;
    }

    /**
     * @notice Deploys a new SmartAccount using CREATE2.
     * If the account already exists, it simply returns the address.
     */
    function createAccount(address owner, uint256 salt) public returns (SmartAccount ret) {
        address addr = getAddress(owner, salt);
        uint256 codeSize = addr.code.length;
        if (codeSize > 0) {
            return SmartAccount(payable(addr));
        }

        ret = new SmartAccount{salt: bytes32(salt)}(entryPoint, owner);
        emit AccountCreated(address(ret), owner, salt);
    }

    /**
     * @notice Computes the counterfactual deterministic address for an owner and salt.
     */
    function getAddress(address owner, uint256 salt) public view returns (address) {
        bytes memory bytecode = abi.encodePacked(
            type(SmartAccount).creationCode,
            abi.encode(entryPoint, owner)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                bytes32(salt),
                keccak256(bytecode)
            )
        );
        return address(uint160(uint256(hash)));
    }
}
