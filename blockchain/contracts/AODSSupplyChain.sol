// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AODSSupplyChain
 * @dev Supply Chain Management with Blockchain
 * - Product tracking
 * - Provenance verification
 * - Multi-party coordination
 * - IoT integration ready
 */
contract AODSSupplyChain is AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant CERTIFIER_ROLE = keccak256("CERTIFIER_ROLE");
    bytes32 public constant IOT_ORACLE_ROLE = keccak256("IOT_ORACLE_ROLE");

    Counters.Counter private _productIdCounter;

    enum ProductStatus { CREATED, MANUFACTURED, IN_TRANSIT, AT_WAREHOUSE, IN_STORE, SOLD, RECALLED }
    enum PartyType { MANUFACTURER, DISTRIBUTOR, RETAILER, CONSUMER }

    struct Product {
        uint256 id;
        string name;
        string description;
        string sku;
        address manufacturer;
        uint256 createdAt;
        uint256 expiryDate;
        ProductStatus status;
        string currentLocation;
        uint256 price;
        bool isAuthentic;
        string metadataURI;
    }

    struct TrackingEvent {
        uint256 timestamp;
        PartyType partyType;
        address party;
        string location;
        string action;
        string data;
        string documentHash;
    }

    struct Certificate {
        string certType; // ORGANIC, FAIR_TRADE, HALAL, etc.
        address issuer;
        uint256 issuedAt;
        uint256 expiresAt;
        string documentHash;
        bool valid;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => TrackingEvent[]) public productHistory;
    mapping(uint256 => Certificate[]) public productCertificates;
    mapping(string => uint256) public skuToProductId;
    mapping(address => bool) public registeredParties;
    mapping(address => PartyType) public partyTypes;

    // IoT sensor data
    struct SensorData {
        uint256 timestamp;
        int256 temperature; // Celsius * 100 (2 decimal places)
        uint256 humidity; // Percentage * 100
        uint256 shock; // G-force * 100
        bool tamperDetected;
        string location;
    }

    mapping(uint256 => SensorData[]) public productSensorData;

    // Events
    event ProductCreated(uint256 productId, string name, string sku, address manufacturer);
    event ProductStatusUpdated(uint256 productId, ProductStatus status, string location);
    event TrackingEventAdded(uint256 productId, PartyType partyType, string action);
    event CertificateAdded(uint256 productId, string certType, address issuer);
    event SensorDataAdded(uint256 productId, int256 temperature, uint256 humidity);
    event ProductRecalled(uint256 productId, string reason);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE, msg.sender);
    }

    // Party registration
    function registerParty(address party, PartyType partyType_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registeredParties[party] = true;
        partyTypes[party] = partyType_;

        if (partyType_ == PartyType.MANUFACTURER) {
            _grantRole(MANUFACTURER_ROLE, party);
        } else if (partyType_ == PartyType.DISTRIBUTOR) {
            _grantRole(DISTRIBUTOR_ROLE, party);
        } else if (partyType_ == PartyType.RETAILER) {
            _grantRole(RETAILER_ROLE, party);
        }
    }

    // Product creation
    function createProduct(
        string memory name,
        string memory description,
        string memory sku,
        uint256 expiryDate,
        uint256 price,
        string memory metadataURI
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        require(bytes(sku).length > 0, "SupplyChain: SKU required");
        require(skuToProductId[sku] == 0, "SupplyChain: SKU exists");

        _productIdCounter.increment();
        uint256 productId = _productIdCounter.current();

        products[productId] = Product({
            id: productId,
            name: name,
            description: description,
            sku: sku,
            manufacturer: msg.sender,
            createdAt: block.timestamp,
            expiryDate: expiryDate,
            status: ProductStatus.CREATED,
            currentLocation: "",
            price: price,
            isAuthentic: true,
            metadataURI: metadataURI
        });

        skuToProductId[sku] = productId;

        emit ProductCreated(productId, name, sku, msg.sender);
        return productId;
    }

    // Update product status
    function updateStatus(
        uint256 productId,
        ProductStatus newStatus,
        string memory location,
        string memory actionData
    ) external {
        require(products[productId].id != 0, "SupplyChain: Product not found");
        require(registeredParties[msg.sender], "SupplyChain: Not registered");

        Product storage product = products[productId];
        PartyType partyType = partyTypes[msg.sender];

        // Validate status transition
        require(_isValidStatusTransition(product.status, newStatus), "SupplyChain: Invalid transition");

        product.status = newStatus;
        product.currentLocation = location;

        // Add tracking event
        productHistory[productId].push(TrackingEvent({
            timestamp: block.timestamp,
            partyType: partyType,
            party: msg.sender,
            location: location,
            action: _getActionName(newStatus),
            data: actionData,
            documentHash: ""
        }));

        emit ProductStatusUpdated(productId, newStatus, location);
        emit TrackingEventAdded(productId, partyType, _getActionName(newStatus));
    }

    function _isValidStatusTransition(ProductStatus current, ProductStatus next) internal pure returns (bool) {
        if (current == ProductStatus.CREATED) return next == ProductStatus.MANUFACTURED;
        if (current == ProductStatus.MANUFACTURED) return next == ProductStatus.IN_TRANSIT;
        if (current == ProductStatus.IN_TRANSIT) return next == ProductStatus.AT_WAREHOUSE;
        if (current == ProductStatus.AT_WAREHOUSE) return next == ProductStatus.IN_TRANSIT || next == ProductStatus.IN_STORE;
        if (current == ProductStatus.IN_STORE) return next == ProductStatus.SOLD;
        return false;
    }

    function _getActionName(ProductStatus status) internal pure returns (string memory) {
        if (status == ProductStatus.CREATED) return "CREATED";
        if (status == ProductStatus.MANUFACTURED) return "MANUFACTURED";
        if (status == ProductStatus.IN_TRANSIT) return "IN_TRANSIT";
        if (status == ProductStatus.AT_WAREHOUSE) return "AT_WAREHOUSE";
        if (status == ProductStatus.IN_STORE) return "IN_STORE";
        if (status == ProductStatus.SOLD) return "SOLD";
        return "UNKNOWN";
    }

    // Add certificate
    function addCertificate(
        uint256 productId,
        string memory certType,
        uint256 expiresAt,
        string memory documentHash
    ) external onlyRole(CERTIFIER_ROLE) {
        require(products[productId].id != 0, "SupplyChain: Product not found");

        productCertificates[productId].push(Certificate({
            certType: certType,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            expiresAt: expiresAt,
            documentHash: documentHash,
            valid: true
        }));

        emit CertificateAdded(productId, certType, msg.sender);
    }

    // IoT sensor data
    function addSensorData(
        uint256 productId,
        int256 temperature,
        uint256 humidity,
        uint256 shock,
        bool tamperDetected,
        string memory location
    ) external onlyRole(IOT_ORACLE_ROLE) {
        require(products[productId].id != 0, "SupplyChain: Product not found");

        productSensorData[productId].push(SensorData({
            timestamp: block.timestamp,
            temperature: temperature,
            humidity: humidity,
            shock: shock,
            tamperDetected: tamperDetected,
            location: location
        }));

        emit SensorDataAdded(productId, temperature, humidity);

        // Auto-recall if conditions are bad
        if (tamperDetected || temperature > 4000 || shock > 500) { // 40°C or 5G shock
            _recallProduct(productId, "Sensor alert: Bad conditions detected");
        }
    }

    // Product recall
    function recallProduct(uint256 productId, string memory reason) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _recallProduct(productId, reason);
    }

    function _recallProduct(uint256 productId, string memory reason) internal {
        Product storage product = products[productId];
        require(product.status != ProductStatus.SOLD, "SupplyChain: Already sold");
        
        product.status = ProductStatus.RECALLED;
        product.isAuthentic = false;

        emit ProductRecalled(productId, reason);
    }

    // Verify authenticity
    function verifyAuthenticity(uint256 productId) external view returns (bool) {
        Product memory product = products[productId];
        if (product.id == 0) return false;
        if (!product.isAuthentic) return false;
        if (product.status == ProductStatus.RECALLED) return false;
        if (product.expiryDate > 0 && block.timestamp > product.expiryDate) return false;
        return true;
    }

    // Get product journey
    function getProductJourney(uint256 productId) external view returns (TrackingEvent[] memory) {
        return productHistory[productId];
    }

    // Get sensor data
    function getSensorData(uint256 productId) external view returns (SensorData[] memory) {
        return productSensorData[productId];
    }

    // Get certificates
    function getCertificates(uint256 productId) external view returns (Certificate[] memory) {
        return productCertificates[productId];
    }

    // Scan by SKU
    function scanBySKU(string memory sku) external view returns (Product memory, bool) {
        uint256 productId = skuToProductId[sku];
        if (productId == 0) {
            return (Product(0, "", "", "", address(0), 0, 0, ProductStatus.CREATED, "", 0, false, ""), false);
        }
        return (products[productId], verifyAuthenticity(productId));
    }

    // Batch operations
    function batchUpdateStatus(
        uint256[] calldata productIds,
        ProductStatus newStatus,
        string memory location
    ) external {
        for (uint i = 0; i < productIds.length; i++) {
            updateStatus(productIds[i], newStatus, location, "");
        }
    }
}
