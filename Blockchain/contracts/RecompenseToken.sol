// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RecompenseToken is ERC20 { // Declare inheritance from Ownable contract
    constructor() ERC20("RecompenseToken", "RTK") {}

    function mint(address account, uint256 amount) public { // Add the onlyOwner modifier
        _mint(account, amount);
    }
}
