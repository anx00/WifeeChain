import React, { useState, useEffect } from "react";
import { Container, Button, Card } from "react-bootstrap";
import Web3 from "web3";
import WiFeeAccessAbi from "../../contractsABI/WiFeeAccess.json";
import Swal from "sweetalert2";
import { useAccount } from "wagmi";
import { generateQRCode } from "../../helpers/QRGenerator";
import "../main.css";
import ScrollTrigger from "react-scroll-trigger";

const GetUserTokenButton = ({
  connectAccessPointAddress,
  userToken,
  setUserToken,
}) => {
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [qrCodeDataURL, setQrCodeDataURL] = useState(null);

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

  const copyToClipboardFallback = (text) => {
    const textField = document.createElement("textarea");
    textField.innerText = text;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand("copy");
    textField.remove();
  };

  const createUserToken = async () => {
    if (contract && address) {
      try {
        // Call the server to generate a new user token
        const response = await fetch("/api/createUserToken");
        const { userToken } = await response.json();

        const result = await contract.methods
          .createTokenForUser(userToken)
          .send({ from: address });
        const userTokenCreated = result.events.UserTokenCreated.returnValues;
        console.log("User Token creado:", userTokenCreated.userToken);

        // Generate QR code
        const qrCodeData = await generateQRCode(userTokenCreated.userToken);

        setUserToken(userTokenCreated.userToken);
        setQrCodeDataURL(qrCodeData);

        Swal.fire({
          title: "User Token",
          html: `Your User Token is: ${userTokenCreated.userToken}<br/><br/><img src="${qrCodeData}" alt="QR Code" style="width: 200px; height: 200px;"/>`,
          icon: "success",
          showCloseButton: true,
          showCancelButton: false,
          focusConfirm: false,
          confirmButtonText: "Close",
        });
      } catch (error) {
        console.error("Error al crear el User Token:", error.message);
        if (error.message.includes("User already has a token")) {
          Swal.fire({
            title: "Error",
            text: "You already have a User Token.",
            icon: "error",
          });
        } else {
          Swal.fire({
            title: "Error",
            text: "There was an error while creating the User Token.",
            icon: "error",
          });
        }
      }
    }
  };

  return (
    <ScrollTrigger
      onEnter={() => {
        document
          .querySelector("#step1.center-style.slide-in")
          .classList.add("visible");
      }}
      onExit={() => {
        document
          .querySelector("#step1.center-style.slide-in")
          .classList.remove("visible");
      }}
    >
      <Container id="step1" className="center-style slide-in">
        <h2 className="sfr-rounded">
          Step 1. Obtain your Token!
        </h2>
        {status === "connected" &&
          (userToken && qrCodeDataURL ? (
            <Card
              style={{
                padding: "2rem",
                textAlign: "center",
                marginBottom: "rem",
              }}
            >
              <Card.Body>
                <Card.Title>UserToken</Card.Title>
                <img
                  src={qrCodeDataURL}
                  alt="QR Code"
                  style={{ width: 200, height: 200 }}
                />
                <Card.Text style={{ marginTop: "1rem" }}>
                  Your UserToken is: {userToken}
                </Card.Text>
                <Button
                  variant="secondary"
                  style={{ marginTop: "1rem" }}
                  onClick={() => {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(userToken).then(() => {
                        Swal.fire("Copied!", "UserToken copied to clipboard", "success");
                      }).catch((error) => {
                        console.error("Error copying to clipboard:", error);
                        copyToClipboardFallback(userToken);
                        Swal.fire("Copied!", "UserToken copied to clipboard", "success");
                      });
                    } else {
                      copyToClipboardFallback(userToken);
                      Swal.fire("Copied!", "UserToken copied to clipboard", "success");
                    }
                  }}
                >
                  Copy Token
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Button
              onClick={createUserToken}
              className="custom-button center-style"
            >
              Generate
            </Button>
          ))}
      </Container>
    </ScrollTrigger>
  );
};

export default GetUserTokenButton;
