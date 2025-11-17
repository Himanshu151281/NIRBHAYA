// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Swarakhsha {
    address public owner;
    uint256 cases = 0;

    constructor() {
        owner = msg.sender; // deployer is the owner
    }

    // Modifier to allow only the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    // Modifier to allow only whitelisted users
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not a whitelisted user");
        _;
    }

    struct Report {
        uint256 caseId;
        string title;
        string description;
        string fullText;      // full narrative
        string location;      // location name/landmark
        string latitude;      // new field
        string longitude;     // new field
        string image;         // single IPFS hash
        string severity; 
        string pincode;
        uint256 timestamp;    // blockchain timestamp
        address userAddress;  // msg.sender
    }

    mapping(address => bool) public whitelist;
    mapping(address => Report[]) private userReports;
    mapping(uint256 => Report) private reportById; // New mapping for O(1) lookup
    Report[] private allReports;

    function addUserToWhitelist(address _user) external onlyOwner {
        whitelist[_user] = true;
    }

    function removeUserFromWhitelist(address _user) external onlyOwner {
        require(whitelist[_user], "User is not whitelisted");
        whitelist[_user] = false;
    }

    function isWhitelisted(address _user) external view returns (bool) {
        return whitelist[_user];
    }

    function addReport(
        string memory _title,
        string memory _description,
        string memory _fullText,
        string memory _location,
        string memory _latitude,
        string memory _longitude,
        string memory _image,
        string memory _severity,
        string memory _pincode
    ) external onlyWhitelisted {

        cases += 1;

        Report memory newReport = Report({
            caseId: cases,
            title: _title,
            description: _description,
            fullText: _fullText,
            location: _location,
            latitude: _latitude,
            longitude: _longitude,
            image: _image,
            severity: _severity,
            pincode: _pincode,
            timestamp: block.timestamp,
            userAddress: msg.sender
        });

        userReports[msg.sender].push(newReport);
        allReports.push(newReport);
        reportById[cases] = newReport; // Store in mapping for fast lookup
    }

    function getReportsByUser(address _user) external view returns (Report[] memory) {
        return userReports[_user];
    }

    function getAllReports() external view returns (Report[] memory) {
        return allReports;
    }

    // New function: Get report by case ID
    function getReportById(uint256 _caseId) external view returns (Report memory) {
        require(_caseId > 0 && _caseId <= cases, "Invalid case ID");
        return reportById[_caseId];
    }

    // Additional helper functions you might find useful:

    // Get total number of reports
    function getTotalReports() external view returns (uint256) {
        return cases;
    }

    // Check if a report exists
    function reportExists(uint256 _caseId) external view returns (bool) {
        return _caseId > 0 && _caseId <= cases;
    }

    // Get reports by severity (useful for filtering)
    function getReportsBySeverity(string memory _severity) external view returns (Report[] memory) {
        uint256 count = 0;
        
        // First pass: count matching reports
        for (uint256 i = 0; i < allReports.length; i++) {
            if (keccak256(abi.encodePacked(allReports[i].severity)) == keccak256(abi.encodePacked(_severity))) {
                count++;
            }
        }
        
        // Create array with exact size
        Report[] memory severityReports = new Report[](count);
        uint256 index = 0;
        
        // Second pass: populate array
        for (uint256 i = 0; i < allReports.length; i++) {
            if (keccak256(abi.encodePacked(allReports[i].severity)) == keccak256(abi.encodePacked(_severity))) {
                severityReports[index] = allReports[i];
                index++;
            }
        }
        
        return severityReports;
    }

    // Get reports by pincode (useful for location-based filtering)
    function getReportsByPincode(string memory _pincode) external view returns (Report[] memory) {
        uint256 count = 0;
        
        // First pass: count matching reports
        for (uint256 i = 0; i < allReports.length; i++) {
            if (keccak256(abi.encodePacked(allReports[i].pincode)) == keccak256(abi.encodePacked(_pincode))) {
                count++;
            }
        }
        
        // Create array with exact size
        Report[] memory pincodeReports = new Report[](count);
        uint256 index = 0;
        
        // Second pass: populate array
        for (uint256 i = 0; i < allReports.length; i++) {
            if (keccak256(abi.encodePacked(allReports[i].pincode)) == keccak256(abi.encodePacked(_pincode))) {
                pincodeReports[index] = allReports[i];
                index++;
            }
        }
        
        return pincodeReports;
    }
}