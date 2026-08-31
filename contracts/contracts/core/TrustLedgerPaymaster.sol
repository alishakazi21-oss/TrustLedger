// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@account-abstraction/contracts/interfaces/IPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/UserOperation.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TrustLedgerPaymaster
 * @dev Custom ERC-4337 Paymaster that sponsors gas fees for verified TrustLedger users.
 * Records gas metrics per user and supports admin sponsorship analytics.
 */
contract TrustLedgerPaymaster is IPaymaster, Ownable {
    IEntryPoint public immutable entryPoint;

    // Mapping from user/account to whitelist status
    mapping(address => bool) public isWhitelisted;

    // Telemetry: total gas cost sponsored per user (in wei)
    mapping(address => uint256) public gasSponsoredPerUser;
    uint256 public totalGasSponsored;
    uint256 public totalOperationsSponsored;

    event GasSponsored(address indexed sender, uint256 actualGasCost, uint256 timestamp);
    event WhitelistUpdated(address indexed target, bool status);
    event Deposited(uint256 amount);
    event Withdrawn(address indexed to, uint256 amount);

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "Paymaster: caller not EntryPoint");
        _;
    }

    constructor(IEntryPoint entryPoint_, address initialOwner) {
        entryPoint = entryPoint_;
        _transferOwnership(initialOwner);
    }

    /**
     * @notice Authorizes or revokes an address for sponsored gas.
     */
    function setWhitelist(address target, bool status) external onlyOwner {
        isWhitelisted[target] = status;
        emit WhitelistUpdated(target, status);
    }

    /**
     * @notice Batch set whitelist statuses.
     */
    function setWhitelistBatch(address[] calldata targets, bool status) external onlyOwner {
        for (uint256 i = 0; i < targets.length; i++) {
            isWhitelisted[targets[i]] = status;
            emit WhitelistUpdated(targets[i], status);
        }
    }

    /**
     * @notice Validate whether this paymaster agrees to sponsor the UserOp.
     */
    function validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /*userOpHash*/,
        uint256 maxCost
    ) external override returns (bytes memory context, uint256 validationData) {
        require(msg.sender == address(entryPoint), "Paymaster: not EntryPoint");

        // Verify that the sender is whitelisted or default sponsorship is enabled
        // In TrustLedger MVP, any account registered or whitelisted is sponsored
        address sender = userOp.sender;
        require(isWhitelisted[sender] || isWhitelisted[owner()], "Paymaster: sender not authorized for sponsorship");

        // Check paymaster deposit in EntryPoint
        uint256 deposit = entryPoint.balanceOf(address(this));
        require(deposit >= maxCost, "Paymaster: insufficient deposit in EntryPoint");

        // Context passed to postOp contains sender address
        context = abi.encode(sender);
        validationData = 0; // 0 = valid signature and conditions
    }

    /**
     * @notice Post-operation callback to record telemetry and gas consumption.
     */
    function postOp(
        PostOpMode /*mode*/,
        bytes calldata context,
        uint256 actualGasCost
    ) external override onlyEntryPoint {
        address sender = abi.decode(context, (address));

        gasSponsoredPerUser[sender] += actualGasCost;
        totalGasSponsored += actualGasCost;
        totalOperationsSponsored += 1;

        emit GasSponsored(sender, actualGasCost, block.timestamp);
    }

    /**
     * @notice Deposit funds into EntryPoint for sponsoring gas.
     */
    function deposit() public payable {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit Deposited(msg.value);
    }

    /**
     * @notice Withdraw funds from EntryPoint deposit back to recipient.
     */
    function withdrawTo(address payable target, uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(target, amount);
        emit Withdrawn(target, amount);
    }

    /**
     * @notice Query current deposit balance held by EntryPoint for this paymaster.
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    receive() external payable {
        deposit();
    }
}
