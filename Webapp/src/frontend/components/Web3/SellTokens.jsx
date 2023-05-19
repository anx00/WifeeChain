import React, { useState, useEffect } from "react";
import Web3 from "web3";
import internetTokenAbi from "../../contractsABI/InternetToken.json";
import { Button, Container, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { useAccount } from "wagmi";
import Swal from "sweetalert2";

const SellTokens = ({ internetTokenAddress }) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [amount, setAmount] = useState("");

  const { address } = useAccount();

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

  const sellTokens = async () => {
    if (contract && address) {
      try {
        console.log("Sending transaction...");
        await contract.methods.sellTokens(amount).send({ from: address });
        console.log("Tokens vendidos");
        setAmount("");

        // Show success Swal alert
        Swal.fire({
          icon: "success",
          title: "Tokens vendidos!",
          text: `Has vendido ${amount} ITK.`,
        });
      } catch (error) {
        console.error("Error al vender tokens:", error.message);
        // Show error Swal alert
        Swal.fire({
          icon: "error",
          title: "Error al vender tokens",
          text: error.message,
        });
      }
    }
  };

  return (
    <Container className="d-flex flex-column align-items-center justify-content-center vh-100">
      <h2 className="text-center mb-4">Vender tokens</h2>
      <Form.Group className="mt-3">
        <Form.Control
          type="number"
          step="1"
          min="0"
          placeholder="Cantidad de ITK"
          value={amount}
          onChange={handleAmountChange}
        />
      </Form.Group>
      <br />
      <Button variant="success" onClick={() => sellTokens(amount)}>
        Vender tokens
      </Button>
    </Container>
  );
};

export default SellTokens;