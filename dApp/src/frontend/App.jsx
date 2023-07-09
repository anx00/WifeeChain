import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./components/Home";
import Footer from "./components/Footer";
import Navigation from "./components/Navbar";
import QRProvider from "./components/ClientRegister/QRProvider";
import Plans from "./components/Plans/Plan";
import BuyTokens from "./components/Web3/BuyTokens";
import RegisterAccessPoint from "./components/Web3/RegisterAccessPoint";
import SearchAccessPoint from "./components/Web3/SearchAccessPoint";
import InternetTokenAddress from "./contractsABI/InternetToken-address.json";
import RegisterAccessPointAddress from "./contractsABI/WiFeeRegistry-address.json";
import ConnectAccessPointAddress from "./contractsABI/WiFeeAccess-address.json";
import { useState } from "react";
import GetUserTokenButton from "./components/Web3/GetUserTokenButton";
import UserTokenInput from "./components/Web3/UserTokenInput";
import ConnectToAP from "./components/Web3/ConnectToAP";
import DisconnectFromAP from "./components/Web3/DisconnectFromAP";
import SellTokens from "./components/Web3/SellTokens";
import { Container, Row, Col } from "react-bootstrap";
import CheckClients from "./components/Web3/CheckClients";

function App() {
  const internetTokenAddress = InternetTokenAddress.address;
  const registerAccessPointAddress = RegisterAccessPointAddress.address;
  const connectAccessPointAddress = ConnectAccessPointAddress.address;

  return (
    <div>
      <BrowserRouter>
        <Navigation account={0} />
        <Routes>
          {
            <Route
              path="/"
              element={
                <Home
                  connectAccessPointAddress={connectAccessPointAddress}
                  internetTokenAddress={internetTokenAddress}
                />
              }
            />
          }
          <Route
            path="/buy-tokens"
            element={
              <Container className="d-flex justify-content-center">
                <BuyTokens internetTokenAddress={internetTokenAddress} />
                <SellTokens internetTokenAddress={internetTokenAddress} />
              </Container>
            }
          />
          <Route
            path="/register-access-point"
            element={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background:
                    "linear-gradient(to right, #F5F5F5 30%, #B7D8FF, #D5C5FF)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  minHeight: "100vh", // Set minimum height to make sure the background covers the entire viewport
                }}
              >
                <Container style={{ paddingTop: "80px" }}>
                  <RegisterAccessPoint
                    registerAccessPointAddress={registerAccessPointAddress}
                  />
                  {/* <SearchAccessPoint
          registerAccessPointAddress={registerAccessPointAddress}
        /> */}
                </Container>
              </div>
            }
          />
          <Route
            path="/check-access-point"
            element={
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background:
                    "linear-gradient(to right, #F5F5F5 30%, #B7D8FF, #D5C5FF)",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  minHeight: "100vh", // Set minimum height to make sure the background covers the entire viewport
                }}
              >
              <Container style={{ paddingTop: "80px" }}>
                <CheckClients
                  wiFeeAccessAddress={connectAccessPointAddress}
                  wiFeeRegistryAddress={registerAccessPointAddress}
                />
              </Container>
              </div>
            }
          />
          {/* <Route path="/plans" element={<Plans />} /> */}
        </Routes>
        {/* <Footer /> */}
      </BrowserRouter>
    </div>
  );
}

export default App;
