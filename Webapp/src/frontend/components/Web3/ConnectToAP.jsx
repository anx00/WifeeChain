import React, { useState, useEffect } from "react";
import { Container, Button, Form } from "react-bootstrap";
import Web3 from "web3";
import WiFeeAccessAbi from "../../contractsABI/WiFeeAccess.json";
import Swal from "sweetalert2";
import { useAccount } from "wagmi";
import ScrollTrigger from "react-scroll-trigger";

import UserTokenInput from "./UserTokenInput";

const ConnectToAP = ({ connectAccessPointAddress }) => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [mac, setMac] = useState("");
  const [duration, setDuration] = useState("");
  const [userToken, setUserToken] = useState("");

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

  const connectAccessPoint = async () => {
    if (contract && address && duration) {
      try {
        const totalPrice = await contract.methods
          .getConnectionPrice(mac, duration)
          .call();
        const intTotalPrice = parseInt(totalPrice); // Convert totalPrice to integer
        console.log("totalPrice:", intTotalPrice, typeof intTotalPrice);

        const apInfo = await contract.methods.getAPInfo(mac).call();
        console.log("apInfo:", apInfo);

        const apMaxTime = parseInt(apInfo.maxTime);
        const intDuration = parseInt(duration); // Convert duration to integer

        // Hay que tener cuidado, porque apMaxTime es un string debido al unsigned int de solidity
        // Entonces se está comparando entero con string, que es completamente valido en JS
        console.log("apMaxTime:", apMaxTime, typeof apMaxTime);
        console.log("duration:", intDuration, typeof intDuration);

        if (intDuration <= apMaxTime) {
          console.log("Conectando al Access Point...");
          Swal.fire({
            title: "Confirmar compra",
            html: `Este conexión costará ${totalPrice} ITK.`,
            showCancelButton: true,
            confirmButtonText: "Sí, comprar",
            cancelButtonText: "No, cancelar",
          }).then(async (result) => {
            if (result.isConfirmed) {
              console.log(
                "userToken:",
                userToken,
                "mac:",
                mac,
                "intDuration:",
                intDuration
              );
              await contract.methods
                .connect(userToken, mac, intDuration)
                .send({ from: address });
              console.log("Conectado al Access Point");
            }
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `La duración máxima permitida por este Access Point es ${apMaxTime} segundos.`,
          });
        }
      } catch (error) {
        console.error("Error al conectarse al Access Point:", error.message);
        if (error.message.includes("Access point not active")) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "The access point is not active.",
          });
        } else if (error.message.includes("User is already connected")) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "You are already connected to an access point.",
          });
        } else if (
          error.message.includes("Duration exceeds access point max time")
        ) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `The duration exceeds the access point's maximum allowed time.`,
          });
        } else if (error.message.includes("Not enough tokens for payment")) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "You don't have enough tokens for this connection.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "There was an error while connecting to the access point.",
          });
        }
      }
    }
  };

  // Conditionally render the component based on whether the user's wallet is connected or not
  return (
    <ScrollTrigger
      onEnter={() => {
        document
          .querySelector("#step3.center-style.slide-in")
          .classList.add("visible");
      }}
      onExit={() => {
        document
          .querySelector("#step3.center-style.slide-in")
          .classList.remove("visible");
      }}
    >
      <Container id="step3" className="center-style slide-in">
        <h2 className="sfr-rounded" style={{ marginBottom: "50px" }}>
          Step 3. Connect!
        </h2>
        {status === "connected" && (
          <Form>
            <Form.Group>
              <Form.Label>User Token</Form.Label>
              <Form.Control
                type="text"
                placeholder="User Token"
                value={userToken}
                onChange={(e) => setUserToken(e.target.value)}
                style={{ borderRadius: "25px" }}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>MAC Address</Form.Label>
              <Form.Control
                type="text"
                placeholder="MAC Address"
                value={mac}
                onChange={(e) => setMac(e.target.value)}
                style={{ borderRadius: "25px" }}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Duration (seconds)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                placeholder="Duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{ borderRadius: "25px" }}
              />
            </Form.Group>
          </Form>
        )}
        <Button
          id="step3-button"
          className="custom-button center-style"
          onClick={connectAccessPoint}
        >
          Connect
        </Button>
      </Container>
    </ScrollTrigger>
  );
};

export default ConnectToAP;
