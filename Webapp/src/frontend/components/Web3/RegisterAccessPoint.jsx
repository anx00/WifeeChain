import React, { useState, useEffect } from "react";
import Web3 from "web3";
import WiFeeRegistryAbi from "../../contractsABI/WiFeeRegistry.json";
import { Button, Container, Form, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";

const RegisterAccessPoint = ({ registerAccessPointAddress }) => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [ssid, setSsid] = useState("");
  const [mac, setMac] = useState("");
  const [price, setPrice] = useState("");
  const [maxTime, setMaxTime] = useState("");

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        try {
          const accounts = await web3Instance.eth.getAccounts();
          setAccounts(accounts);
          await window.ethereum.request({ method: "eth_requestAccounts" });
        } catch (error) {
          console.error("User denied account access");
        }
      } else {
        console.error("No Ethereum provider detected");
      }
    };

    initWeb3();
  }, []);

  useEffect(() => {
    const initContract = async () => {
      if (web3) {
        console.log("Contract address:", registerAccessPointAddress);
        const wiFeeRegistryABI = WiFeeRegistryAbi.abi;
        const wiFeeRegistryContract = new web3.eth.Contract(
          wiFeeRegistryABI,
          registerAccessPointAddress
        );
        setContract(wiFeeRegistryContract);
      }
    };

    initContract();
  }, [web3, registerAccessPointAddress]);

  const registerAccessPoint = async () => {
    if (contract && accounts[0]) {
      console.log(
        "Registrando Access Point..." +
          " SSID: " +
          ssid +
          " MAC: " +
          mac +
          " Price: " +
          price +
          " Max Time: " +
          maxTime
      );
      console.log("Contract:", contract);
      console.log("From account:", accounts[0]);
      try {
        await contract.methods
          .registerAP(ssid, mac, price, maxTime)
          .send({ from: accounts[0] });
        console.log("Access Point registrado");
  
        Swal.fire({
          icon: "success",
          title: "Access Point Registered",
          text: "The access point has been successfully registered.",
        });
  
        setSsid("");
        setMac("");
        setPrice("");
        setMaxTime("");

      } catch (error) {
        console.error("Error al registrar el Access Point:", error.message);
  
        let errorMessage = "An error occurred while registering the access point.";
  
        if (error.message.includes("AccessPoint already registered")) {
          errorMessage = "The access point is already registered.";
        } else if (error.message.includes("MAC address already registered")) {
          errorMessage = "The MAC address is already registered.";
        } else if (error.message.includes("Invalid ssid length")) {
          errorMessage = "The SSID length is invalid.";
        } else if (error.message.includes("Invalid mac length")) {
          errorMessage = "The MAC length is invalid.";
        } else if (error.message.includes("Invalid price")) {
          errorMessage = "The price is invalid.";
        } else if (error.message.includes("Invalid maxTime range")) {
          errorMessage = "The maxTime range is invalid.";
        }
  
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errorMessage,
        });
      }
    }
  };
  
  return (
    <Container>
      <h2>Registrar Access Point</h2>
      <Form>
        <Form.Group>
          <Form.Label>SSID</Form.Label>
          <Form.Control
            type="text"
            placeholder="SSID"
            value={ssid}
            onChange={(e) => setSsid(e.target.value)}
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>MAC Address</Form.Label>
          <Form.Control
            type="text"
            placeholder="MAC Address"
            value={mac}
            onChange={(e) => setMac(e.target.value)}
          />
        </Form.Group>
        <Row>
          <Col>
            <Form.Group>
              <Form.Label>Price (ITK)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                placeholder="Price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col>
            <Form.Group>
              <Form.Label>Max Time (seconds)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                placeholder="Max Time"
                value={maxTime}
                onChange={(e) => setMaxTime(e.target.value)}
              />
            </Form.Group>
          </Col>
        </Row>
        <Button variant="primary" onClick={registerAccessPoint}>
          Registrar Access Point
        </Button>
      </Form>
    </Container>
  );
};

export default RegisterAccessPoint;