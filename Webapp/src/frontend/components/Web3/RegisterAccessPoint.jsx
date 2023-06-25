import React, { useState, useEffect } from "react";
import Web3 from "web3";
import WiFeeRegistryAbi from "../../contractsABI/WiFeeRegistry.json";
import { Button, Container, Form, Row, Col, Card, Badge } from "react-bootstrap";
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
  const [dataLimit, setDataLimit] = useState("");
  const [bandwidthLimit, setBandwidthLimit] = useState("");
  const [interfaceName, setInterfaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isWifiInfoReceived, setIsWifiInfoReceived] = useState(false);

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


  const getWifiInfo = async () => {
    setLoading(true);

    try {
      const wifiInfoResponse = await fetch('/api/wifi-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interfaceName: interfaceName,
        }),
      });

      if (!wifiInfoResponse.ok) {
        console.error(
          'Error while retrieving WiFi info:',
          wifiInfoResponse.status
        );
        return;
      }

      const wifiInfo = await wifiInfoResponse.json();

      // Set the SSID and BSSID with the received values
      setSsid(wifiInfo.ssid);
      setMac(wifiInfo.bssid);

      // Show the form for price, duration, bandwidth, and data limit
      setIsWifiInfoReceived(true);
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };


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
          maxTime +
          " Data Limit: " +
          dataLimit +
          " Bandwidth Limit: " +
          bandwidthLimit
      );
      console.log("Contract:", contract);
      console.log("From account:", accounts[0]);
      try {
        await contract.methods
          .registerAP(ssid, mac, price, maxTime, dataLimit, bandwidthLimit)
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
        setDataLimit("");
        setBandwidthLimit("");
      } catch (error) {
        console.error("Error registering Access Point:", error.message);

        let errorMessage =
          "An error occurred while registering the access point.";

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
        } else if (error.message.includes("Invalid dataLimit range")) {
          errorMessage = "The dataLimit range is invalid.";
        } else if (error.message.includes("Invalid bandwidthLimit range")) {
          errorMessage = "The bandwidthLimit range is invalid.";
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
    <Container className="mt-5">
        <Card className="mb-4">
            <Card.Header>
                <h2>
                    <Badge variant="primary">Register Access Point</Badge>
                </h2>
            </Card.Header>
            <Card.Body>
                <Form>
                    <Form.Group>
                        <Form.Label><strong>Interface Name</strong></Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter Interface Name"
                            value={interfaceName}
                            onChange={(e) => setInterfaceName(e.target.value)}
                        />
                    </Form.Group>
                    <Button className="mt-4" variant="primary" onClick={getWifiInfo} disabled={loading}>
                        {loading ? "Loading..." : "Get WiFi Info"}
                    </Button>

                    {isWifiInfoReceived && (
                        <div className="mt-5">
                            <Form.Group>
                                <Form.Label><strong>SSID</strong></Form.Label>
                                <Form.Control
                                    type="text"
                                    readOnly
                                    value={ssid}
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label><strong>BSSID</strong></Form.Label>
                                <Form.Control
                                    type="text"
                                    readOnly
                                    value={mac}
                                />
                            </Form.Group>
                            <Row className="mt-3">
                                <Col>
                                    <Form.Group>
                                        <Form.Label><strong>Price (ITK)</strong></Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            placeholder="Enter Price"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Row className="mt-3">
                                <Col>
                                    <Form.Group>
                                        <Form.Label><strong>Max Time (minutes)</strong></Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            placeholder="Enter Max Time"
                                            value={maxTime}
                                            onChange={(e) => setMaxTime(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group>
                                        <Form.Label><strong>Data Limit (GB)</strong></Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            placeholder="Enter Data Limit"
                                            value={dataLimit}
                                            onChange={(e) => setDataLimit(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group>
                                        <Form.Label><strong>Bandwidth Limit (Mbps)</strong></Form.Label>
                                        <Form.Control
                                            type="number"
                                            min="0"
                                            placeholder="Enter Bandwidth Limit"
                                            value={bandwidthLimit}
                                            onChange={(e) => setBandwidthLimit(e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            <Button variant="success" onClick={registerAccessPoint} block className="mt-3">
                                Register Access Point
                            </Button>
                        </div>
                    )}
                </Form>
            </Card.Body>
        </Card>
    </Container>
);
};


export default RegisterAccessPoint;
