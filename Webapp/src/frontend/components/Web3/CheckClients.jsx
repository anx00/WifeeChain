import React, { useState, useEffect } from "react";
import Web3 from "web3";
import WiFeeAccessAbi from "../../contractsABI/WiFeeAccess.json";
import { Button, Container, Form, Table } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";

const CheckClients = ({ wiFeeAccessAddress }) => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [searchMac, setSearchMac] = useState("");
  const [connectedUserTokens, setConnectedUserTokens] = useState([]);

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
      if (web3 && wiFeeAccessAddress) {
        console.log("Contract address:", wiFeeAccessAddress);
        const wiFeeAccessContract = new web3.eth.Contract(
          WiFeeAccessAbi.abi,
          wiFeeAccessAddress
        );
        setContract(wiFeeAccessContract);
      }
    };

    initContract();
  }, [web3, wiFeeAccessAddress]);

  const checkClients = async () => {
    console.log("Checking clients...");
    if (contract && searchMac) {
      try {
        const clients = await contract.methods
          .getConnectedUserTokens(searchMac)
          .call();
        setConnectedUserTokens(clients);
      } catch (error) {
        console.error("Error checking clients:", error.message);
        if (error.message.includes("Access point not registered")) {
          Swal.fire({
            icon: "error",
            title: "Access Point Not Found",
            text: "The access point you are searching for does not exist.",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "An error occurred while checking clients.",
          });
        }
      }
    }
  };

  const disconnectUser = async (userToken) => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userToken: userToken })
    };
  
    fetch("/api/disconnect", requestOptions)
      .then(response => {
        if (response.ok) {
          // Update the connectedUserTokens state
          const updatedUserTokens = connectedUserTokens.filter(
            (token) => token !== userToken
          );
          setConnectedUserTokens(updatedUserTokens);
        } else {
          throw new Error("Failed to disconnect user");
        }
      })
      .catch((error) => {
        console.error("Error disconnecting user:", error.message);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "An error occurred while disconnecting the user.",
        });
      });
  };
  

  const getConnectionTimes = async (userToken) => {
    if (contract) {
      try {
        const connectionInfo = await contract.methods
          .getConnectionInfo(userToken)
          .call();
  
        const startTime = new Date(connectionInfo.startTime * 1000); // Convert Unix timestamp to milliseconds
        const endTime = new Date(connectionInfo.endTime * 1000);
  
        const currentTime = new Date(); // Get the current time
  
        const startTimeString = startTime.toLocaleString();
        const endTimeString = endTime.toLocaleString();
        const currentTimeString = currentTime.toLocaleString();
  
        console.log(`Start Time: ${startTimeString}`);
        console.log(`Current Time: ${currentTimeString}`);
        console.log(`End Time: ${endTimeString}`);

      } catch (error) {
        console.error("Error getting connection times:", error.message);
      }
    }
  };
  
  

  return (
    <Container>
      <h2>Check Clients</h2>
      <Form.Group>
        <Form.Label>Access Point MAC Address</Form.Label>
        <Form.Control
          type="text"
          placeholder="MAC Address"
          value={searchMac}
          onChange={(e) => setSearchMac(e.target.value)}
        />
        <Button variant="secondary" onClick={checkClients} className="mt-2">
          Check Clients
        </Button>
      </Form.Group>
      {connectedUserTokens.length > 0 && (
        <div>
          <h3>Clients Connected to Access Point</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Client Token</th>
                <th>Disconnect</th>
                <th>Check Connection Times</th>
              </tr>
            </thead>
            <tbody>
              {connectedUserTokens.map((token, index) => (
                <tr key={index}>
                  <td>{token}</td>
                  <td>
                    <Button
                      variant="danger"
                      onClick={() => disconnectUser(token)}
                    >
                      Disconnect
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant="info"
                      onClick={() => getConnectionTimes(token)}
                    >
                      Check Connection Times
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
};

export default CheckClients;
