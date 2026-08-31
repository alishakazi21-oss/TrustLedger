// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyRegistry
 * @dev On-chain property registry recording cadastral title ownership and deed hashes.
 */
contract PropertyRegistry is Ownable {
    struct PropertyRecord {
        string propertyId;
        string parcelId;
        bytes32 deedHash;
        address currentOwner;
        uint256 versionNumber;
        uint256 lastUpdated;
        bool isRegistered;
    }

    // Mapping from off-chain property ID string to on-chain record
    mapping(string => PropertyRecord) private _properties;

    // Authorized Escrow contracts permitted to execute title transfers
    mapping(address => bool) public authorizedEscrows;

    event PropertyRegistered(
        string indexed propertyId,
        string parcelId,
        bytes32 deedHash,
        address indexed owner,
        uint256 timestamp
    );

    event PropertyTransferred(
        string indexed propertyId,
        address indexed priorOwner,
        address indexed newOwner,
        bytes32 newDeedHash,
        uint256 versionNumber,
        uint256 timestamp
    );

    event DeedHashUpdated(
        string indexed propertyId,
        bytes32 newDeedHash,
        uint256 versionNumber,
        uint256 timestamp
    );

    event EscrowAuthorizationUpdated(address indexed escrow, bool status);

    modifier onlyPropertyOwnerOrEscrow(string memory propertyId) {
        PropertyRecord memory prop = _properties[propertyId];
        require(prop.isRegistered, "PropertyRegistry: property not registered");
        require(
            msg.sender == prop.currentOwner || authorizedEscrows[msg.sender] || msg.sender == owner(),
            "PropertyRegistry: caller not owner, authorized escrow, or admin"
        );
        _;
    }

    constructor() {
        _transferOwnership(msg.sender);
    }

    function setEscrowAuthorization(address escrow, bool status) external onlyOwner {
        authorizedEscrows[escrow] = status;
        emit EscrowAuthorizationUpdated(escrow, status);
    }

    /**
     * @notice Register a newly minted or tokenized property on the cadastre.
     */
    function registerProperty(
        string calldata propertyId,
        string calldata parcelId,
        bytes32 deedHash,
        address initialOwner
    ) external onlyOwner {
        require(!_properties[propertyId].isRegistered, "PropertyRegistry: already registered");
        require(initialOwner != address(0), "PropertyRegistry: zero owner");

        _properties[propertyId] = PropertyRecord({
            propertyId: propertyId,
            parcelId: parcelId,
            deedHash: deedHash,
            currentOwner: initialOwner,
            versionNumber: 1,
            lastUpdated: block.timestamp,
            isRegistered: true
        });

        emit PropertyRegistered(propertyId, parcelId, deedHash, initialOwner, block.timestamp);
    }

    /**
     * @notice Transfer title ownership to a new buyer upon verified escrow settlement.
     */
    function transferProperty(
        string calldata propertyId,
        address newOwner,
        bytes32 newDeedHash
    ) external onlyPropertyOwnerOrEscrow(propertyId) {
        require(newOwner != address(0), "PropertyRegistry: invalid new owner");
        PropertyRecord storage prop = _properties[propertyId];
        address priorOwner = prop.currentOwner;

        prop.currentOwner = newOwner;
        prop.deedHash = newDeedHash;
        prop.versionNumber += 1;
        prop.lastUpdated = block.timestamp;

        emit PropertyTransferred(
            propertyId,
            priorOwner,
            newOwner,
            newDeedHash,
            prop.versionNumber,
            block.timestamp
        );
    }

    /**
     * @notice Update deed hash on cadastral amendment without transferring ownership.
     */
    function updateDeedHash(
        string calldata propertyId,
        bytes32 newDeedHash
    ) external onlyPropertyOwnerOrEscrow(propertyId) {
        PropertyRecord storage prop = _properties[propertyId];
        prop.deedHash = newDeedHash;
        prop.versionNumber += 1;
        prop.lastUpdated = block.timestamp;

        emit DeedHashUpdated(propertyId, newDeedHash, prop.versionNumber, block.timestamp);
    }

    /**
     * @notice Fetch on-chain property data.
     */
    function getProperty(string calldata propertyId) external view returns (PropertyRecord memory) {
        require(_properties[propertyId].isRegistered, "PropertyRegistry: not registered");
        return _properties[propertyId];
    }
}
