// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./WiFeeRegistry.sol";
import "./InternetToken.sol";
import "./RecompenseToken.sol";
import "hardhat/console.sol";


contract WiFeeAccess {
    WiFeeRegistry private wiFeeRegistry;
    InternetToken private internetToken;
    RecompenseToken private recompenseToken; // add RecompenseToken contract instance

    struct Connection {
        string mac;
        uint256 startTime;
        uint256 endTime;
        uint256 tokensPaid;
        bool isConnected;
    }

    mapping(address => Connection) private connections;
    mapping(uint256 => address) private tokenToUser;
    mapping(address => uint256) private userToToken;
    mapping(string => uint256[]) private connectedUserTokens;

    address payable public owner;
    uint256 private nonce = 0;

    event Connected(
        uint256 indexed userToken,
        string mac,
        uint256 startTime,
        uint256 endTime
    );
    event Disconnected(uint256 indexed userToken, string mac, uint256 endTime);
    event TokensBought(uint256 indexed userToken, uint256 tokens);
    event UserTokenCreated(uint256 userToken);
    event UserTokenRevoked(uint256 userToken);

    modifier onlyUser(uint256 userToken) {
        require(
            getTokenOwner(userToken) == msg.sender,
            "User token does not match the sender"
        );
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier validUserToken(uint256 userToken) {
        require(isTokenValid(userToken), "Token does not exist");
        _;
    }

constructor(
        address wiFeeRegistryAddress,
        address payable internetTokenAddress,
        address payable recompenseTokenAddress // add address for RecompenseToken
    ) {
        wiFeeRegistry = WiFeeRegistry(wiFeeRegistryAddress);
        internetToken = InternetToken(internetTokenAddress);
        recompenseToken = RecompenseToken(recompenseTokenAddress); // initialize RecompenseToken instance
        owner = payable(msg.sender);
    }

    // Function to get the start, actual, and end times of a connection
    function getConnectionTimes(uint256 userToken) public view validUserToken(userToken) returns (uint256, uint256, uint256) {
        address user = getTokenOwner(userToken);
        Connection memory userConnection = connections[user];
        uint256 actualTime = block.timestamp;
        return (userConnection.startTime, actualTime, userConnection.endTime);
    }


    // Funcion para obtener la información de un access point
    function getAPInfo(string memory _mac)
        public
        view
        returns (WiFeeRegistry.AccessPoint memory)
    {
        return wiFeeRegistry.getAPInfo(_mac);
    }

    // Agregamos una función para obtener los tokens de usuario conectados a un punto de acceso
    function getConnectedUserTokens(
        string memory _mac
    ) public view returns (uint256[] memory) {
        WiFeeRegistry.AccessPoint memory ap = wiFeeRegistry.getAPInfo(_mac);
        require(ap.owner != address(0), "Access point not registered");
        return connectedUserTokens[_mac];
    }

    // Funcion para obtener el precio de un AP
    function getConnectionPrice(
        string memory mac,
        uint256 connectedTime
    ) public view returns (uint256) {
        WiFeeRegistry.AccessPoint memory ap = wiFeeRegistry.getAPInfo(mac);
        require(ap.owner != address(0), "Access point not registered");
        require(ap.active, "Access point not active");
        uint256 totalPrice = ap.price * connectedTime;
        return totalPrice;
    }

    function connect(
        uint256 userToken,
        string memory mac,
        uint256 duration
    ) public onlyUser(userToken) validUserToken(userToken) {
        WiFeeRegistry.AccessPoint memory ap = wiFeeRegistry.getAPInfo(mac);
        require(ap.active, "Access point not active");

        Connection storage userConnection = connections[msg.sender];
        require(!userConnection.isConnected, "User is already connected");

        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;
        require(
            endTime <= startTime + ap.maxTime,
            "Duration exceeds access point max time"
        );

        uint256 paymentAmount = duration *
            ap.price *
            internetToken.tokenPrice();
        uint256 userTokenBalance = internetToken.balanceOf(msg.sender);
        require(
            userTokenBalance >= paymentAmount,
            "Not enough tokens for payment"
        );

        internetToken.transferTokens(msg.sender, address(this), paymentAmount);
        // Agregamos el token de usuario a la lista de usuarios conectados del punto de acceso
        _addUserTokenToAP(mac, userToken);

        userConnection.mac = mac;
        userConnection.startTime = startTime;
        userConnection.endTime = endTime;
        userConnection.tokensPaid = paymentAmount;
        userConnection.isConnected = true;

        emit Connected(userToken, mac, startTime, endTime);
    }

    function disconnect(uint256 userToken) public validUserToken(userToken) {
        address userAddress = getTokenOwner(userToken);
        Connection storage userConnection = connections[userAddress];
        require(userConnection.isConnected, "User is not connected");
        require(msg.sender == wiFeeRegistry.getAPInfo(userConnection.mac).owner, "Only the AP owner can disconnect a user");

        WiFeeRegistry.AccessPoint memory ap = wiFeeRegistry.getAPInfo(userConnection.mac);

        uint256 actualEndTime = block.timestamp;
        uint256 actualDuration = actualEndTime - userConnection.startTime;
        uint256 tokensForOwner = actualDuration * ap.price * 10 ** 18;

        // If the user disconnects early, refund the remaining tokens
        console.log("actualEndTime: %s", actualEndTime);
        console.log("userConnection.endTime: %s", userConnection.endTime);
        if (actualEndTime < userConnection.endTime) {
            uint256 refundAmount = userConnection.tokensPaid - tokensForOwner;
            internetToken.transfer(userAddress, refundAmount);
        }

        internetToken.transfer(ap.owner, tokensForOwner);

        // Reward user with Recompense tokens based on the actual duration of the connection
        uint256 rewardAmount = calculateReward(userConnection.startTime, actualEndTime);
        recompenseToken.mint(userAddress, rewardAmount);

        userConnection.isConnected = false;
        _removeUserTokenFromAP(userConnection.mac, userToken);

        emit Disconnected(userToken, userConnection.mac, actualEndTime);
        delete connections[userAddress];
    }




    // Function to calculate reward based on the duration of the connection
    function calculateReward(uint256 startTime, uint256 endTime) private pure returns (uint256) {
        uint256 duration = endTime - startTime;
        uint256 reward = duration * 10 ** 18; // this is a simple example, in a real case the reward should be calculated based on the duration
        return reward;
    }

    // la generación de tokens no es segura sin oráculo
    // el oráculo requiere de LINK
    // Se podrían crear una función para que se creen previamente y luego se asignen a usuarios, pero no generarse por los usuarios.
    function createTokenForUser() public {
        //require(userToToken[msg.sender] == 0, "User already has a token");
        nonce++;
        uint256 userToken = uint256(
            keccak256(abi.encodePacked(block.timestamp, msg.sender, nonce))
        );

        tokenToUser[userToken] = msg.sender;
        userToToken[msg.sender] = userToken;

        emit UserTokenCreated(userToken);
    }

    function getConnectionInfo(
        uint256 userToken
    ) public view validUserToken(userToken) returns (Connection memory) {
        address user = getTokenOwner(userToken);
        return connections[user];
    }

    // Funciones internas para agregar y eliminar tokens de usuario de la lista de puntos de acceso conectados
    function _addUserTokenToAP(string memory _mac, uint256 _userToken) private {
        connectedUserTokens[_mac].push(_userToken);
    }

    function _removeUserTokenFromAP(
        string memory _mac,
        uint256 _userToken
    ) private {
        uint256[] storage tokens = connectedUserTokens[_mac];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == _userToken) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    /*
        User Token Logic
    */

    function revokeUserToken(address user) private onlyOwner {
        require(userToToken[user] != 0, "User does not have a token");

        uint256 userToken = userToToken[user];
        delete tokenToUser[userToken];
        delete userToToken[user];

        emit UserTokenRevoked(userToken);
    }

    function getTokenOwner(uint256 userToken) private view returns (address) {
        require(tokenToUser[userToken] != address(0), "Token does not exist");
        return tokenToUser[userToken];
    }

    function getUserToken(address user) private view returns (uint256) {
        require(userToToken[user] != 0, "User does not have a token");
        return userToToken[user];
    }

    function isTokenValid(uint256 userToken) private view returns (bool) {
        return tokenToUser[userToken] != address(0);
    }
}
