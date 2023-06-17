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
        const intDuration = parseInt(duration); // Convert duration to integer
        const durationInMinutes = parseInt(intDuration / 60);
        console.log("duration:", intDuration, typeof intDuration);
        console.log("durationInMinutes:", durationInMinutes, typeof durationInMinutes);

        const response = await fetch("/api/ap-info", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userToken: userToken,
          }),
        });

        console.log(response);
        console.log(response.ok);        
  
        if (!response.ok) {
          // handle error
          console.error("Error obtaining Access Point info:", response.status);
        } else {
          const { mac } = await response.json();
          console.log("MAC Address from server:", mac);
  
          const totalPrice = await contract.methods
            .getConnectionPrice(mac, durationInMinutes)
            .call();
          const intTotalPrice = parseInt(totalPrice); // Convert totalPrice to integer
          console.log("totalPrice:", intTotalPrice, typeof intTotalPrice);
  
          const apInfo = await contract.methods.getAPInfo(mac).call();
          console.log("apInfo:", apInfo);
  
          const apMaxTime = parseInt(apInfo.maxTime);
  
          console.log("apMaxTime:", apMaxTime, typeof apMaxTime);
  
          if (intDuration <= apMaxTime) {
            console.log("Connecting to the Access Point...");
  
            Swal.fire({
              title: "Confirm purchase",
              html: `This connection will cost ${totalPrice} ITK.`,
              showCancelButton: true,
              confirmButtonText: "Yes, buy",
              cancelButtonText: "No, cancel",
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
            
                // Perform the blockchain transaction
                await contract.methods
                  .connect(userToken, mac, intDuration)
                  .send({ from: address });
            
                // Now make the call to /connect
                const connectResponse = await fetch("/api/connect", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    userToken: userToken,
                  }),
                });
            
                if (!connectResponse.ok) {
                  console.error("Error while connecting to the Access Point:", connectResponse.status);
                  return;
                }
            
                console.log("Connected to the Access Point");
            
                // Show success message
                Swal.fire({
                  icon: "success",
                  title: "Success",
                  text: "Connected to the access point successfully!",
                });
              }
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Error",
              text: `The maximum duration allowed by this Access Point is ${apMaxTime} seconds.`,
            });
          }
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