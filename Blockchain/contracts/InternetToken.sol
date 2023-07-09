// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract InternetToken is ERC20 {
    uint256 price = 1 ether;

    constructor(uint256 initialSupply) ERC20("InternetToken", "ITK") {
        _mint(address(this), initialSupply * (10 ** decimals()));
    }

    function tokenPrice() public view returns (uint256) {
        return price;
    }

    function buyTokens() public payable {
        uint256 tokensToBuy = msg.value;
        require(
            balanceOf(address(this)) >= tokensToBuy,
            "Not enough tokens available"
        );

        _transfer(address(this), msg.sender, tokensToBuy);
    }

    function transferTokens(address from, address to, uint256 amount) public {
        _transfer(from, to, amount);
    }

    function balanceOfUser() public view returns (uint256) {
        return balanceOf(msg.sender) / tokenPrice();
    }

    function sellTokens(uint256 amount) public {
        require(balanceOfUser() >= amount, "Not enough tokens to sell");

        uint256 tokenAmount = amount * tokenPrice();
        require(
            address(this).balance >= tokenAmount,
            "Not enough ether in the contract to buy tokens"
        );

        _transfer(msg.sender, address(this), tokenAmount); // Transferimos los tokens del usuario al contrato

        // Aseguramos que se actualice el balance del contrato antes de realizar la transferencia de ether
        // para evitar el ataque de reentrancia.
        //
        // El ataque de reentrancia ocurre cuando un contrato externo malicioso es capaz de llamar
        // recursivamente una función (en este caso, sellTokens) antes de que se actualice el estado
        // del contrato (como el balance de ether del contrato). Esto podría permitir a un atacante
        // retirar más ether del contrato del que debería ser posible.
        //
        // Al realizar la transferencia de ether al final de la función, después de actualizar el
        // estado del contrato, podemos mitigar el riesgo de un ataque de reentrancia.
        
        payable(msg.sender).transfer(tokenAmount); // Enviamos ether al usuario
    }
}
