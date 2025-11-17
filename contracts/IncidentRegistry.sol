// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IncidentRegistry
 * @dev Stores IPFS CIDs for incident images and metadata on-chain
 * @notice Uses server-signed meta-transactions (gas relayer) for gasless user experience
 */
contract IncidentRegistry {
    
    struct IncidentRecord {
        string imageCID;        // IPFS CID of the image
        string metadataCID;     // IPFS CID of the metadata JSON
        bytes32 combinedHash;   // SHA-256 hash of image + metadata for integrity verification
        address reporter;       // Address of the incident reporter
        uint256 timestamp;      // Block timestamp of submission
        bool verified;          // Verification status (for future use)
    }
    
    // Mapping: incident ID => IncidentRecord
    mapping(uint256 => IncidentRecord) public incidents;
    
    // Counter for incident IDs
    uint256 public incidentCount;
    
    // Authorized relayer address (your backend server wallet)
    address public relayer;
    
    // Owner for admin functions
    address public owner;
    
    // Events
    event IncidentSubmitted(
        uint256 indexed incidentId,
        string imageCID,
        string metadataCID,
        bytes32 combinedHash,
        address indexed reporter,
        uint256 timestamp
    );
    
    event IncidentVerified(uint256 indexed incidentId, bool verified);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Only relayer can submit");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        relayer = msg.sender; // Default relayer is deployer
        incidentCount = 0;
    }
    
    /**
     * @dev Internal function to create incident
     */
    function _createIncident(
        string memory _imageCID,
        string memory _metadataCID,
        bytes32 _combinedHash,
        address _reporter
    ) internal returns (uint256) {
        require(bytes(_imageCID).length > 0, "Image CID cannot be empty");
        require(bytes(_metadataCID).length > 0, "Metadata CID cannot be empty");
        require(_combinedHash != bytes32(0), "Combined hash cannot be empty");
        require(_reporter != address(0), "Invalid reporter address");
        
        uint256 newIncidentId = incidentCount;
        
        incidents[newIncidentId] = IncidentRecord({
            imageCID: _imageCID,
            metadataCID: _metadataCID,
            combinedHash: _combinedHash,
            reporter: _reporter,
            timestamp: block.timestamp,
            verified: false
        });
        
        incidentCount++;
        
        emit IncidentSubmitted(
            newIncidentId,
            _imageCID,
            _metadataCID,
            _combinedHash,
            _reporter,
            block.timestamp
        );
        
        return newIncidentId;
    }
    
    /**
     * @dev Submit a new incident record (called by relayer on behalf of user)
     * @param _imageCID IPFS CID of the incident image
     * @param _metadataCID IPFS CID of the metadata JSON
     * @param _combinedHash SHA-256 hash of image binary + metadata JSON for integrity verification
     * @param _reporter The actual user address (passed by relayer)
     * @return incidentId The ID of the newly created incident
     */
    function submitIncident(
        string memory _imageCID,
        string memory _metadataCID,
        bytes32 _combinedHash,
        address _reporter
    ) external onlyRelayer returns (uint256) {
        return _createIncident(_imageCID, _metadataCID, _combinedHash, _reporter);
    }
    
    /**
     * @dev Batch submit multiple incidents (gas optimization)
     */
    function submitIncidentBatch(
        string[] memory _imageCIDs,
        string[] memory _metadataCIDs,
        bytes32[] memory _combinedHashes,
        address[] memory _reporters
    ) external onlyRelayer returns (uint256[] memory) {
        require(
            _imageCIDs.length == _metadataCIDs.length && 
            _imageCIDs.length == _combinedHashes.length &&
            _imageCIDs.length == _reporters.length,
            "Array lengths must match"
        );
        
        uint256[] memory incidentIds = new uint256[](_imageCIDs.length);
        
        for (uint256 i = 0; i < _imageCIDs.length; i++) {
            incidentIds[i] = _createIncident(
                _imageCIDs[i],
                _metadataCIDs[i],
                _combinedHashes[i],
                _reporters[i]
            );
        }
        
        return incidentIds;
    }
    
    /**
     * @dev Get incident details by ID
     */
    function getIncident(uint256 _incidentId) external view returns (
        string memory imageCID,
        string memory metadataCID,
        bytes32 combinedHash,
        address reporter,
        uint256 timestamp,
        bool verified
    ) {
        require(_incidentId < incidentCount, "Incident does not exist");
        
        IncidentRecord memory incident = incidents[_incidentId];
        return (
            incident.imageCID,
            incident.metadataCID,
            incident.combinedHash,
            incident.reporter,
            incident.timestamp,
            incident.verified
        );
    }
    
    /**
     * @dev Verify an incident (admin function)
     */
    function verifyIncident(uint256 _incidentId, bool _verified) external onlyOwner {
        require(_incidentId < incidentCount, "Incident does not exist");
        incidents[_incidentId].verified = _verified;
        emit IncidentVerified(_incidentId, _verified);
    }
    
    /**
     * @dev Update relayer address (admin function)
     */
    function updateRelayer(address _newRelayer) external onlyOwner {
        require(_newRelayer != address(0), "Invalid relayer address");
        address oldRelayer = relayer;
        relayer = _newRelayer;
        emit RelayerUpdated(oldRelayer, _newRelayer);
    }
    
    /**
     * @dev Get all incidents for a specific reporter
     */
    function getIncidentsByReporter(address _reporter) external view returns (uint256[] memory) {
        uint256 count = 0;
        
        // First count
        for (uint256 i = 0; i < incidentCount; i++) {
            if (incidents[i].reporter == _reporter) {
                count++;
            }
        }
        
        // Then collect
        uint256[] memory reporterIncidents = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < incidentCount; i++) {
            if (incidents[i].reporter == _reporter) {
                reporterIncidents[index] = i;
                index++;
            }
        }
        
        return reporterIncidents;
    }
}
