import React, { useState, useEffect } from "react";
import { Button, Form } from "react-bootstrap";
import Web3 from "web3";
import WiFeeAccessAbi from "../../contractsABI/WiFeeAccess.json";
import { useAccount } from "wagmi";

const DisconnectFromAccessPoint = ({ connectAccessPointAddress, userToken }) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);

  const { address, status } = useAccount();

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
        const wiFeeAccessABI = WiFeeAccessAbi.abi;
        const wiFeeAccessContract = new web3.eth.Contract(
          wiFeeAccessABI,
          connectAccessPointAddress
        );
        setContract(wiFeeAccessContract);
      }
    };

    initContract();
  }, [web3, connectAccessPointAddress]);

  const disconnectAccessPoint = async () => {
    if (contract && address) {
      try {
        await contract.methods
          .disconnect(userToken)
          .send({ from: address })
          .on("error", (error) => {
            console.warn("Warning: Disconnect listener not received in time");
          });
        console.log("Disconnected from Access Point");
      } catch (error) {
        console.error("Error disconnecting from Access Point:", error.message);
      }
    }
  };
  
  // Conditionally render the component based on whether the user's wallet is connected or not
  return (
    <>
      {status === 'connected' && (
        <Form>
          <Button variant="danger" onClick={disconnectAccessPoint}>
            Desconectarse
          </Button>
        </Form>
      )}
    </>
  );
};

export default DisconnectFromAccessPoint;
