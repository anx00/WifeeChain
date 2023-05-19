import React, { useState, useEffect, useRef } from "react";
import { generateQRCode } from "../../helpers/QRGenerator";
import { Card } from "react-bootstrap";
import { useAccount, useDisconnect } from "wagmi";
import axios from "axios";
import SHA256 from "crypto-js/sha256";
import Hex from "crypto-js/enc-hex";
import { FaCopy, FaCheck } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";

function generateToken(seedString) {
  const token = SHA256(seedString).toString(Hex);
  return token;
}

function QRProvider() {
  const { address, isConnecting, isDisconnected, isConnected } = useAccount();
  const [qrCode, setQRCode] = useState(null);
  const [mac, setMac] = useState("");
  const [clientID, setClientID] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      axios
        .get("http://192.168.1.128:3001/macAddress")
        .then((response) => {
          setMac(response.data.macAddresses.join(", "));
        })
        .catch((error) => {
          console.error(error);
        });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function generateCode() {
      // Metamask and other wallets don't support programatic disconnecting
      // so we need to use localStorage variable wagmi.connected to keep track
      // of the connection state
      if (localStorage.getItem("wagmi.connected") === "true" && isConnected) {
        console.log("mac: ", mac);
        if (mac !== "") {
          const newClientID = generateToken(mac);
          setClientID(newClientID);
          const qrCodeData = await generateQRCode(newClientID);
          setQRCode(qrCodeData);
        }
      }
    }
    generateCode();
  }, [mac, isConnected]);

  const textRef = useRef(null);

  const copyText = () => {
    navigator.clipboard.writeText(textRef.current.innerText);
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      {qrCode ? (
        <Card style={{ width: "18rem" }}>
          <Card.Img variant="top" src={qrCode} />
          <Card.Body>
            <Card.Title>Client ID</Card.Title>
            <span ref={textRef}>{clientID}</span>
            <span onClick={copyText} style={{ cursor: "pointer" }}>
              <FaCopy />
            </span>
          </Card.Body>
        </Card>
      ) : (
        <div className="text-center">
          <p className="fs-4 mb-0">Waiting for a wallet...</p>
          <div className="spinner-border mt-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default QRProvider;
