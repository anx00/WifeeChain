import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import { RainbowButton } from "./RainbowKit/RainbowButton";
import "./main.css";
import logo from '../assets/logo2.png';

function Navigation() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [navbarColor, setNavbarColor] = useState({
    background: "transparent",
    transition: "background 0.3s ease",
  });

  useEffect(() => {
    const handleScroll = () => {
      console.log("Scrolling!");
      const position = window.pageYOffset;
      setScrollPosition(position);
      if (position > 0) {
        setNavbarColor({
          background:
            "linear-gradient(to right, #FFFFFF 30%, #B7D8FF, #D5C5FF)",
          transition: "background 0.3s ease",
        });
      } else {
        setNavbarColor({
          background: "transparent",
          transition: "background 0.3s ease",
        });
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Navbar
      expand="lg"
      collapseOnSelect
      style={navbarColor}
      className={"fixed-top"}
    >
      <Container fluid>
        <Navbar.Brand href="#home" className="d-flex align-items-center logo">
          <img
            src={logo}
            className="d-inline-block align-top me-2"
            alt="WiFee Logo"
          />
          <span className="brand-name">WifeeChain</span>
        </Navbar.Brand>
          <Nav className="ms-auto me-2">
            <span className="rainbow-button">
              { <RainbowButton /> }
            </span>
            {/* Uncomment the below lines if you want to add more navigation items later */}
            {/* <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/buy-tokens" className="nav-link">
                Buy Tokens
              </Link>
              <Link to="/register-access-point" className="nav-link">
                Register AP
              </Link>
              <Link to="/connect-access-point" className="nav-link">
                Connect AP
              </Link>
              <Link to="/plans" className="nav-link">
                Plans
              </Link> */}
          </Nav>
      </Container>
    </Navbar>
  );
}

export default Navigation;
