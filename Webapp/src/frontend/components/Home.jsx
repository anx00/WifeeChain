import React, { useState, useEffect } from "react";
import { ParallaxProvider, Parallax } from "react-scroll-parallax";
import GetUserTokenButton from "./Web3/GetUserTokenButton";
import ConnectToAP from "./Web3/ConnectToAP";
import DisconnectFromAP from "./Web3/DisconnectFromAP";
import BuyTokens from "./Web3/BuyTokens";
import "./main.css";

function Home({ connectAccessPointAddress, internetTokenAddress }) {
  const [height, setHeight] = useState(0);
  const [userToken, setUserToken] = useState("");
  const [location, setLocation] = useState({});

  useEffect(() => {
    setHeight(window.innerHeight);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 50000,
          maximumAge: 0,
        }
      );
      console.log(location.latitude, location.longitude);
    } else {
      console.log("Geolocation is not supported by this browser.");
    }
  }, []);

  return (
    <ParallaxProvider>
      <div style={{ height: `${height}px` }}>
        <Parallax y={[-20, 20]}>
          <div
            style={{
              height: `${height}px`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background:
                "linear-gradient(to right, #FFFFFF 30%, #B7D8FF, #D5C5FF)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {
              <GetUserTokenButton
                connectAccessPointAddress={connectAccessPointAddress}
                userToken={userToken}
                setUserToken={setUserToken}
              />
            }
          </div>
        </Parallax>
        <Parallax y={[-40, 40]}>
          <div
            style={{
              height: `${height}px`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background:
                "linear-gradient(to right, #2E2E2E 30%, #483D8B, #9400D3)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <BuyTokens internetTokenAddress={internetTokenAddress} />
          </div>
        </Parallax>
        {
          <Parallax y={[-40, 40]}>
            <div
              style={{
                height: `${height}px`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background:
                  "linear-gradient(to right, #D5C5FF 30%, #B7D8FF, #2E2E2E)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <ConnectToAP
                connectAccessPointAddress={connectAccessPointAddress}
                userToken={userToken}
                location={location}
              />
            </div>
          </Parallax>
        }
      </div>
    </ParallaxProvider>
  );
}

export default Home;
