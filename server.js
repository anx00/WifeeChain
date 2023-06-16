
const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const Web3 = require('web3');
const app = express();
app.use(express.json());

const web3 = new Web3('https://dc89-81-39-202-95.ngrok-free.app');
const contractABI = JSON.parse(fs.readFileSync('./contractsABI/WiFeeAccess.json', 'utf-8')).abi;
const contractAddress = JSON.parse(fs.readFileSync('./contractsABI/WiFeeAccess-address.json', 'utf-8')).address;

const contract = new web3.eth.Contract(contractABI, contractAddress);

const account = web3.eth.accounts.privateKeyToAccount('0x' + '2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6');
web3.eth.accounts.wallet.add(account);

let Connections = {};

app.post('/connect', async (req, res) => {
  let clientIp = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let leaseData;
  let leases = fs.readFileSync('/var/lib/misc/dnsmasq.leases', 'utf-8');
  leases.split('\n').forEach(lease => {
    let [expiryTime, macAddress, ipAddress, hostName, clientId] = lease.split(' ');
    if (ipAddress === clientIp) {
      let leaseExpiryDate = new Date(expiryTime * 1000);
      leaseData = {leaseExpiryDate, macAddress, ipAddress, hostName, clientId };
    }
  });

  console.log("Lease data: ", leaseData);

  if (leaseData) {
    exec('sudo iw wlan1 info', async (error, stdout, stderr) => {
      if (error) {
        console.error(`Command execution error: ${error.message}`);
        return;
      }
  
      if (stderr) {
        console.error(`Command execution stderr: ${stderr}`);
        return;
      }
  
      const info = stdout;
      const ssidRegex = /ssid (.+)/i;
      const bssidRegex = /addr (.+)/i;
  
      const ssidMatch = info.match(ssidRegex);
      const bssidMatch = info.match(bssidRegex);
  
      const ssid = ssidMatch ? ssidMatch[1].trim() : 'SSID not found';
      const bssid = bssidMatch ? bssidMatch[1].trim() : 'BSSID not found';

      const userToken = req.body.userToken; 

      const now = new Date();

      Connections[clientIp] = { ...req.body, ...leaseData, ssid, bssid };
      console.log("Connections: ", Connections);

      // Start logging
      let logEntry = `Process: ${process.pid}, Start time: ${now.toISOString()}, Client IP: ${clientIp}, MAC: ${leaseData.macAddress}, User Token: ${req.body.userToken}, BSSID: ${bssid}, SSID: ${ssid}\nConnection data:\n${JSON.stringify(Connections[clientIp], null, 2)}\n`;
      fs.appendFileSync('log.txt', logEntry);

      // Retrieve the AP info
      try {
        const apInfo = await contract.methods.getAPInfo(bssid).call({from: account.address});
        console.log(apInfo);
      } catch (error) {
        console.log('Error calling getAPInfo:', error);
      }

      // Allow traffic for authenticated user
      exec(`sudo iptables -I FORWARD -m mac --mac-source ${leaseData.macAddress} -j ACCEPT`, (error, stdout, stderr) => {
        if (error) {
          console.log(`Error updating iptables: ${error}`);
          return;
        }
      });

      let timeoutDuration = leaseData.leaseExpiryDate.getTime() - new Date().getTime(); // default timeout
      let timeout; // Declare the timeout variable outside of the setInterval function

      let checkInterval = setInterval(async () => {
        let connectionTimes;
        try {
          connectionTimes = await contract.methods.getConnectionTimes(userToken).call();
        } catch (error) {
          console.error("Error getting connection times from the blockchain: ", error);
          return;
        }

        const blockchainEndTime = connectionTimes[2]; 
        const expiryConnection = new Date(blockchainEndTime * 1000);
        console.log("Current time: ", new Date().toISOString());
        console.log("Updated expiry Connection: ",expiryConnection);
        
        // Update the timeout duration if the blockchain write has occurred
        if (expiryConnection.getTime() > new Date(0).getTime()) {
          timeoutDuration = expiryConnection.getTime() - new Date().getTime();

          // Clear the old timeout
          clearTimeout(timeout);

          // Set a new timeout with the updated duration
          timeout = setTimeout(revokeAccess, timeoutDuration);
          
          clearInterval(checkInterval);
        }
      }, 1000); // check every 10 seconds, adjust this to your needs     

      // Set timer to revoke internet access
      const revokeAccess = async () => {
        console.log("Timeout triggered");
        try {
          // Retrieve the connection info
          const connectionInfo = await contract.methods.getConnectionInfo(req.body.userToken).call({from: account.address});
          
          // Check if the user is still connected
          if (connectionInfo.isConnected) {
              // Revoke internet access
              exec(`sudo iptables -D FORWARD -m mac --mac-source ${leaseData.macAddress} -j ACCEPT`, (error, stdout, stderr) => {
                  if (error) {
                      console.log(`Error updating iptables: ${error}`);
                      return;
                  }
              });

              // Disconnect the user in the smart contract
              const receipt = await contract.methods.disconnect(req.body.userToken).send({ from: account.address, gas: 3000000 });
              console.log('Receipt:', receipt);
          }

          // End logging
          let end = new Date();
          let endLogEntry = `Process: ${process.pid}, End time: ${end.toISOString()}, Client IP: ${clientIp}, MAC: ${leaseData.macAddress}, User Token: ${req.body.userToken}, BSSID: ${bssid}, SSID: ${ssid}\nInternet access revoked.\n`;
          fs.appendFileSync('log.txt', endLogEntry);

        } catch (error) {
          console.error('Error disconnecting user:', error);
        }
      };

      // Set timer to revoke internet access
      timeout = setTimeout(revokeAccess, timeoutDuration);

      // Respond with BSSID/MAC
      res.status(200).json({ mac: bssid });
    });
  } else {
    // Send appropriate error response
    res.status(400).json({ error: 'Unable to connect due to missing lease data' });
  }
});

app.post('/manual-disconnect', async (req, res) => {
  const userToken = req.body.userToken;
  const macAddress = req.body.macAddress; // The MAC address is needed to update the iptables

  try {
    // Disconnect the user in the smart contract
    const receipt = await contract.methods.disconnect(userToken).send({ from: account.address, gas: 3000000 });
    console.log('Receipt:', receipt);

    // Revoke internet access
    exec(`sudo iptables -D FORWARD -m mac --mac-source ${macAddress} -j ACCEPT`, (error, stdout, stderr) => {
      if (error) {
        console.log(`Error updating iptables: ${error}`);
        return;
      }
    });

    res.status(200).json({ message: 'User has been manually disconnected' });
  } catch (error) {
    console.error('Error disconnecting user:', error);
    res.status(500).json({ error: 'Error disconnecting user' });
  }
});


app.listen(5555, () => console.log('Server listening on port 5555'));