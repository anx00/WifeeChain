# **WifeeChain**

WifeeChain is a system that utilizes blockchain technology to revolutionize the utilization of wireless networks. It introduces a secure, incentivized, and open-source approach for sharing Internet access.

## **Summary of the System**

The proposed WifeeChain system is designed around two main roles: access point owners and users/consumers. Access point owners are responsible for registering and configuring their Internet-capable devices, typically routers, with device-specific characteristics and resource limits for Internet access. Users, on the other hand, interact with these pre-registered access points to obtain Internet connectivity.

To establish a full Internet connection, users must interact with a captive portal hosted within the access point itself. This captive portal serves as the interface between the user and the underlying blockchain technology. Upon connecting to the access point, users are redirected to the captive portal, where they follow intuitive steps. This process ensures user security, privacy, and allows them to acquire the system's native token, ITK, from a marketplace within the portal. Users can then use ITK to pay for the desired resources and customize their Internet connection according to their preferences.

Furthermore, the system provides users with visibility into the reputation of each access point. The reputation is represented by the amount of Recompense Tokens (RTK) owned by the access point owner. This feature enables users to make more informed decisions about which access point to connect to.

For the system to operate effectively, access points have critical functions. They continuously monitor and communicate with the blockchain to implement necessary changes, modify configurations, and update firewall rules on the device itself.

By combining blockchain technology, captive portals, and a marketplace for resource exchange, WifeeChain offers a secure, incentivized, and open-source approach to sharing Internet access.


## **Hardware Used**

- TP-Link TL-WN722N V1
- Raspberry Pi 3 Model B+

## **Project Organization**

The project is organized into three main folders, each serving a crucial role in the proper installation and functioning of the system:

1. AccessPoint:
    - This folder contains all the necessary configuration files to set up the device as a WifeeChain Wi-Fi access point.
    - It also includes the server required for authentication and connection revocation processes for users and devices.
2. Blockchain:
    - This folder focuses on the blockchain section of the project.
    - The contracts folder contains the smart contracts used in the system.
    - The frontend "ContractsABI" folder contains essential files for accessing the smart contracts, which need to be distributed to the dApp folder.
3. dApp:
    - This folder contains the user interface developed using Vite.js.
    - The important subfolders and files are described below:
        - **`\src\components`**: This directory houses all the React components, including the main components that integrate with the blockchain using the ethers.js and web3.js libraries.
        - **`\src\contractsABI`**: This folder contains the necessary files mentioned earlier, such as the ABI and addresses required to access the functions and data of the deployed smart contracts.
        - **`\src\dist`**: This folder is generated during the project build process and is crucial for deploying the system in a production environment.
## **Installation**

Before proceeding with the installation, make sure to configure the Raspberry Pi with Raspbian. Follow the instructions provided on the **[Raspberry Pi Getting Started](https://www.raspberrypi.com/documentation/computers/getting-started.html)** webpage.

To install the required tools, run the following command:

```shell
sudo apt update
sudo apt upgrade
sudo apt install hostapd dnsmasq dhcpd iptables nodejs npm
```

## **Installation and Operation Guide**

To facilitate the installation and use of the WifeeChain system, a detailed guide has been prepared. This guide provides step-by-step instructions on how to install the necessary components, configure the access point, and deploy the smart contracts. It also explains the process of interacting with the system, including wallet integration, token purchase, and secure connections.

### **Deployment of Smart Contracts**

In the context of the WifeeChain system, the deployment of smart contracts plays a crucial role in ensuring the secure and decentralized operation of the network. The following steps describe the process of deploying the smart contracts using the Hardhat framework and ngrok:

1. Clone the repository: Clone the repository using the command **`git clone https://github.com/anx00/WifeeChain`**.
2. Install dependencies: Run the command **`npm install`** to install all the Node dependencies.
3. Start a Hardhat node: Execute the command **`npx hardhat node`** to deploy a local Hardhat node with a default number of accounts and ETH.
4. Expose the node to the public: Use the ngrok tool to expose the Hardhat node with a public address for simulating a distributed network environment.
5. Deploy smart contracts: Deploy the smart contracts by running the command **`npx hardhat -network localhost run deploy.js`**.

### **Configuration of the Wi-Fi Access Point**

Configuring the Wi-Fi access point is a crucial step in using the WifeeChain system. Follow these steps to configure and register a Wi-Fi access point:

1. Configure the files: Modify the configuration files located in the AccessPoint folder to set up the access point with the desired parameters, such as SSID and network interface.
2. Modify firewall rules: Execute the iptables.sh script with the command **`sudo ./iptables.sh`** to modify the firewall rules for correct access point functioning and user redirection to the captive portal.
3. Modify environment variables: Update the .env file with the necessary environment variables, such as the URL where smart contracts are deployed (WEB3_URL) and the private key of the wallet owner (PRIVATE_KEY).
4. Install dependencies: Run **`npm install`** to install the required Node dependencies.
5. Start the server: Execute **`node server.js`** to start the server, which supports authentication tasks.
6. Access point registration: Register the access point by using the register-access-point endpoint.

### **Deploying the Captive Portal**

The captive portal serves as the primary authentication system for users to access the Internet connection. Follow these steps to deploy the captive portal:

1. Clone the repository: Clone the repository using the command **`git clone https://github.com/anx00/WifeeChain`**.
2. Install dependencies: Run **`npm install`** to install the required Node dependencies.
3. Include web3 files: Place the addresses and ABI files of the deployed smart contracts under the src folder.
4. Build the project: Build the project by running **`npm run build`** to generate the dist folder, which will be used for production.
5. Start the captive portal: Copy the generated dist folder to \etcginxsites-available and start the nginx service with the command **`systemctl nginx start`**.