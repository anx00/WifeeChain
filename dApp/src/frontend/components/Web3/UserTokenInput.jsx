import React from "react";
import { Form } from "react-bootstrap";

const UserTokenInput = ({ userToken, setUserToken }) => {
  return (
    <Form>
      <Form.Group>
        <Form.Label>User Token</Form.Label>
        <Form.Control
          type="text"
          placeholder="User Token"
          value={userToken}
          onChange={(e) => setUserToken(e.target.value)}
        />
      </Form.Group>
    </Form>
  );
};

export default UserTokenInput;
