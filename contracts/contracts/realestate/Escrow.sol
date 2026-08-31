// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./PropertyRegistry.sol";

/**
 * @title Escrow
 * @dev Smart Escrow contract locking buyer funds until legal/identity verification
 * completes, then executing title conveyance and seller fund disbursement.
 */
contract Escrow is Ownable {
    enum DealState { Created, Funded, Approved, Completed, Refunded }

    struct Deal {
        bytes32 dealId;
        string propertyId;
        address buyer;
        address payable seller;
        uint256 amount;
        bytes32 targetDeedHash;
        DealState state;
        uint256 createdAt;
    }

    PropertyRegistry public propertyRegistry;
    mapping(bytes32 => Deal) public deals;

    event DealCreated(bytes32 indexed dealId, string propertyId, address indexed buyer, address indexed seller, uint256 amount);
    event DealFunded(bytes32 indexed dealId, uint256 amount);
    event DealApproved(bytes32 indexed dealId);
    event DealCompleted(bytes32 indexed dealId, address indexed newOwner, uint256 amountDisbursed);
    event DealRefunded(bytes32 indexed dealId, address indexed buyer, uint256 amount);

    constructor(PropertyRegistry propertyRegistry_) {
        propertyRegistry = propertyRegistry_;
        _transferOwnership(msg.sender);
    }

    /**
     * @notice Creates an escrow deal for a property transfer.
     */
    function createDeal(
        bytes32 dealId,
        string calldata propertyId,
        address buyer,
        address payable seller,
        uint256 amount,
        bytes32 targetDeedHash
    ) external onlyOwner {
        require(deals[dealId].dealId == bytes32(0), "Escrow: deal exists");
        require(buyer != address(0) && seller != address(0), "Escrow: invalid parties");

        deals[dealId] = Deal({
            dealId: dealId,
            propertyId: propertyId,
            buyer: buyer,
            seller: seller,
            amount: amount,
            targetDeedHash: targetDeedHash,
            state: DealState.Created,
            createdAt: block.timestamp
        });

        emit DealCreated(dealId, propertyId, buyer, seller, amount);
    }

    /**
     * @notice Buyer locks the agreed escrow deposit/purchase funds.
     */
    function depositFunds(bytes32 dealId) external payable {
        Deal storage deal = deals[dealId];
        require(deal.dealId != bytes32(0), "Escrow: deal not found");
        require(deal.state == DealState.Created, "Escrow: invalid state for funding");
        require(msg.value == deal.amount, "Escrow: incorrect fund amount");
        require(msg.sender == deal.buyer || msg.sender == owner(), "Escrow: caller not buyer/owner");

        deal.state = DealState.Funded;
        emit DealFunded(dealId, msg.value);
    }

    /**
     * @notice Approved signal from the TrustLedger verification consensus.
     * Disburses locked funds to seller and triggers on-chain title transfer to buyer.
     */
    function approveAndRelease(bytes32 dealId) external onlyOwner {
        Deal storage deal = deals[dealId];
        require(deal.state == DealState.Funded, "Escrow: deal not funded");

        deal.state = DealState.Completed;

        // Disburse funds to seller
        (bool sent, ) = deal.seller.call{value: deal.amount}("");
        require(sent, "Escrow: seller payout failed");

        // Execute ownership transfer on-chain
        propertyRegistry.transferProperty(
            deal.propertyId,
            deal.buyer,
            deal.targetDeedHash
        );

        emit DealCompleted(dealId, deal.buyer, deal.amount);
    }

    /**
     * @notice Refund buyer if legal inspection or verification fails.
     */
    function refundBuyer(bytes32 dealId) external onlyOwner {
        Deal storage deal = deals[dealId];
        require(deal.state == DealState.Funded, "Escrow: deal not funded");

        deal.state = DealState.Refunded;
        (bool sent, ) = payable(deal.buyer).call{value: deal.amount}("");
        require(sent, "Escrow: refund failed");

        emit DealRefunded(dealId, deal.buyer, deal.amount);
    }

    receive() external payable {}
}
