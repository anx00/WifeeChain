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

  useEffect(() => {
    setHeight(window.innerHeight);
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
            { <GetUserTokenButton
              connectAccessPointAddress={connectAccessPointAddress}
              userToken={userToken}
              setUserToken={setUserToken}
            /> }
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
        { <Parallax y={[-40, 40]}>
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
            />
          </div>
        </Parallax> }
        {/* <Parallax y={[-60, 60]}>
          <div
            style={{
              height: `${height}px`,
              backgroundImage: "url('/assets/green.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <DisconnectFromAP
              connectAccessPointAddress={connectAccessPointAddress}
              userToken={userToken}
            />
          </div>
        </Parallax> */}
      </div>
    </ParallaxProvider>
  );
}

export default Home;
