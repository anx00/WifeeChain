import axios from 'axios';
import React, { useEffect, useState } from 'react';

export function ConnectedClient() {
  const [mac, setMac] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      axios.get('http://192.168.1.128:3001/macAddress')
        .then(response => {
          setMac(response.data.macAddresses.join(', ')); // join the array of MAC addresses into a string separated by commas
        })
        .catch(error => {
          console.error(error);
        });
    }, 5000); // call the API every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p>{mac}</p>
    </div>
  );
}
