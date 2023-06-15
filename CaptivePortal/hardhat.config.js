require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  defaultNetwork: "hardhat",
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    cache: "./cache"
  },
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545", // Asegúrate de usar la URL de tu RPC Server de Ganache
      //chainId: 1337,
    },
    hardhat: {
      accounts: {
        count: 10,
        initialBalance: "100000000000000000000", // this sets the initial balance to 100 Teth
      },
    }
  },
};
