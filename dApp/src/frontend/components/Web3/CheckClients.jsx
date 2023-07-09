import React, { useState, useEffect } from "react";
import Web3 from "web3";
import WiFeeAccessAbi from "../../contractsABI/WiFeeAccess.json";
import WiFeeRegistryAbi from "../../contractsABI/WiFeeRegistry.json";
import { Button, Container, Card, Table } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import "../main.css";

const CheckClients = ({ wiFeeAccessAddress, wiFeeRegistryAddress }) => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [contract, setContract] = useState(null);
  const [ownerAPs, setOwnerAPs] = useState([]);
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
      if (web3 && wiFeeAccessAddress && wiFeeRegistryAddress) {
        console.log("Access contract address:", wiFeeAccessAddress);
        console.log("Registry contract address:", wiFeeRegistryAddress);
        const wiFeeAccessContract = new web3.eth.Contract(
          WiFeeAccessAbi.abi,
          wiFeeAccessAddress
        );
        const wiFeeRegistryContract = new web3.eth.Contract(
          WiFeeRegistryAbi.abi,
          wiFeeRegistryAddress
        );
        setContract({
          access: wiFeeAccessContract,
          registry: wiFeeRegistryContract,
        });
      }
    };

    initContract();
  }, [web3, wiFeeAccessAddress, wiFeeRegistryAddress]);

  useEffect(() => {
    getOwnerAPs();
  }, [contract, accounts]);

  const getOwnerAPs = async () => {
    console.log("Getting owner's APs...");
    if (contract && contract.registry && accounts.length > 0) {
      try {
        const apData = await contract.registry.methods
          .getAPOfOwner()
          .call({ from: accounts[0] });
        console.log(apData);
        const ownerAPs = [];

        for (const ap of apData) {
          const mac = ap[2];
          const clientTokens = await contract.access.methods
            .getConnectedUserTokens(mac)
            .call();
          const clientDetails = [];
          for (const token of clientTokens) {
            const connectionInfo = await contract.access.methods
              .getConnectionInfo(token)
              .call();
            const bandwidthDataLimit = await contract.access.methods
              .getConnectionBandwidthDataLimit(token)
              .call();
            const startTime = new Date(connectionInfo.startTime * 1000);
            const endTime = new Date(connectionInfo.endTime * 1000);
            const bandwidth = bandwidthDataLimit[0];
            const dataLimit = bandwidthDataLimit[1];
            clientDetails.push({
              clientToken: token,
              startTime,
              endTime,
              bandwidth,
              dataLimit,
            });
          }
          ownerAPs.push({ mac, clientDetails });
        }

        setOwnerAPs(ownerAPs);
      } catch (error) {
        console.error("Error getting owner's APs:", error.message);
      }
    }
  };

  const removeAP = (mac) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, remove it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await contract.registry.methods
            .removeAP(mac)
            .send({ from: accounts[0] });
          // Update the ownerAPs state to remove the AP
          setOwnerAPs((prevOwnerAPs) =>
            prevOwnerAPs.filter((ap) => ap.mac !== mac)
          );
          Swal.fire(
            "Removed!",
            "The Access Point has been removed.",
            "success"
          );
        } catch (error) {
          console.error("Error removing Access Point:", error.message);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "An error occurred while removing the Access Point.",
          });
        }
      }
    });
  };

  const disconnectUser = async (userToken) => {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userToken: userToken }),
    };

    fetch("/api/disconnect", requestOptions)
      .then((response) => {
        if (response.ok) {
          // Update the ownerAPs state to remove the disconnected user
          setOwnerAPs((prevOwnerAPs) =>
            prevOwnerAPs.map((ap) => {
              return {
                ...ap,
                clientDetails: ap.clientDetails.filter(
                  (client) => client.clientToken !== userToken
                ),
              };
            })
          );
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

  return (
    <Container>
      {ownerAPs.map((ap, index) => (
        <Card key={index}>
          <Card.Body>
            <Card.Title>
              Access Point {index + 1}
              <Button
                variant="danger"
                style={{ float: "right" }}
                onClick={() => removeAP(ap.mac)}
              >
                Delete
              </Button>
            </Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              MAC: {ap.mac}
            </Card.Subtitle>
            <Card.Text>
              <Table striped bordered hover className="styled-table">
                <thead>
                  <tr>
                    <th className="userToken">Client Token</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Bandwidth (Mbps)</th>
                    <th>Data Limit (GB)</th>
                    <th>Disconnect</th>
                  </tr>
                </thead>
                <tbody>
                  {ap.clientDetails.map((client, clientIndex) => (
                    <tr key={clientIndex}>
                      <td>{client.clientToken}</td>
                      <td>{client.startTime.toLocaleString()}</td>
                      <td>{client.endTime.toLocaleString()}</td>
                      <td>{client.bandwidth}</td>
                      <td>{client.dataLimit}</td>
                      <td>
                        <Button
                          variant="danger"
                          onClick={() => disconnectUser(client.clientToken)}
                        >
                          X
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Text>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default CheckClients;
