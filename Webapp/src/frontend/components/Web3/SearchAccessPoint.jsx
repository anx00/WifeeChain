import React, { useState, useEffect } from "react";
import Web3 from "web3";
import WiFeeRegistryAbi from "../../contractsABI/WiFeeRegistry.json";
import { Button, Container, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";

const SearchAccessPoint = ({ registerAccessPointAddress }) => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [searchMac, setSearchMac] = useState("");
  const [accessPointInfo, setAccessPointInfo] = useState(null);

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

  const getAccessPointInfo = async () => {
    console.log("Buscando Access Point...");
    if (contract && searchMac) {
      try {
        const apInfo = await contract.methods.getAPInfo(searchMac).call();
        setAccessPointInfo(apInfo);
        setSearchMac("");
      } catch (error) {
        console.error("Error al buscar el Access Point:", error.message);
        if (error.message.includes("AccessPoint not registered")) {
          Swal.fire({
            icon: "error",
            title: "Access Point Not Found",
            text: "The access point you are searching for does not exist.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "An error occurred while searching for the access point.",
          });
        }
      }
    }
  };
  

  return (
    <Container>
      <h2>Search Access Point</h2>
      <Form.Group>
        <Form.Label>Search Access Point by MAC</Form.Label>
        <Form.Control
          type="text"
          placeholder="MAC Address"
          value={searchMac}
          onChange={(e) => setSearchMac(e.target.value)}
        />
        <Button
          variant="secondary"
          onClick={getAccessPointInfo}
          className="mt-2"
        >
          Search Access Point
        </Button>
      </Form.Group>
      {accessPointInfo && (
        <div>
          <h3>Information about Access Point</h3>
          <p>
            <strong>SSID:</strong> {accessPointInfo.ssid}
          </p>
          <p>
            <strong>BSSID/MAC Address:</strong> {accessPointInfo.mac}
          </p>
          <p>
            <strong>ITK:</strong> {accessPointInfo.price}
          </p>
          <p>
            <strong>Max Time (seconds):</strong> {accessPointInfo.maxTime}
          </p>
          <p>
            <strong>Owner:</strong> {accessPointInfo.owner}
          </p>
        </div>
      )}
    </Container>
  );
};

export default SearchAccessPoint;
