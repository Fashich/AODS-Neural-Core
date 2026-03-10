// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title AODSeVoting
 * @dev Secure e-Voting system for government and organizational elections
 * Features: anonymous voting, voter verification, result transparency, audit trail
 */
contract AODSeVoting is 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    EIP712 
{
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ELECTION_OFFICIAL_ROLE = keccak256("ELECTION_OFFICIAL_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // EIP-712 TypeHash for vote delegation
    bytes32 private constant DELEGATE_VOTE_TYPEHASH = keccak256(
        "DelegateVote(address voter,address delegate,uint256 electionId,uint256 nonce)"
    );

    enum ElectionType { GENERAL, PRESIDENTIAL, PARLIAMENTARY, LOCAL, REFERENDUM, ORGANIZATIONAL }
    enum ElectionStatus { PENDING, ACTIVE, PAUSED, CLOSED, FINALIZED }

    struct Candidate {
        uint256 candidateId;
        string name;
        string party;
        string manifestoCID;
        uint256 voteCount;
        bool isActive;
    }

    struct Election {
        uint256 electionId;
        string name;
        string description;
        ElectionType electionType;
        ElectionStatus status;
        uint256 startTime;
        uint256 endTime;
        uint256 candidateCount;
        uint256 totalVotes;
        mapping(uint256 => Candidate) candidates;
        mapping(address => bool) hasVoted;
        mapping(bytes32 => bool) nullifierHashes;
        mapping(address => address) voteDelegation;
        string metadataCID;
        bool resultsPublished;
        uint256 createdAt;
    }

    struct Voter {
        address voterAddress;
        bytes32 identityCommitment;
        bool isRegistered;
        bool isVerified;
        uint256 registrationTime;
        mapping(uint256 => bool) votedInElection;
    }

    struct VotingDistrict {
        uint256 districtId;
        string name;
        string region;
        uint256 registeredVoters;
        uint256 totalVotes;
        bool isActive;
    }

    // Mappings
    mapping(uint256 => Election) public elections;
    mapping(address => Voter) public voters;
    mapping(uint256 => VotingDistrict) public districts;
    mapping(bytes32 => bool) public usedNullifiers;
    mapping(address => mapping(uint256 => bool)) public voterElectionRegistration;
    mapping(uint256 => address[]) public electionVoters;
    mapping(address => uint256[]) public voterElections;

    // Counters
    uint256 public electionCounter;
    uint256 public voterCounter;
    uint256 public districtCounter;

    // Merkle Tree root for anonymous voting
    mapping(uint256 => bytes32) public merkleRoots;

    // Events
    event ElectionCreated(uint256 indexed electionId, string name, ElectionType electionType, uint256 startTime, uint256 endTime);
    event ElectionStarted(uint256 indexed electionId, uint256 startTime);
    event ElectionPaused(uint256 indexed electionId);
    event ElectionResumed(uint256 indexed electionId);
    event ElectionClosed(uint256 indexed electionId);
    event ElectionFinalized(uint256 indexed electionId);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed candidateId, string name, string party);
    event CandidateRemoved(uint256 indexed electionId, uint256 indexed candidateId);
    event VoterRegistered(address indexed voter, bytes32 identityCommitment, uint256 registrationTime);
    event VoterVerified(address indexed voter);
    event VoteCast(uint256 indexed electionId, bytes32 indexed nullifierHash, uint256 candidateId);
    event VoteDelegated(uint256 indexed electionId, address indexed voter, address indexed delegate);
    event ResultsPublished(uint256 indexed electionId, uint256 totalVotes);
    event DistrictCreated(uint256 indexed districtId, string name, string region);
    event VoterRegisteredInDistrict(address indexed voter, uint256 indexed districtId);

    modifier onlyElectionOfficial() {
        require(hasRole(ELECTION_OFFICIAL_ROLE, msg.sender), "Not an election official");
        _;
    }

    modifier onlyDuringElection(uint256 _electionId) {
        require(elections[_electionId].status == ElectionStatus.ACTIVE, "Election not active");
        require(block.timestamp >= elections[_electionId].startTime, "Election not started");
        require(block.timestamp <= elections[_electionId].endTime, "Election ended");
        _;
    }

    constructor() EIP712("AODSeVoting", "1") {}

    function initialize() public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ELECTION_OFFICIAL_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    // ==================== Election Management ====================

    function createElection(
        string memory _name,
        string memory _description,
        ElectionType _electionType,
        uint256 _startTime,
        uint256 _endTime,
        string memory _metadataCID
    ) external onlyElectionOfficial returns (uint256) {
        require(_startTime > block.timestamp, "Start time must be in future");
        require(_endTime > _startTime, "End time must be after start");
        require(bytes(_name).length > 0, "Name required");

        electionCounter++;
        uint256 electionId = electionCounter;

        Election storage election = elections[electionId];
        election.electionId = electionId;
        election.name = _name;
        election.description = _description;
        election.electionType = _electionType;
        election.status = ElectionStatus.PENDING;
        election.startTime = _startTime;
        election.endTime = _endTime;
        election.metadataCID = _metadataCID;
        election.createdAt = block.timestamp;

        emit ElectionCreated(electionId, _name, _electionType, _startTime, _endTime);
        return electionId;
    }

    function startElection(uint256 _electionId) external onlyElectionOfficial {
        Election storage election = elections[_electionId];
        require(election.status == ElectionStatus.PENDING, "Invalid status");
        require(block.timestamp >= election.startTime, "Start time not reached");
        require(election.candidateCount >= 2, "Need at least 2 candidates");

        election.status = ElectionStatus.ACTIVE;

        emit ElectionStarted(_electionId, block.timestamp);
    }

    function pauseElection(uint256 _electionId) external onlyElectionOfficial {
        Election storage election = elections[_electionId];
        require(election.status == ElectionStatus.ACTIVE, "Election not active");

        election.status = ElectionStatus.PAUSED;

        emit ElectionPaused(_electionId);
    }

    function resumeElection(uint256 _electionId) external onlyElectionOfficial {
        Election storage election = elections[_electionId];
        require(election.status == ElectionStatus.PAUSED, "Election not paused");
        require(block.timestamp <= election.endTime, "Election time expired");

        election.status = ElectionStatus.ACTIVE;

        emit ElectionResumed(_electionId);
    }

    function closeElection(uint256 _electionId) external onlyElectionOfficial {
        Election storage election = elections[_electionId];
        require(election.status == ElectionStatus.ACTIVE || election.status == ElectionStatus.PAUSED, "Invalid status");

        election.status = ElectionStatus.CLOSED;
        election.endTime = block.timestamp;

        emit ElectionClosed(_electionId);
    }

    function finalizeElection(uint256 _electionId) external onlyElectionOfficial {
        Election storage election = elections[_electionId];
        require(election.status == ElectionStatus.CLOSED, "Election not closed");
        require(!election.resultsPublished, "Results already published");

        election.status = ElectionStatus.FINALIZED;
        election.resultsPublished = true;

        emit ElectionFinalized(_electionId);
        emit ResultsPublished(_electionId, election.totalVotes);
    }

    // ==================== Candidate Management ====================

    function addCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _party,
        string memory _manifestoCID
    ) external onlyElectionOfficial returns (uint256) {
        Election storage election = elections[_electionId];
        require(election.status == ElectionStatus.PENDING, "Election not pending");
        require(bytes(_name).length > 0, "Name required");

        election.candidateCount++;
        uint256 candidateId = election.candidateCount;

        Candidate storage candidate = election.candidates[candidateId];
        candidate.candidateId = candidateId;
        candidate.name = _name;
        candidate.party = _party;
        candidate.manifestoCID = _manifestoCID;
        candidate.voteCount = 0;
        candidate.isActive = true;

        emit CandidateAdded(_electionId, candidateId, _name, _party);
        return candidateId;
    }

    function removeCandidate(uint256 _electionId, uint256 _candidateId) external onlyElectionOfficial {
        Election storage election = elections[_electionId];
        require(election.status == ElectionStatus.PENDING, "Election not pending");
        require(election.candidates[_candidateId].isActive, "Candidate not found");

        election.candidates[_candidateId].isActive = false;

        emit CandidateRemoved(_electionId, _candidateId);
    }

    // ==================== Voter Registration ====================

    function registerVoter(bytes32 _identityCommitment, uint256 _districtId) external returns (bool) {
        require(!voters[msg.sender].isRegistered, "Already registered");
        require(districts[_districtId].isActive, "Invalid district");

        voterCounter++;

        Voter storage voter = voters[msg.sender];
        voter.voterAddress = msg.sender;
        voter.identityCommitment = _identityCommitment;
        voter.isRegistered = true;
        voter.isVerified = false;
        voter.registrationTime = block.timestamp;

        districts[_districtId].registeredVoters++;

        emit VoterRegistered(msg.sender, _identityCommitment, block.timestamp);
        emit VoterRegisteredInDistrict(msg.sender, _districtId);
        return true;
    }

    function verifyVoter(address _voter) external onlyElectionOfficial returns (bool) {
        require(voters[_voter].isRegistered, "Voter not registered");
        require(!voters[_voter].isVerified, "Already verified");

        voters[_voter].isVerified = true;

        emit VoterVerified(_voter);
        return true;
    }

    function registerVoterForElection(uint256 _electionId, address _voter) external onlyElectionOfficial {
        require(elections[_electionId].status == ElectionStatus.PENDING, "Election not pending");
        require(voters[_voter].isVerified, "Voter not verified");
        require(!voterElectionRegistration[_voter][_electionId], "Already registered");

        voterElectionRegistration[_voter][_electionId] = true;
        voterElections[_voter].push(_electionId);
    }

    // ==================== Voting ====================

    function castVote(
        uint256 _electionId,
        uint256 _candidateId,
        bytes32 _nullifierHash,
        uint256[8] calldata _proof
    ) external onlyDuringElection(_electionId) nonReentrant returns (bool) {
        Election storage election = elections[_electionId];
        
        require(voterElectionRegistration[msg.sender][_electionId], "Not registered for election");
        require(!election.hasVoted[msg.sender], "Already voted");
        require(election.candidates[_candidateId].isActive, "Invalid candidate");
        require(!usedNullifiers[_nullifierHash], "Nullifier used");

        // Verify ZK proof (simplified - in production use proper verifier)
        require(verifyVoteProof(_proof, _nullifierHash, _electionId), "Invalid proof");

        // Mark as voted
        election.hasVoted[msg.sender] = true;
        election.nullifierHashes[_nullifierHash] = true;
        usedNullifiers[_nullifierHash] = true;
        election.candidates[_candidateId].voteCount++;
        election.totalVotes++;

        electionVoters[_electionId].push(msg.sender);

        emit VoteCast(_electionId, _nullifierHash, _candidateId);
        return true;
    }

    function verifyVoteProof(
        uint256[8] calldata _proof,
        bytes32 _nullifierHash,
        uint256 _electionId
    ) internal view returns (bool) {
        // In production, this would verify the ZK proof against the merkle root
        // For MVP, we do a simplified check
        return _proof[0] != 0 && merkleRoots[_electionId] != bytes32(0);
    }

    function setMerkleRoot(uint256 _electionId, bytes32 _merkleRoot) external onlyElectionOfficial {
        require(elections[_electionId].status == ElectionStatus.PENDING, "Election not pending");
        merkleRoots[_electionId] = _merkleRoot;
    }

    // ==================== Vote Delegation ====================

    function delegateVote(uint256 _electionId, address _delegate) external onlyDuringElection(_electionId) {
        require(voterElectionRegistration[msg.sender][_electionId], "Not registered");
        require(voterElectionRegistration[_delegate][_electionId], "Delegate not registered");
        require(_delegate != msg.sender, "Cannot delegate to self");
        require(!elections[_electionId].hasVoted[msg.sender], "Already voted");

        elections[_electionId].voteDelegation[msg.sender] = _delegate;

        emit VoteDelegated(_electionId, msg.sender, _delegate);
    }

    function castDelegatedVote(
        uint256 _electionId,
        uint256 _candidateId,
        address _originalVoter,
        bytes32 _nullifierHash,
        uint256[8] calldata _proof
    ) external onlyDuringElection(_electionId) nonReentrant returns (bool) {
        Election storage election = elections[_electionId];
        
        require(election.voteDelegation[_originalVoter] == msg.sender, "Not delegated");
        require(!election.hasVoted[_originalVoter], "Already voted");
        require(election.candidates[_candidateId].isActive, "Invalid candidate");
        require(!usedNullifiers[_nullifierHash], "Nullifier used");

        require(verifyVoteProof(_proof, _nullifierHash, _electionId), "Invalid proof");

        election.hasVoted[_originalVoter] = true;
        election.nullifierHashes[_nullifierHash] = true;
        usedNullifiers[_nullifierHash] = true;
        election.candidates[_candidateId].voteCount++;
        election.totalVotes++;

        emit VoteCast(_electionId, _nullifierHash, _candidateId);
        return true;
    }

    // ==================== District Management ====================

    function createDistrict(string memory _name, string memory _region) external onlyElectionOfficial returns (uint256) {
        districtCounter++;
        uint256 districtId = districtCounter;

        VotingDistrict storage district = districts[districtId];
        district.districtId = districtId;
        district.name = _name;
        district.region = _region;
        district.registeredVoters = 0;
        district.totalVotes = 0;
        district.isActive = true;

        emit DistrictCreated(districtId, _name, _region);
        return districtId;
    }

    // ==================== Results & Queries ====================

    function getElectionResults(uint256 _electionId) external view returns (
        uint256[] memory candidateIds,
        string[] memory names,
        uint256[] memory voteCounts,
        uint256 totalVotes
    ) {
        Election storage election = elections[_electionId];
        require(election.resultsPublished || hasRole(AUDITOR_ROLE, msg.sender), "Results not published");

        candidateIds = new uint256[](election.candidateCount);
        names = new string[](election.candidateCount);
        voteCounts = new uint256[](election.candidateCount);

        for (uint256 i = 1; i <= election.candidateCount; i++) {
            Candidate storage candidate = election.candidates[i];
            candidateIds[i-1] = candidate.candidateId;
            names[i-1] = candidate.name;
            voteCounts[i-1] = candidate.voteCount;
        }

        return (candidateIds, names, voteCounts, election.totalVotes);
    }

    function getElection(uint256 _electionId) external view returns (
        uint256 electionId,
        string memory name,
        string memory description,
        ElectionType electionType,
        ElectionStatus status,
        uint256 startTime,
        uint256 endTime,
        uint256 candidateCount,
        uint256 totalVotes,
        bool resultsPublished
    ) {
        Election storage election = elections[_electionId];
        return (
            election.electionId,
            election.name,
            election.description,
            election.electionType,
            election.status,
            election.startTime,
            election.endTime,
            election.candidateCount,
            election.totalVotes,
            election.resultsPublished
        );
    }

    function getCandidate(uint256 _electionId, uint256 _candidateId) external view returns (Candidate memory) {
        return elections[_electionId].candidates[_candidateId];
    }

    function getVoterStatus(address _voter, uint256 _electionId) external view returns (
        bool isRegistered,
        bool isVerified,
        bool hasVoted,
        bool isElectionRegistered
    ) {
        Voter storage voter = voters[_voter];
        return (
            voter.isRegistered,
            voter.isVerified,
            elections[_electionId].hasVoted[_voter],
            voterElectionRegistration[_voter][_electionId]
        );
    }

    function hasVoted(uint256 _electionId, address _voter) external view returns (bool) {
        return elections[_electionId].hasVoted[_voter];
    }

    function getElectionVoters(uint256 _electionId) external view onlyElectionOfficial returns (address[] memory) {
        return electionVoters[_electionId];
    }

    function getWinner(uint256 _electionId) external view returns (uint256 candidateId, string memory name, uint256 voteCount) {
        Election storage election = elections[_electionId];
        require(election.resultsPublished, "Results not published");

        uint256 maxVotes = 0;
        uint256 winnerId = 0;

        for (uint256 i = 1; i <= election.candidateCount; i++) {
            if (election.candidates[i].voteCount > maxVotes) {
                maxVotes = election.candidates[i].voteCount;
                winnerId = i;
            }
        }

        Candidate storage winner = election.candidates[winnerId];
        return (winner.candidateId, winner.name, winner.voteCount);
    }

    // ==================== Audit Functions ====================

    function auditElection(uint256 _electionId) external onlyRole(AUDITOR_ROLE) returns (
        uint256 totalRegistered,
        uint256 totalVoted,
        uint256 turnoutPercentage
    ) {
        Election storage election = elections[_electionId];
        
        totalVoted = election.totalVotes;
        totalRegistered = electionVoters[_electionId].length;
        
        if (totalRegistered > 0) {
            turnoutPercentage = (totalVoted * 100) / totalRegistered;
        }

        return (totalRegistered, totalVoted, turnoutPercentage);
    }

    function verifyVoteIntegrity(
        uint256 _electionId,
        bytes32 _nullifierHash
    ) external view onlyRole(AUDITOR_ROLE) returns (bool isValid, uint256 candidateId) {
        Election storage election = elections[_electionId];
        
        isValid = election.nullifierHashes[_nullifierHash];
        
        // Find which candidate received this vote
        for (uint256 i = 1; i <= election.candidateCount; i++) {
            // In a real implementation, we'd have a mapping from nullifier to candidate
            // This is simplified for the MVP
            candidateId = 0;
        }

        return (isValid, candidateId);
    }

    // ==================== Upgrade Authorization ====================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
