import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import './Plans.css';
import { useAccount } from 'wagmi';



function Plan() {

  const { isConnected } = useAccount();

  
  if (!isConnected) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="text-center">
          <p className="fs-4 mb-0">Waiting for a wallet...</p>
          <div className="spinner-border mt-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        </div>
    );
  }

    return (
        <Container style={{marginTop: "5%"}}>
          <h1 style={{textAlign: "center", fontSize: "2rem", marginBottom: "4rem"}}>Choose a plan to connect to this Wi-Fi Network</h1>
        <Row style={{justifyContent: "center"}}>
            <Col className="">
              <Card className="plan-card">
                <Card.Body>
                  <Card.Title className="plan-title">BASIC</Card.Title>
                  <ul className="plan-list">
                    <li>60 minutes connectivity</li>
                    <li>20 mb/s bandwith limit</li>
                    <li>2 GB data limit usage</li>
                    <li>No VPN connection</li>
                    <li>1 device</li>
                  </ul>
                  <Card.Text className="plan-price">
                    <strong>0.5 WFT</strong>
                  </Card.Text>
                  <Button variant="primary">Buy this Plan</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col className="col-md-4">
              <Card className="plan-card">
                <Card.Body>
                  <Card.Title className="plan-title">STANDARD</Card.Title>
                  <ul className="plan-list">
                    <li>120 minutes connectivity</li>
                    <li>50 mb/s bandwith limit</li>
                    <li>5 GB data limit usage</li>
                    <li>No VPN connection</li>
                    <li>2 devices</li>
                  </ul>
                  <Card.Text className="plan-price">
                    <strong>1 WFT</strong>
                  </Card.Text>
                  <Button variant="primary">Buy this Plan</Button>
                </Card.Body>
              </Card>
            </Col>
            <Col className="col-md-">
              <Card className="plan-card">
                <Card.Body>
                  <Card.Title className="plan-title">PREMIUM</Card.Title>
                  <ul className="plan-list">
                    <li>300 minutes connectivity</li>
                    <li>100 mb/s bandwith limit</li>
                    <li>10 GB data limit usage</li>
                    <li>VPN connection</li>
                    <li>Unlimited devices</li>
                  </ul>
                  <Card.Text className="plan-price">
                    <strong>2 WFT</strong>
                  </Card.Text>
                  <Button variant="primary">Buy this Plan</Button>
                </Card.Body>
              </Card>
            </Col>
            </Row>
        </Container>
      );
    };

export default Plan;
