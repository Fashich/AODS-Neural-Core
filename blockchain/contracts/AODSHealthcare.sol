// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title AODSHealthcare
 * @dev Healthcare data management with HIPAA-compliant privacy controls
 * Medical records, prescriptions, appointments, and insurance claims
 */
contract AODSHealthcare is 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    EIP712 
{
    using ECDSA for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");
    bytes32 public constant INSURER_ROLE = keccak256("INSURER_ROLE");
    bytes32 public constant PHARMACY_ROLE = keccak256("PHARMACY_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // EIP-712 TypeHashes
    bytes32 private constant PRESCRIPTION_TYPEHASH = keccak256(
        "Prescription(address patient,address doctor,string medication,uint256 dosage,uint256 frequency,uint256 duration,uint256 nonce)"
    );
    bytes32 private constant MEDICAL_RECORD_TYPEHASH = keccak256(
        "MedicalRecord(address patient,string recordHash,uint256 recordType,uint256 timestamp,uint256 nonce)"
    );

    enum RecordType { GENERAL, LAB_RESULT, IMAGING, VACCINATION, ALLERGY, SURGERY, MENTAL_HEALTH }
    enum AppointmentStatus { SCHEDULED, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW }
    enum ClaimStatus { PENDING, APPROVED, REJECTED, PAID }

    struct MedicalRecord {
        bytes32 recordId;
        address patient;
        address doctor;
        string encryptedDataHash;
        string dataCID;
        RecordType recordType;
        uint256 timestamp;
        bool isActive;
        mapping(address => bool) authorizedViewers;
        bytes32 previousRecord;
    }

    struct Prescription {
        bytes32 prescriptionId;
        address patient;
        address doctor;
        string medication;
        string dosage;
        string frequency;
        uint256 duration;
        string instructions;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isFilled;
        address filledBy;
        uint256 filledAt;
        bool isActive;
    }

    struct Appointment {
        bytes32 appointmentId;
        address patient;
        address doctor;
        uint256 scheduledAt;
        uint256 duration;
        string reason;
        string notes;
        AppointmentStatus status;
        bool isTelemedicine;
        string meetingLink;
        uint256 createdAt;
    }

    struct InsuranceClaim {
        bytes32 claimId;
        address patient;
        address provider;
        address insurer;
        bytes32[] recordIds;
        uint256 amount;
        string description;
        ClaimStatus status;
        string rejectionReason;
        uint256 submittedAt;
        uint256 processedAt;
    }

    struct PatientProfile {
        address patientAddress;
        string encryptedProfileHash;
        string emergencyContact;
        string bloodType;
        string[] allergies;
        string[] chronicConditions;
        bool isActive;
        uint256 createdAt;
        uint256 lastUpdated;
    }

    struct DoctorProfile {
        address doctorAddress;
        string licenseNumber;
        string specialty;
        string institution;
        string encryptedCredentials;
        bool isVerified;
        uint256 verificationTime;
        uint256 rating;
        uint256 reviewCount;
    }

    // Mappings
    mapping(bytes32 => MedicalRecord) public medicalRecords;
    mapping(bytes32 => Prescription) public prescriptions;
    mapping(bytes32 => Appointment) public appointments;
    mapping(bytes32 => InsuranceClaim) public insuranceClaims;
    mapping(address => PatientProfile) public patientProfiles;
    mapping(address => DoctorProfile) public doctorProfiles;
    mapping(address => bytes32[]) public patientRecords;
    mapping(address => bytes32[]) public patientPrescriptions;
    mapping(address => bytes32[]) public patientAppointments;
    mapping(address => bytes32[]) public doctorAppointments;
    mapping(address => bytes32[]) public patientClaims;
    mapping(address => mapping(address => bool)) public doctorPatientAuthorization;
    mapping(address => mapping(address => uint256)) public authorizationExpiry;
    mapping(bytes32 => bool) public usedNonces;

    // Counters
    uint256 public recordCounter;
    uint256 public prescriptionCounter;
    uint256 public appointmentCounter;
    uint256 public claimCounter;

    // Events
    event MedicalRecordCreated(bytes32 indexed recordId, address indexed patient, address indexed doctor, RecordType recordType);
    event MedicalRecordUpdated(bytes32 indexed recordId, string newDataHash);
    event MedicalRecordAccessGranted(bytes32 indexed recordId, address indexed viewer, uint256 expiry);
    event MedicalRecordAccessRevoked(bytes32 indexed recordId, address indexed viewer);
    event PrescriptionIssued(bytes32 indexed prescriptionId, address indexed patient, address indexed doctor);
    event PrescriptionFilled(bytes32 indexed prescriptionId, address indexed pharmacy);
    event AppointmentScheduled(bytes32 indexed appointmentId, address indexed patient, address indexed doctor, uint256 scheduledAt);
    event AppointmentStatusUpdated(bytes32 indexed appointmentId, AppointmentStatus status);
    event InsuranceClaimSubmitted(bytes32 indexed claimId, address indexed patient, address indexed insurer, uint256 amount);
    event InsuranceClaimProcessed(bytes32 indexed claimId, ClaimStatus status, uint256 processedAt);
    event PatientProfileCreated(address indexed patient);
    event PatientProfileUpdated(address indexed patient);
    event DoctorRegistered(address indexed doctor, string licenseNumber);
    event DoctorVerified(address indexed doctor);
    event AuthorizationGranted(address indexed patient, address indexed doctor, uint256 expiry);
    event AuthorizationRevoked(address indexed patient, address indexed doctor);

    modifier onlyPatient() {
        require(hasRole(PATIENT_ROLE, msg.sender), "Not a patient");
        _;
    }

    modifier onlyDoctor() {
        require(hasRole(DOCTOR_ROLE, msg.sender), "Not a doctor");
        _;
    }

    modifier onlyAuthorizedDoctor(address _patient) {
        require(
            hasRole(DOCTOR_ROLE, msg.sender) && 
            (doctorPatientAuthorization[_patient][msg.sender] || msg.sender == patientProfiles[_patient].patientAddress),
            "Not authorized"
        );
        _;
    }

    constructor() EIP712("AODSHealthcare", "1") {}

    function initialize() public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);
    }

    // ==================== Patient Management ====================

    function createPatientProfile(
        string memory _encryptedProfileHash,
        string memory _emergencyContact,
        string memory _bloodType
    ) external returns (bool) {
        require(!patientProfiles[msg.sender].isActive, "Profile already exists");
        
        _grantRole(PATIENT_ROLE, msg.sender);

        PatientProfile storage profile = patientProfiles[msg.sender];
        profile.patientAddress = msg.sender;
        profile.encryptedProfileHash = _encryptedProfileHash;
        profile.emergencyContact = _emergencyContact;
        profile.bloodType = _bloodType;
        profile.isActive = true;
        profile.createdAt = block.timestamp;
        profile.lastUpdated = block.timestamp;

        emit PatientProfileCreated(msg.sender);
        return true;
    }

    function updatePatientProfile(
        string memory _encryptedProfileHash,
        string memory _emergencyContact,
        string memory _bloodType
    ) external onlyPatient returns (bool) {
        PatientProfile storage profile = patientProfiles[msg.sender];
        profile.encryptedProfileHash = _encryptedProfileHash;
        profile.emergencyContact = _emergencyContact;
        profile.bloodType = _bloodType;
        profile.lastUpdated = block.timestamp;

        emit PatientProfileUpdated(msg.sender);
        return true;
    }

    function addAllergy(string memory _allergy) external onlyPatient {
        patientProfiles[msg.sender].allergies.push(_allergy);
        patientProfiles[msg.sender].lastUpdated = block.timestamp;
    }

    function addChronicCondition(string memory _condition) external onlyPatient {
        patientProfiles[msg.sender].chronicConditions.push(_condition);
        patientProfiles[msg.sender].lastUpdated = block.timestamp;
    }

    // ==================== Doctor Management ====================

    function registerDoctor(
        string memory _licenseNumber,
        string memory _specialty,
        string memory _institution,
        string memory _encryptedCredentials
    ) external returns (bool) {
        require(!doctorProfiles[msg.sender].isVerified, "Already registered");

        _grantRole(DOCTOR_ROLE, msg.sender);

        DoctorProfile storage profile = doctorProfiles[msg.sender];
        profile.doctorAddress = msg.sender;
        profile.licenseNumber = _licenseNumber;
        profile.specialty = _specialty;
        profile.institution = _institution;
        profile.encryptedCredentials = _encryptedCredentials;
        profile.isVerified = false;

        emit DoctorRegistered(msg.sender, _licenseNumber);
        return true;
    }

    function verifyDoctor(address _doctor) external onlyRole(ADMIN_ROLE) returns (bool) {
        require(hasRole(DOCTOR_ROLE, _doctor), "Not a doctor");
        require(!doctorProfiles[_doctor].isVerified, "Already verified");

        doctorProfiles[_doctor].isVerified = true;
        doctorProfiles[_doctor].verificationTime = block.timestamp;

        emit DoctorVerified(_doctor);
        return true;
    }

    // ==================== Authorization Management ====================

    function grantAuthorization(address _doctor, uint256 _duration) external onlyPatient {
        require(doctorProfiles[_doctor].isVerified, "Doctor not verified");
        require(_duration > 0 && _duration <= 365 days, "Invalid duration");

        doctorPatientAuthorization[msg.sender][_doctor] = true;
        authorizationExpiry[msg.sender][_doctor] = block.timestamp + _duration;

        emit AuthorizationGranted(msg.sender, _doctor, authorizationExpiry[msg.sender][_doctor]);
    }

    function revokeAuthorization(address _doctor) external onlyPatient {
        doctorPatientAuthorization[msg.sender][_doctor] = false;
        authorizationExpiry[msg.sender][_doctor] = 0;

        emit AuthorizationRevoked(msg.sender, _doctor);
    }

    function checkAuthorization(address _patient, address _doctor) public view returns (bool) {
        return doctorPatientAuthorization[_patient][_doctor] && 
               authorizationExpiry[_patient][_doctor] > block.timestamp;
    }

    // ==================== Medical Records ====================

    function createMedicalRecord(
        address _patient,
        string memory _encryptedDataHash,
        string memory _dataCID,
        RecordType _recordType
    ) external onlyDoctor returns (bytes32) {
        require(patientProfiles[_patient].isActive, "Patient not registered");
        require(checkAuthorization(_patient, msg.sender), "Not authorized");

        recordCounter++;
        bytes32 recordId = keccak256(abi.encodePacked(_patient, msg.sender, block.timestamp, recordCounter));

        MedicalRecord storage record = medicalRecords[recordId];
        record.recordId = recordId;
        record.patient = _patient;
        record.doctor = msg.sender;
        record.encryptedDataHash = _encryptedDataHash;
        record.dataCID = _dataCID;
        record.recordType = _recordType;
        record.timestamp = block.timestamp;
        record.isActive = true;
        record.authorizedViewers[_patient] = true;
        record.authorizedViewers[msg.sender] = true;

        patientRecords[_patient].push(recordId);

        emit MedicalRecordCreated(recordId, _patient, msg.sender, _recordType);
        return recordId;
    }

    function updateMedicalRecord(
        bytes32 _recordId,
        string memory _newEncryptedDataHash,
        string memory _newDataCID
    ) external {
        MedicalRecord storage record = medicalRecords[_recordId];
        require(record.isActive, "Record not found");
        require(record.doctor == msg.sender || hasRole(ADMIN_ROLE, msg.sender), "Not authorized");

        record.previousRecord = keccak256(abi.encode(record));
        record.encryptedDataHash = _newEncryptedDataHash;
        record.dataCID = _newDataCID;
        record.timestamp = block.timestamp;

        emit MedicalRecordUpdated(_recordId, _newEncryptedDataHash);
    }

    function grantRecordAccess(bytes32 _recordId, address _viewer, uint256 _duration) external onlyPatient {
        MedicalRecord storage record = medicalRecords[_recordId];
        require(record.patient == msg.sender, "Not record owner");
        require(record.isActive, "Record not active");

        record.authorizedViewers[_viewer] = true;

        emit MedicalRecordAccessGranted(_recordId, _viewer, block.timestamp + _duration);
    }

    function revokeRecordAccess(bytes32 _recordId, address _viewer) external onlyPatient {
        MedicalRecord storage record = medicalRecords[_recordId];
        require(record.patient == msg.sender, "Not record owner");

        record.authorizedViewers[_viewer] = false;

        emit MedicalRecordAccessRevoked(_recordId, _viewer);
    }

    function canViewRecord(bytes32 _recordId, address _viewer) public view returns (bool) {
        MedicalRecord storage record = medicalRecords[_recordId];
        return record.authorizedViewers[_viewer] || 
               (record.patient == _viewer) ||
               (record.doctor == _viewer && checkAuthorization(record.patient, _viewer));
    }

    function getPatientRecords(address _patient) external view returns (bytes32[] memory) {
        require(
            msg.sender == _patient || 
            checkAuthorization(_patient, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return patientRecords[_patient];
    }

    // ==================== Prescriptions ====================

    function issuePrescription(
        address _patient,
        string memory _medication,
        string memory _dosage,
        string memory _frequency,
        uint256 _duration,
        string memory _instructions
    ) external onlyDoctor returns (bytes32) {
        require(patientProfiles[_patient].isActive, "Patient not registered");
        require(checkAuthorization(_patient, msg.sender), "Not authorized");

        prescriptionCounter++;
        bytes32 prescriptionId = keccak256(abi.encodePacked(_patient, msg.sender, block.timestamp, prescriptionCounter));

        Prescription storage prescription = prescriptions[prescriptionId];
        prescription.prescriptionId = prescriptionId;
        prescription.patient = _patient;
        prescription.doctor = msg.sender;
        prescription.medication = _medication;
        prescription.dosage = _dosage;
        prescription.frequency = _frequency;
        prescription.duration = _duration;
        prescription.instructions = _instructions;
        prescription.issuedAt = block.timestamp;
        prescription.expiresAt = block.timestamp + (_duration * 1 days);
        prescription.isActive = true;

        patientPrescriptions[_patient].push(prescriptionId);

        emit PrescriptionIssued(prescriptionId, _patient, msg.sender);
        return prescriptionId;
    }

    function fillPrescription(bytes32 _prescriptionId) external onlyRole(PHARMACY_ROLE) {
        Prescription storage prescription = prescriptions[_prescriptionId];
        require(prescription.isActive, "Prescription not found");
        require(!prescription.isFilled, "Already filled");
        require(block.timestamp <= prescription.expiresAt, "Prescription expired");

        prescription.isFilled = true;
        prescription.filledBy = msg.sender;
        prescription.filledAt = block.timestamp;

        emit PrescriptionFilled(_prescriptionId, msg.sender);
    }

    function getPatientPrescriptions(address _patient) external view returns (bytes32[] memory) {
        require(
            msg.sender == _patient || 
            checkAuthorization(_patient, msg.sender) ||
            hasRole(PHARMACY_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return patientPrescriptions[_patient];
    }

    // ==================== Appointments ====================

    function scheduleAppointment(
        address _doctor,
        uint256 _scheduledAt,
        uint256 _duration,
        string memory _reason,
        bool _isTelemedicine,
        string memory _meetingLink
    ) external onlyPatient returns (bytes32) {
        require(doctorProfiles[_doctor].isVerified, "Doctor not verified");
        require(_scheduledAt > block.timestamp, "Invalid time");

        appointmentCounter++;
        bytes32 appointmentId = keccak256(abi.encodePacked(msg.sender, _doctor, _scheduledAt, appointmentCounter));

        Appointment storage appointment = appointments[appointmentId];
        appointment.appointmentId = appointmentId;
        appointment.patient = msg.sender;
        appointment.doctor = _doctor;
        appointment.scheduledAt = _scheduledAt;
        appointment.duration = _duration;
        appointment.reason = _reason;
        appointment.status = AppointmentStatus.SCHEDULED;
        appointment.isTelemedicine = _isTelemedicine;
        appointment.meetingLink = _meetingLink;
        appointment.createdAt = block.timestamp;

        patientAppointments[msg.sender].push(appointmentId);
        doctorAppointments[_doctor].push(appointmentId);

        emit AppointmentScheduled(appointmentId, msg.sender, _doctor, _scheduledAt);
        return appointmentId;
    }

    function confirmAppointment(bytes32 _appointmentId) external onlyDoctor {
        Appointment storage appointment = appointments[_appointmentId];
        require(appointment.doctor == msg.sender, "Not your appointment");
        require(appointment.status == AppointmentStatus.SCHEDULED, "Invalid status");

        appointment.status = AppointmentStatus.CONFIRMED;

        emit AppointmentStatusUpdated(_appointmentId, AppointmentStatus.CONFIRMED);
    }

    function completeAppointment(bytes32 _appointmentId, string memory _notes) external onlyDoctor {
        Appointment storage appointment = appointments[_appointmentId];
        require(appointment.doctor == msg.sender, "Not your appointment");
        require(appointment.status == AppointmentStatus.CONFIRMED, "Invalid status");

        appointment.status = AppointmentStatus.COMPLETED;
        appointment.notes = _notes;

        emit AppointmentStatusUpdated(_appointmentId, AppointmentStatus.COMPLETED);
    }

    function cancelAppointment(bytes32 _appointmentId) external {
        Appointment storage appointment = appointments[_appointmentId];
        require(
            appointment.patient == msg.sender || appointment.doctor == msg.sender,
            "Not authorized"
        );
        require(
            appointment.status == AppointmentStatus.SCHEDULED || 
            appointment.status == AppointmentStatus.CONFIRMED,
            "Cannot cancel"
        );

        appointment.status = AppointmentStatus.CANCELLED;

        emit AppointmentStatusUpdated(_appointmentId, AppointmentStatus.CANCELLED);
    }

    function getPatientAppointments(address _patient) external view returns (bytes32[] memory) {
        require(
            msg.sender == _patient || 
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return patientAppointments[_patient];
    }

    function getDoctorAppointments(address _doctor) external view returns (bytes32[] memory) {
        require(
            msg.sender == _doctor || 
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return doctorAppointments[_doctor];
    }

    // ==================== Insurance Claims ====================

    function submitInsuranceClaim(
        address _insurer,
        bytes32[] memory _recordIds,
        uint256 _amount,
        string memory _description
    ) external onlyPatient returns (bytes32) {
        require(hasRole(INSURER_ROLE, _insurer), "Invalid insurer");

        claimCounter++;
        bytes32 claimId = keccak256(abi.encodePacked(msg.sender, _insurer, block.timestamp, claimCounter));

        InsuranceClaim storage claim = insuranceClaims[claimId];
        claim.claimId = claimId;
        claim.patient = msg.sender;
        claim.provider = msg.sender;
        claim.insurer = _insurer;
        claim.recordIds = _recordIds;
        claim.amount = _amount;
        claim.description = _description;
        claim.status = ClaimStatus.PENDING;
        claim.submittedAt = block.timestamp;

        patientClaims[msg.sender].push(claimId);

        emit InsuranceClaimSubmitted(claimId, msg.sender, _insurer, _amount);
        return claimId;
    }

    function processClaim(bytes32 _claimId, ClaimStatus _status, string memory _rejectionReason) external onlyRole(INSURER_ROLE) {
        InsuranceClaim storage claim = insuranceClaims[_claimId];
        require(claim.insurer == msg.sender, "Not your claim");
        require(claim.status == ClaimStatus.PENDING, "Already processed");

        claim.status = _status;
        claim.processedAt = block.timestamp;
        
        if (_status == ClaimStatus.REJECTED) {
            claim.rejectionReason = _rejectionReason;
        }

        emit InsuranceClaimProcessed(_claimId, _status, block.timestamp);
    }

    function getPatientClaims(address _patient) external view returns (bytes32[] memory) {
        require(
            msg.sender == _patient || 
            hasRole(INSURER_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return patientClaims[_patient];
    }

    // ==================== Emergency Access ====================

    function emergencyAccess(address _patient) external onlyRole(ADMIN_ROLE) returns (bytes32[] memory) {
        require(patientProfiles[_patient].isActive, "Patient not registered");
        
        // In emergency, admin can access all records
        // This should be logged and audited
        return patientRecords[_patient];
    }

    // ==================== View Functions ====================

    function getMedicalRecord(bytes32 _recordId) external view returns (
        bytes32 recordId,
        address patient,
        address doctor,
        string memory encryptedDataHash,
        string memory dataCID,
        RecordType recordType,
        uint256 timestamp,
        bool isActive
    ) {
        require(canViewRecord(_recordId, msg.sender), "Not authorized");
        
        MedicalRecord storage record = medicalRecords[_recordId];
        return (
            record.recordId,
            record.patient,
            record.doctor,
            record.encryptedDataHash,
            record.dataCID,
            record.recordType,
            record.timestamp,
            record.isActive
        );
    }

    function getPrescription(bytes32 _prescriptionId) external view returns (Prescription memory) {
        Prescription storage prescription = prescriptions[_prescriptionId];
        require(
            msg.sender == prescription.patient ||
            msg.sender == prescription.doctor ||
            hasRole(PHARMACY_ROLE, msg.sender) ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return prescription;
    }

    function getAppointment(bytes32 _appointmentId) external view returns (Appointment memory) {
        Appointment storage appointment = appointments[_appointmentId];
        require(
            msg.sender == appointment.patient ||
            msg.sender == appointment.doctor ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return appointment;
    }

    function getInsuranceClaim(bytes32 _claimId) external view returns (InsuranceClaim memory) {
        InsuranceClaim storage claim = insuranceClaims[_claimId];
        require(
            msg.sender == claim.patient ||
            msg.sender == claim.insurer ||
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        return claim;
    }

    // ==================== Upgrade Authorization ====================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
