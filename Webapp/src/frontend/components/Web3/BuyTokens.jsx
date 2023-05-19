import React, { useState, useEffect } from "react";
import Web3 from "web3";
import internetTokenAbi from "../../contractsABI/InternetToken.json";
import { Button, Container, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAccount, useBalance } from "wagmi";
import Swal from "sweetalert2";
import "./../main.css";
import ScrollTrigger from "react-scroll-trigger";

const BuyTokens = ({ internetTokenAddress }) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [amount, setAmount] = useState("");
  const [tokenPrice, setTokenPrice] = useState(null);

  const { address } = useAccount();

  useEffect(() => {
    const fetchTokenPrice = async () => {
      if (contract) {
        const price = await contract.methods.tokenPrice().call();
        setTokenPrice(price);
      }
    };

    fetchTokenPrice();
  }, [web3, contract]);

  useEffect(() => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);
    } else {
      console.error("No Ethereum provider detected");
    }
  }, []);

  useEffect(() => {
    const initContract = async () => {
      if (web3) {
        console.log("InternetTokenAddress:", internetTokenAddress);
        console.log("InternetTokenABI:", internetTokenAbi.abi);
        const internetTokenABI = internetTokenAbi.abi;
        const internetTokenContract = new web3.eth.Contract(
          internetTokenABI,
          internetTokenAddress
        );
        setContract(internetTokenContract);
      }
    };

    initContract();
  }, [web3, internetTokenAddress]);

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  const buyTokens = async () => {
    if (contract && address) {
      const tokensToBuy = amount * tokenPrice;
      const priceTokenEth = web3.utils.fromWei(tokenPrice, "ether");
      const tokensToBuyInWei = web3.utils.toWei(amount.toString(), "ether");

      try {
        console.log("Sending transaction...");
        await contract.methods
          .buyTokens()
          .send({ from: address, value: tokensToBuyInWei });
        console.log("Tokens comprados");
        setAmount("");

        // Show success Swal alert
        const quantityETH = amount * priceTokenEth;
        Swal.fire({
          icon: "success",
          title: "Tokens comprados!",
          html: `Has comprado ${amount} ITK por ${quantityETH} ETH.`,
        });
      } catch (error) {
        console.error("Error al comprar tokens:", error.message);
        // Show error Swal alert
        Swal.fire({
          icon: "error",
          title: "Error al comprar tokens",
          text: error.message,
        });
      }
    }
  };

  return (
    <ScrollTrigger
      onEnter={() => {
        document
          .querySelector("#step2.center-style.slide-in")
          .classList.add("visible");
      }}
      onExit={() => {
        document
          .querySelector("#step2.center-style.slide-in")
          .classList.remove("visible");
      }}
    >
      <Container id="step2" className="center-style slide-in">
        <h2 className="sfr-rounded" style={{ color: "white" }}>
          Step 2. Get your ITK!
        </h2>
        <p className="mb-4" style={{ color: "#BBBBBB", marginBottom: "50px" }}>
          1 ITK = {tokenPrice ? web3.utils.fromWei(tokenPrice, "ether") : "?"}{" "}
          ETH
        </p>
        <Form.Group className="mt-3 my-form__group">
          <Form.Control
            type="number"
            step="1"
            min="0"
            placeholder="ITK Quantity"
            value={amount}
            onChange={handleAmountChange}
            style={{ borderRadius: "25px" }}
          />
        </Form.Group>
        <br />
        <Button
          className="buy-button center-style"
          onClick={() => buyTokens(amount)}
        >
          Buy
        </Button>
      </Container>
    </ScrollTrigger>
  );
};
export default BuyTokens;
