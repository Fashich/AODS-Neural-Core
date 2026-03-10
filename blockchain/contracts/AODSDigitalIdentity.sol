// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title AODSDigitalIdentity
 * @dev Self-sovereign digital identity with verifiable credentials
 * Features: identity verification, credential issuance, selective disclosure
 */
contract AODSDigitalIdentity is 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    EIP712 
{
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // EIP-712 TypeHashes
    bytes32 private constant CREDENTIAL_TYPEHASH = keccak256(
        "Credential(address subject,string credentialType,string dataHash,uint256 issuedAt,uint256 expiresAt,uint256 nonce)"
    );

    enum CredentialType { IDENTITY, AGE, ADDRESS, EDUCATION, EMPLOYMENT, FINANCIAL, HEALTH, GOVERNMENT }
    enum VerificationStatus { PENDING, VERIFIED, REJECTED, EXPIRED, REVOKED }

    struct Identity {
        address owner;
        bytes32 identityHash;
        string did;
        bool isActive;
        uint256 createdAt;
        uint256 lastUpdated;
        uint256 reputation;
        uint256 verificationLevel;
    }

    struct Credential {
        bytes32 credentialId;
        CredentialType credentialType;
        address subject;
        address issuer;
        string dataHash;
        string metadataCID;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevocable;
        bool isRevoked;
        uint256 revokedAt;
        bytes signature;
        VerificationStatus status;
    }

    struct VerificationRequest {
        bytes32 requestId;
        address requester;
        CredentialType credentialType;
        string proofData;
        VerificationStatus status;
        address verifier;
        string rejectionReason;
        uint256 requestedAt;
        uint256 verifiedAt;
    }

    struct ServiceProvider {
        address providerAddress;
        string name;
        string metadataCID;
        bool isActive;
        bool isVerified;
        uint256 registeredAt;
        mapping(CredentialType => bool) requiredCredentials;
    }

    struct Consent {
        address user;
        address serviceProvider;
        bytes32 credentialId;
        uint256 grantedAt;
        uint256 expiresAt;
        bool isActive;
        string[] disclosedFields;
    }

    // Mappings
    mapping(address => Identity) public identities;
    mapping(bytes32 => Credential) public credentials;
    mapping(bytes32 => VerificationRequest) public verificationRequests;
    mapping(address => ServiceProvider) public serviceProviders;
    mapping(address => mapping(bytes32 => Consent)) public consents;
    mapping(address => bytes32[]) public userCredentials;
    mapping(address => bytes32[]) public userVerificationRequests;
    mapping(CredentialType => mapping(address => bool)) public trustedIssuers;
    mapping(bytes32 => bool) public usedNonces;
    mapping(string => address) public didToAddress;

    // Counters
    uint256 public identityCounter;
    uint256 public credentialCounter;
    uint256 public verificationRequestCounter;

    // Events
    event IdentityCreated(address indexed owner, string did, bytes32 identityHash);
    event IdentityUpdated(address indexed owner, uint256 verificationLevel);
    event CredentialIssued(bytes32 indexed credentialId, CredentialType credentialType, address indexed subject, address indexed issuer);
    event CredentialRevoked(bytes32 indexed credentialId, uint256 revokedAt);
    event CredentialVerified(bytes32 indexed credentialId, VerificationStatus status);
    event VerificationRequested(bytes32 indexed requestId, address indexed requester, CredentialType credentialType);
    event VerificationApproved(bytes32 indexed requestId, address indexed verifier);
    event VerificationRejected(bytes32 indexed requestId, string reason);
    event ServiceProviderRegistered(address indexed provider, string name);
    event ServiceProviderVerified(address indexed provider);
    event ConsentGranted(address indexed user, address indexed serviceProvider, bytes32 credentialId);
    event ConsentRevoked(address indexed user, address indexed serviceProvider, bytes32 credentialId);
    event TrustedIssuerAdded(CredentialType credentialType, address issuer);
    event TrustedIssuerRemoved(CredentialType credentialType, address issuer);

    modifier onlyIdentityOwner() {
        require(identities[msg.sender].isActive, "Identity not found");
        _;
    }

    modifier onlyIssuer() {
        require(hasRole(ISSUER_ROLE, msg.sender), "Not an issuer");
        _;
    }

    modifier onlyVerifier() {
        require(hasRole(VERIFIER_ROLE, msg.sender), "Not a verifier");
        _;
    }

    constructor() EIP712("AODSDigitalIdentity", "1") {}

    function initialize() public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ISSUER_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    // ==================== Identity Management ====================

    function createIdentity(bytes32 _identityHash, string memory _did) external returns (bool) {
        require(!identities[msg.sender].isActive, "Identity already exists");
        require(bytes(_did).length > 0, "DID required");
        require(didToAddress[_did] == address(0), "DID already exists");

        identityCounter++;

        Identity storage identity = identities[msg.sender];
        identity.owner = msg.sender;
        identity.identityHash = _identityHash;
        identity.did = _did;
        identity.isActive = true;
        identity.createdAt = block.timestamp;
        identity.lastUpdated = block.timestamp;
        identity.reputation = 100;
        identity.verificationLevel = 0;

        didToAddress[_did] = msg.sender;

        emit IdentityCreated(msg.sender, _did, _identityHash);
        return true;
    }

    function updateIdentity(bytes32 _identityHash) external onlyIdentityOwner returns (bool) {
        Identity storage identity = identities[msg.sender];
        identity.identityHash = _identityHash;
        identity.lastUpdated = block.timestamp;

        emit IdentityUpdated(msg.sender, identity.verificationLevel);
        return true;
    }

    function deactivateIdentity() external onlyIdentityOwner {
        identities[msg.sender].isActive = false;
    }

    function reactivateIdentity() external {
        require(bytes(identities[msg.sender].did).length > 0, "Identity not found");
        identities[msg.sender].isActive = true;
    }

    function upgradeVerificationLevel(uint256 _newLevel) external onlyRole(ADMIN_ROLE) {
        identities[msg.sender].verificationLevel = _newLevel;
        emit IdentityUpdated(msg.sender, _newLevel);
    }

    // ==================== Credential Management ====================

    function issueCredential(
        address _subject,
        CredentialType _credentialType,
        string memory _dataHash,
        string memory _metadataCID,
        uint256 _expiresAt,
        bool _isRevocable,
        bytes memory _signature
    ) external onlyIssuer returns (bytes32) {
        require(identities[_subject].isActive, "Subject identity not found");
        require(trustedIssuers[_credentialType][msg.sender], "Not a trusted issuer for this type");

        credentialCounter++;
        bytes32 credentialId = keccak256(abi.encodePacked(
            _subject,
            msg.sender,
            _credentialType,
            block.timestamp,
            credentialCounter
        ));

        Credential storage credential = credentials[credentialId];
        credential.credentialId = credentialId;
        credential.credentialType = _credentialType;
        credential.subject = _subject;
        credential.issuer = msg.sender;
        credential.dataHash = _dataHash;
        credential.metadataCID = _metadataCID;
        credential.issuedAt = block.timestamp;
        credential.expiresAt = _expiresAt;
        credential.isRevocable = _isRevocable;
        credential.isRevoked = false;
        credential.signature = _signature;
        credential.status = VerificationStatus.VERIFIED;

        userCredentials[_subject].push(credentialId);

        emit CredentialIssued(credentialId, _credentialType, _subject, msg.sender);
        return credentialId;
    }

    function revokeCredential(bytes32 _credentialId) external {
        Credential storage credential = credentials[_credentialId];
        require(credential.issuer == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");
        require(credential.isRevocable, "Credential not revocable");
        require(!credential.isRevoked, "Already revoked");

        credential.isRevoked = true;
        credential.revokedAt = block.timestamp;
        credential.status = VerificationStatus.REVOKED;

        emit CredentialRevoked(_credentialId, block.timestamp);
    }

    function verifyCredential(bytes32 _credentialId) external view returns (
        bool isValid,
        CredentialType credentialType,
        address subject,
        address issuer,
        uint256 issuedAt,
        uint256 expiresAt,
        bool isRevoked
    ) {
        Credential storage credential = credentials[_credentialId];
        
        isValid = credential.status == VerificationStatus.VERIFIED &&
                  !credential.isRevoked &&
                  (credential.expiresAt == 0 || credential.expiresAt > block.timestamp);

        return (
            isValid,
            credential.credentialType,
            credential.subject,
            credential.issuer,
            credential.issuedAt,
            credential.expiresAt,
            credential.isRevoked
        );
    }

    function verifyCredentialSignature(
        bytes32 _credentialId,
        address _expectedIssuer
    ) external view returns (bool) {
        Credential storage credential = credentials[_credentialId];
        
        bytes32 structHash = keccak256(abi.encode(
            CREDENTIAL_TYPEHASH,
            credential.subject,
            credential.credentialType,
            keccak256(bytes(credential.dataHash)),
            credential.issuedAt,
            credential.expiresAt,
            uint256(credential.credentialId)
        ));

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(hash, credential.signature);

        return signer == _expectedIssuer && signer == credential.issuer;
    }

    // ==================== Verification Requests ====================

    function requestVerification(
        CredentialType _credentialType,
        string memory _proofData
    ) external onlyIdentityOwner returns (bytes32) {
        verificationRequestCounter++;
        bytes32 requestId = keccak256(abi.encodePacked(
            msg.sender,
            _credentialType,
            block.timestamp,
            verificationRequestCounter
        ));

        VerificationRequest storage request = verificationRequests[requestId];
        request.requestId = requestId;
        request.requester = msg.sender;
        request.credentialType = _credentialType;
        request.proofData = _proofData;
        request.status = VerificationStatus.PENDING;
        request.requestedAt = block.timestamp;

        userVerificationRequests[msg.sender].push(requestId);

        emit VerificationRequested(requestId, msg.sender, _credentialType);
        return requestId;
    }

    function approveVerification(bytes32 _requestId) external onlyVerifier {
        VerificationRequest storage request = verificationRequests[_requestId];
        require(request.status == VerificationStatus.PENDING, "Request not pending");

        request.status = VerificationStatus.VERIFIED;
        request.verifier = msg.sender;
        request.verifiedAt = block.timestamp;

        // Increase identity verification level
        Identity storage identity = identities[request.requester];
        identity.verificationLevel++;
        identity.reputation += 10;

        emit VerificationApproved(_requestId, msg.sender);
    }

    function rejectVerification(bytes32 _requestId, string memory _reason) external onlyVerifier {
        VerificationRequest storage request = verificationRequests[_requestId];
        require(request.status == VerificationStatus.PENDING, "Request not pending");

        request.status = VerificationStatus.REJECTED;
        request.verifier = msg.sender;
        request.rejectionReason = _reason;
        request.verifiedAt = block.timestamp;

        emit VerificationRejected(_requestId, _reason);
    }

    // ==================== Service Provider Management ====================

    function registerServiceProvider(
        string memory _name,
        string memory _metadataCID,
        CredentialType[] memory _requiredCredentials
    ) external returns (bool) {
        require(!serviceProviders[msg.sender].isActive, "Already registered");

        ServiceProvider storage provider = serviceProviders[msg.sender];
        provider.providerAddress = msg.sender;
        provider.name = _name;
        provider.metadataCID = _metadataCID;
        provider.isActive = true;
        provider.isVerified = false;
        provider.registeredAt = block.timestamp;

        for (uint256 i = 0; i < _requiredCredentials.length; i++) {
            provider.requiredCredentials[_requiredCredentials[i]] = true;
        }

        emit ServiceProviderRegistered(msg.sender, _name);
        return true;
    }

    function verifyServiceProvider(address _provider) external onlyRole(ADMIN_ROLE) {
        require(serviceProviders[_provider].isActive, "Provider not active");
        serviceProviders[_provider].isVerified = true;

        emit ServiceProviderVerified(_provider);
    }

    function checkServiceProviderRequirements(
        address _provider,
        address _user
    ) external view returns (bool hasAllRequirements, CredentialType[] memory missingCredentials) {
        ServiceProvider storage provider = serviceProviders[_provider];
        
        uint256 missingCount = 0;
        CredentialType[] memory tempMissing = new CredentialType[](10);

        for (uint256 i = 0; i < 10; i++) {
            CredentialType credType = CredentialType(i);
            if (provider.requiredCredentials[credType]) {
                bool hasCredential = false;
                bytes32[] memory userCreds = userCredentials[_user];
                
                for (uint256 j = 0; j < userCreds.length; j++) {
                    Credential storage cred = credentials[userCreds[j]];
                    if (cred.credentialType == credType && 
                        cred.status == VerificationStatus.VERIFIED &&
                        !cred.isRevoked &&
                        (cred.expiresAt == 0 || cred.expiresAt > block.timestamp)) {
                        hasCredential = true;
                        break;
                    }
                }

                if (!hasCredential) {
                    tempMissing[missingCount] = credType;
                    missingCount++;
                }
            }
        }

        hasAllRequirements = missingCount == 0;
        missingCredentials = new CredentialType[](missingCount);
        for (uint256 i = 0; i < missingCount; i++) {
            missingCredentials[i] = tempMissing[i];
        }

        return (hasAllRequirements, missingCredentials);
    }

    // ==================== Consent Management ====================

    function grantConsent(
        address _serviceProvider,
        bytes32 _credentialId,
        uint256 _duration,
        string[] memory _disclosedFields
    ) external onlyIdentityOwner {
        require(serviceProviders[_serviceProvider].isActive, "Provider not active");
        require(credentials[_credentialId].subject == msg.sender, "Not credential owner");

        Consent storage consent = consents[msg.sender][_credentialId];
        consent.user = msg.sender;
        consent.serviceProvider = _serviceProvider;
        consent.credentialId = _credentialId;
        consent.grantedAt = block.timestamp;
        consent.expiresAt = block.timestamp + _duration;
        consent.isActive = true;
        consent.disclosedFields = _disclosedFields;

        emit ConsentGranted(msg.sender, _serviceProvider, _credentialId);
    }

    function revokeConsent(address _serviceProvider, bytes32 _credentialId) external onlyIdentityOwner {
        Consent storage consent = consents[msg.sender][_credentialId];
        require(consent.serviceProvider == _serviceProvider, "Invalid provider");
        require(consent.isActive, "Consent not active");

        consent.isActive = false;

        emit ConsentRevoked(msg.sender, _serviceProvider, _credentialId);
    }

    function checkConsent(
        address _user,
        address _serviceProvider,
        bytes32 _credentialId
    ) external view returns (bool isValid, string[] memory disclosedFields) {
        Consent storage consent = consents[_user][_credentialId];
        
        isValid = consent.isActive &&
                  consent.serviceProvider == _serviceProvider &&
                  consent.expiresAt > block.timestamp;

        return (isValid, consent.disclosedFields);
    }

    // ==================== Trusted Issuer Management ====================

    function addTrustedIssuer(CredentialType _credentialType, address _issuer) external onlyRole(ADMIN_ROLE) {
        trustedIssuers[_credentialType][_issuer] = true;
        _grantRole(ISSUER_ROLE, _issuer);
        emit TrustedIssuerAdded(_credentialType, _issuer);
    }

    function removeTrustedIssuer(CredentialType _credentialType, address _issuer) external onlyRole(ADMIN_ROLE) {
        trustedIssuers[_credentialType][_issuer] = false;
        emit TrustedIssuerRemoved(_credentialType, _issuer);
    }

    function isTrustedIssuer(CredentialType _credentialType, address _issuer) external view returns (bool) {
        return trustedIssuers[_credentialType][_issuer];
    }

    // ==================== View Functions ====================

    function getIdentity(address _owner) external view returns (Identity memory) {
        return identities[_owner];
    }

    function getCredential(bytes32 _credentialId) external view returns (Credential memory) {
        return credentials[_credentialId];
    }

    function getUserCredentials(address _user) external view returns (bytes32[] memory) {
        return userCredentials[_user];
    }

    function getUserCredentialsByType(address _user, CredentialType _type) external view returns (bytes32[] memory) {
        bytes32[] memory allCreds = userCredentials[_user];
        bytes32[] memory temp = new bytes32[](allCreds.length);
        uint256 count = 0;

        for (uint256 i = 0; i < allCreds.length; i++) {
            if (credentials[allCreds[i]].credentialType == _type) {
                temp[count] = allCreds[i];
                count++;
            }
        }

        bytes32[] memory result = new bytes32[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = temp[i];
        }

        return result;
    }

    function getVerificationRequest(bytes32 _requestId) external view returns (VerificationRequest memory) {
        return verificationRequests[_requestId];
    }

    function getUserVerificationRequests(address _user) external view returns (bytes32[] memory) {
        return userVerificationRequests[_user];
    }

    function getServiceProvider(address _provider) external view returns (
        address providerAddress,
        string memory name,
        string memory metadataCID,
        bool isActive,
        bool isVerified,
        uint256 registeredAt
    ) {
        ServiceProvider storage provider = serviceProviders[_provider];
        return (
            provider.providerAddress,
            provider.name,
            provider.metadataCID,
            provider.isActive,
            provider.isVerified,
            provider.registeredAt
        );
    }

    function resolveDID(string memory _did) external view returns (address) {
        return didToAddress[_did];
    }

    function isCredentialValid(bytes32 _credentialId) external view returns (bool) {
        Credential storage credential = credentials[_credentialId];
        return credential.status == VerificationStatus.VERIFIED &&
               !credential.isRevoked &&
               (credential.expiresAt == 0 || credential.expiresAt > block.timestamp);
    }

    function getIdentityReputation(address _owner) external view returns (uint256) {
        return identities[_owner].reputation;
    }

    // ==================== Upgrade Authorization ====================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
