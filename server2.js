const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const Web3 = require('web3');
const app = express();
require('dotenv').config();
app.use(express.json());

const web3 = new Web3(process.env.WEB3_URL);
const contractABI = JSON.parse(fs.readFileSync('./contractsABI/WiFeeAccess.json', 'utf-8')).abi;
const contractAddress = JSON.parse(fs.readFileSync('./contractsABI/WiFeeAccess-address.json', 'utf-8')).address;

const contract = new web3.eth.Contract(contractABI, contractAddress);

const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

let Connections = {};

// Function to retrieve lease data
async function getLeaseData(clientIp) {
  let leaseData;
  let leases = fs.readFileSync('/var/lib/misc/dnsmasq.leases', 'utf-8');
  leases.split('\n').forEach(lease => {
    let [expiryTime, macAddress, ipAddress, hostName, clientId] = lease.split(' ');
    if (ipAddress === clientIp) {
      let leaseExpiryDate = new Date(expiryTime * 1000);
      leaseData = { leaseExpiryDate, macAddress, ipAddress, hostName, clientId };
    }
  });

  return leaseData;
}

// Function to retrieve ssid and bssid
function getSsidAndBssid() {
  return new Promise((resolve, reject) => {
    exec('sudo iw wlan1 info', (error, stdout, stderr) => {
      if (error) {
        reject(`Command execution error: ${error.message}`);
        return;
      }

      if (stderr) {
        reject(`Command execution stderr: ${stderr}`);
        return;
      }

      const info = stdout;
      const ssidRegex = /ssid (.+)/i;
      const bssidRegex = /addr (.+)/i;

      const ssidMatch = info.match(ssidRegex);
      const bssidMatch = info.match(bssidRegex);

      const ssid = ssidMatch ? ssidMatch[1].trim() : 'SSID not found';
      const bssid = bssidMatch ? bssidMatch[1].trim() : 'BSSID not found';

      resolve({ ssid, bssid });
    });
  });
}

// Function to retrieve client IP
function getClientIp(req) {
  let clientIp = (req.headers['x-forwarded-for'] || '').split(',').pop().trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  return clientIp;
}

// Function to retrieve AP info
async function getAPInfo(bssid) {
  try {
    const apInfo = await contract.methods.getAPInfo(bssid).call({from: account.address});
    console.log(apInfo);
    return apInfo;
  } catch (error) {
    console.log('Error calling getAPInfo:', error);
    throw error;
  }
}

// Function to allow traffic for authenticated user and limit bandwidth
function allowTraffic(macAddress, ipAddress, bandwidth) {
  return new Promise((resolve, reject) => {
    exec(`sudo iptables -I FORWARD -m mac --mac-source ${macAddress} -j ACCEPT`, (error, stdout, stderr) => {
      if (error) {
        console.log(`Error updating iptables: ${error}`);
        reject(error);
        return;
      }

      // Apply bandwidth limit using tcset command
      exec(`sudo tcset --device wlan1 --rate ${bandwidth} --direction outgoing --network ${ipAddress}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`Error setting bandwidth limit: ${error}`);
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });
  });
}


// Function to deny traffic for authenticated user
function denyTraffic(macAddress) {
  return new Promise((resolve, reject) => {
    exec(`sudo iptables -D FORWARD -m mac --mac-source ${macAddress} -j ACCEPT`, (error, stdout, stderr) => {
      if (error) {
        console.log(`Error updating iptables: ${error}`);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// Run this function periodically
async function checkForDisconnectedClients() {
    // Run the hostapd_cli command to get all currently connected clients
    //console.log('Checking for disconnected clients...');
    exec('hostapd_cli all_sta', async (err, stdout, stderr) => {
      if (err) {
        console.error('Error getting connected clients:', err);
        return;
      }
      
      // Parse the MAC addresses from the output
      let macAddresses = stdout.split('\n').filter(line => line.match(/^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/));
      
      // Check each connection in Connections
      for (let ip in Connections) {
        let connection = Connections[ip];
        if (!macAddresses.includes(connection.macAddress)) {
          // This client has disconnected
          
          try {
            // Deny the traffic
            await denyTraffic(connection.macAddress);
            // Disconnect the user in the smart contract
            await contract.methods.disconnect(connection.userToken).send({ from: account.address, gas: 3000000 });
            // Remove the connection
            delete Connections[ip];
            console.log(`Successfully disconnected IP: ${ip}`);
            // Log the disconnection
            let logEntry = `Manual disconnection at ${new Date().toISOString()}: ${ip}\n`;
            fs.appendFileSync('log.txt', logEntry);
          } catch (error) {
            console.error(`Failed to disconnect ${ip}: ${error}`);
          }
        }
      }
    });
  }

// ENDPOINT to obtain the ap info
app.post('/ap-info', async (req, res) => {
    console.log("[AP-INFO] Received a request for AP info");
    console.log("[AP-INFO] Request headers: ", req.headers);
    console.log("[AP-INFO] Request body: ", req.body);
    
    let clientIp = getClientIp(req);
    console.log(`[AP-INFO] Client IP is: ${clientIp}`);
    
    let leaseData = await getLeaseData(clientIp);
    console.log("[AP-INFO] Lease data: ", leaseData);
  
    if (leaseData) {
      try {
        const { ssid, bssid } = await getSsidAndBssid();
        console.log(`[AP-INFO] Retrieved SSID: ${ssid} and BSSID: ${bssid}`);
        
        const userToken = req.body.userToken; 
        console.log(`[AP-INFO] User token is: ${userToken}`);
        
        const now = new Date();
  
        Connections[clientIp] = { ...req.body, ...leaseData, ssid, bssid };
        console.log("[AP-INFO] Connections: ", Connections);
  
        // Start logging
        let logEntry = `Process: ${process.pid}, Start time: ${now.toISOString()}, Client IP: ${clientIp}, MAC: ${leaseData.macAddress}, User Token: ${req.body.userToken}, BSSID: ${bssid}, SSID: ${ssid}\nConnection data:\n${JSON.stringify(Connections[clientIp], null, 2)}\n`;
        fs.appendFileSync('log.txt', logEntry);
  
        // Retrieve the AP info
        try {
          console.log(`[AP-INFO] Attempting to retrieve AP info for BSSID: ${bssid}`);
          const apInfo = await getAPInfo(bssid);
          console.log("[AP-INFO] Successfully retrieved AP info");
        } catch (error) {
          console.error('[AP-INFO] Error fetching AP info:', error);
          res.status(500).json({ error: 'Error fetching AP info' });
          return;
        }
  
        // Respond with BSSID/MAC
        res.status(200).json({ mac: bssid });
        console.log("[AP-INFO] Response sent with BSSID");
      } catch (error) {
        console.error(`[AP-INFO] Error obtaining ssid and bssid: ${error}`);
        // Handle the error here, maybe return a response to indicate the error
        res.status(500).json({ error: `Failed to obtain SSID and BSSID: ${error}` });
        return;
      }
    } else {
      console.log("[AP-INFO] Lease data not found");
      // Send appropriate error response
      res.status(400).json({ error: 'Unable to connect due to missing lease data' });
    }
  });
  


// ENDPOINT to allow traffic for authenticated user
app.post('/connect', async (req, res) => {
    console.log("[CONNECT] Received a connect request");
    console.log(`[CONNECT] Request headers: ${JSON.stringify(req.headers)}`);
    console.log(`[CONNECT] Request body: ${JSON.stringify(req.body)}`);
    
    const userToken = req.body.userToken;
    console.log(`[CONNECT] User token is: ${userToken}`);
    
    if (!userToken) {
      console.log("[CONNECT] User token missing");
      res.status(400).json({ error: 'Missing userToken' });
      return;
    }
  
    // Get connection times from blockchain
    let connectionTimes;
    try {
      console.log(`[CONNECT] Attempting to get connection times for user token: ${userToken}`);
      connectionTimes = await contract.methods.getConnectionTimes(userToken).call();
    } catch (error) {
      console.error("Error getting connection times from the blockchain: ", error);
      return;
    }
    
    const blockchainEndTime = connectionTimes[2]; 
    const expiryConnection = new Date(blockchainEndTime * 1000);
    console.log(`[CONNECT] Connection expiry time is: ${expiryConnection}`);
    
    let clientIp = getClientIp(req);
    console.log(`[CONNECT] Client IP is: ${clientIp}`);
    
    if (!Connections[clientIp]) {
      console.log(`[CONNECT] No connection information found for IP: ${clientIp}`);
      res.status(400).json({ error: 'Connection information not found' });
      return;
    }
  
    let connection = Connections[clientIp];
    // Add the expiryConnection to the connection
    connection.expiryConnection = expiryConnection;
    console.log(`[CONNECT] Updated connection info: ${JSON.stringify(connection)}`);
    
    // Allow the traffic
    try {
      console.log(`[CONNECT] Attempting to allow traffic for MAC address: ${connection.macAddress}`);
      const result = await allowTraffic(connection.macAddress, connection.ipAddress, "100Kbps");
      console.log("[CONNECT] Successfully allowed traffic");
    } catch (error) {
      console.error('[CONNECT] Error allowing traffic:', error);
      res.status(500).json({ error: 'Error allowing traffic' });
      return;
    }

    // --------------- Schedule the automatic disconnection -----------
    const now = new Date();
    const msUntilExpiry = expiryConnection.getTime() - now.getTime();
    
    if (msUntilExpiry > 0) {  // Only set the timeout if the expiry time is in the future
        setTimeout(async () => {
        try {
            console.log(`[CONNECT] Attempting automatic disconnection for IP: ${clientIp}`);
            // Deny the traffic
            await denyTraffic(connection.macAddress);
            // Disconnect the user in the smart contract
            await contract.methods.disconnect(userToken).send({ from: account.address, gas: 3000000 });
            // Remove the connection
            delete Connections[clientIp];
            console.log(`[CONNECT] Successfully disconnected IP: ${clientIp}`);
            // Log the automatic disconnection
            let logEntry = `Automatic disconnection at ${new Date().toISOString()}: ${clientIp}\n`;
            fs.appendFileSync('log.txt', logEntry);
        } catch (error) {
            console.error(`[CONNECT] Failed to automatically disconnect ${clientIp}: ${error}`);
        }
        }, msUntilExpiry);
    }
    
    res.status(200).json({ message: 'Connection successful' });
    console.log("[CONNECT] Response sent, connection successful");
  });
  
  

// ENDPOINT to disconnect user
app.post('/disconnect', async (req, res) => {
    console.log("[DISCONNECT] Received a disconnect request");
    console.log(`[DISCONNECT] Request headers: ${JSON.stringify(req.headers)}`);
    console.log(`[DISCONNECT] Request body: ${JSON.stringify(req.body)}`);
  
    const userToken = req.body.userToken;
    console.log(`[DISCONNECT] User token is: ${userToken}`);
    
    if (!userToken) {
      console.log("[DISCONNECT] User token missing");
      res.status(400).json({ error: 'Missing userToken' });
      return;
    }
  
    let connection = null;
    let clientIp = null;
    // Iterate over the Connections object and find the one with the same userToken
    for (let ip in Connections) {
      if (Connections[ip].userToken === userToken) {
        connection = Connections[ip];
        clientIp = ip;
        break;
      }
    }
  
    if (!connection) {
      console.log(`[DISCONNECT] No connection information found for userToken: ${userToken}`);
      res.status(400).json({ error: 'Connection information not found' });
      return;
    }
    
    console.log(`[DISCONNECT] Retrieved connection info: ${JSON.stringify(connection)}`);
    
    // Deny the traffic
    try {
      console.log(`[DISCONNECT] Attempting to deny traffic for MAC address: ${connection.macAddress}`);
      const result = await denyTraffic(connection.macAddress);
      console.log("[DISCONNECT] Successfully denied traffic");
    } catch (error) {
      console.error('[DISCONNECT] Error denying traffic:', error);
      res.status(500).json({ error: 'Error denying traffic' });
      return;
    }
    
    // Disconnect the user in the smart contract
    try {
      console.log(`[DISCONNECT] Attempting to disconnect user in smart contract with user token: ${userToken}`);
      const receipt = await contract.methods.disconnect(userToken).send({ from: account.address, gas: 3000000 });
      console.log('[DISCONNECT] User disconnected successfully in smart contract, Receipt:', receipt);
    } catch (error) {
      console.error('[DISCONNECT] Error disconnecting user in the smart contract:', error);
      res.status(500).json({ error: 'Error disconnecting user in the smart contract' });
      return;
    }
    
    // End logging
    let end = new Date();
    let endLogEntry = `Process: ${process.pid}, End time: ${end.toISOString()}, Client IP: ${clientIp}, MAC: ${connection.macAddress}, User Token: ${userToken}, BSSID: ${connection.bssid}, SSID: ${connection.ssid}\nInternet access revoked.\n`;
    console.log("[DISCONNECT] Writing end log entry");
    fs.appendFileSync('log.txt', endLogEntry);
    
    delete Connections[clientIp];
    console.log(`[DISCONNECT] Connection info for userToken: ${userToken} deleted`);
    
    res.status(200).json({ message: 'Disconnection successful' });
    console.log("[DISCONNECT] Response sent, disconnection successful");
  });

// Run checkForDisconnectedClients every minute
setInterval(checkForDisconnectedClients, 1000);
app.listen(5555, () => console.log('Server listening on port 5555'));