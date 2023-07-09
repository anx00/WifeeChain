// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract WiFeeRegistry {
    struct AccessPoint {
        address owner;
        string ssid;
        string mac;
        uint256 price;
        uint256 maxTime; // Max time in minutes
        uint256 dataLimit; // Data limit in GB
        uint256 bandwidthLimit; // Bandwidth limit in Mbps
        uint256 timeRegistered;
        bool active;
    }

    mapping(string => AccessPoint) private accessPoints;
    mapping(address => string[]) private ownerToMACs;
    mapping(string => bool) private registeredMACs;

    event APRegistered(
        address indexed _owner,
        string _ssid,
        string _mac,
        uint256 _price,
        uint256 _maxTime,
        uint256 _dataLimit,
        uint256 _bandwidthLimit,
        uint256 _timeRegistered
    );
    event APModified(
        address indexed _owner,
        string _ssid,
        string _mac,
        uint256 _price,
        uint256 _maxTime,
        uint256 _dataLimit,
        uint256 _bandwidthLimit
    );
    event APRemoved(address indexed _owner, string _ssid, string _mac);

    modifier onlyOwner(string memory _mac) {
        require(isOwner(_mac), "Only the owner can perform this action");
        _;
    }

    function registerAP(
        string memory _ssid,
        string memory _mac,
        uint256 _price,
        uint256 _maxTime,
        uint256 _dataLimit,
        uint256 _bandwidthLimit
    ) public {
        require(
            accessPoints[_mac].owner == address(0),
            "AccessPoint already registered"
        );
        require(!registeredMACs[_mac], "MAC address already registered"); // Verificamos si la dirección MAC ya está registrada
        require(isValidSSID(_ssid), "Invalid ssid length");
        require(isValidMAC(_mac), "Invalid mac length");
        require(isValidPrice(_price), "Invalid price");
        require(isValidMaxTime(_maxTime), "Invalid maxTime range");
        require(isValidDataLimit(_dataLimit), "Invalid dataLimit range"); // Added this
        require(
            isValidBandwidthLimit(_bandwidthLimit),
            "Invalid bandwidthLimit range"
        ); // Added this

        uint256 _timeRegistered = block.timestamp;

        AccessPoint memory newAccessPoint = AccessPoint(
            msg.sender,
            _ssid,
            _mac,
            _price,
            _maxTime,
            _dataLimit, // Added this
            _bandwidthLimit, // Added this
            _timeRegistered,
            true
        );
        accessPoints[_mac] = newAccessPoint;
        registeredMACs[_mac] = true;
        ownerToMACs[msg.sender].push(_mac);

        emit APRegistered(
            msg.sender,
            _ssid,
            _mac,
            _price,
            _maxTime,
            _dataLimit,
            _bandwidthLimit,
            _timeRegistered
        );
    }

    function setAPInfo(
        string memory _mac,
        string memory _ssid,
        uint256 _price,
        uint256 _maxTime,
        uint256 _dataLimit,
        uint256 _bandwidthLimit
    ) public onlyOwner(_mac) {
        require(isAccessPointRegistered(_mac), "Access point not registered");
        require(isValidSSID(_ssid), "Invalid ssid length");
        require(isValidPrice(_price), "Invalid price");
        require(isValidMaxTime(_maxTime), "Invalid maxTime range");
        require(isValidDataLimit(_dataLimit), "Invalid dataLimit range"); // Added this
        require(
            isValidBandwidthLimit(_bandwidthLimit),
            "Invalid bandwidthLimit range"
        ); // Added this

        AccessPoint storage ap = accessPoints[_mac];
        ap.ssid = _ssid;
        ap.price = _price;
        ap.maxTime = _maxTime;
        ap.dataLimit = _dataLimit;
        ap.bandwidthLimit = _bandwidthLimit;

        emit APModified(
            msg.sender,
            _ssid,
            _mac,
            _price,
            _maxTime,
            _dataLimit,
            _bandwidthLimit
        );
    }

    function getAPInfo(
        string memory _mac
    ) public view returns (AccessPoint memory) {
        require(isAccessPointRegistered(_mac), "AccessPoint not registered");
        return accessPoints[_mac];
    }

    function removeAP(string memory _mac) public onlyOwner(_mac) {
        require(isAccessPointRegistered(_mac), "Access point not registered");

        emit APRemoved(msg.sender, accessPoints[_mac].ssid, _mac);
        delete registeredMACs[_mac]; // Eliminamos la dirección MAC del conjunto al eliminar el punto de acceso
        delete accessPoints[_mac];

        // Remove _mac from ownerToMACs[msg.sender]
        string[] storage macs = ownerToMACs[msg.sender];
        for (uint i = 0; i < macs.length; i++) {
            if (
                keccak256(abi.encodePacked(macs[i])) ==
                keccak256(abi.encodePacked(_mac))
            ) {
                macs[i] = macs[macs.length - 1];
                macs.pop();
                break;
            }
        }
    }

    function getAPOfOwner() public view returns (AccessPoint[] memory) {
        address owner = msg.sender;
        string[] memory macs = ownerToMACs[owner];
        AccessPoint[] memory aps = new AccessPoint[](macs.length);
        for (uint i = 0; i < macs.length; i++) {
            aps[i] = accessPoints[macs[i]];
        }
        return aps;
    }

    function isAccessPointRegistered(
        string memory _mac
    ) private view returns (bool) {
        return accessPoints[_mac].owner != address(0);
    }

    function isOwner(string memory _mac) public view returns (bool) {
        return accessPoints[_mac].owner == msg.sender;
    }

    function isValidSSID(string memory _ssid) private pure returns (bool) {
        return bytes(_ssid).length > 0 && bytes(_ssid).length <= 32;
    }

    function isValidMAC(string memory _mac) private pure returns (bool) {
        return bytes(_mac).length > 0 && bytes(_mac).length <= 20;
    }

    function isValidPrice(uint256 _price) private pure returns (bool) {
        return _price > 0;
    }

    function isValidMaxTime(uint256 _maxTime) private pure returns (bool) {
        return _maxTime > 0 && _maxTime <= 86400;
    }

    function isValidDataLimit(uint256 _dataLimit) private pure returns (bool) {
        return _dataLimit > 0;
    }

    function isValidBandwidthLimit(
        uint256 _bandwidthLimit
    ) private pure returns (bool) {
        return _bandwidthLimit > 0;
    }
}
