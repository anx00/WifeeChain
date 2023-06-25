// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Oracle {
    address private admin;
    mapping(bytes32=>bool) validIds;
    mapping(bytes32=>string) public results;
    
    event DataRequested(bytes32 id);
    event DataProvided(bytes32 id, string result);

    constructor() {
        admin = msg.sender;
    }

    function requestData() external returns(bytes32) {
        bytes32 id = keccak256(abi.encodePacked(msg.sender, block.timestamp));
        validIds[id] = true;
        emit DataRequested(id);
        return id;
    }

    function fulfillDataRequest(bytes32 id, string memory result) external {
        require(msg.sender == admin, "Only admin can fulfill data request");
        require(validIds[id], "Not a valid id");
        results[id] = result;
        validIds[id] = false;
        emit DataProvided(id, result);
    }
    
    function getResult(bytes32 id) external view returns(string memory) {
        require(!validIds[id], "Data request not fulfilled yet");
        return results[id];
    }
}
