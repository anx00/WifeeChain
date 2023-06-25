const Web3 = require('web3');
const axios = require('axios');
const OracleContract = require('./build/contracts/Oracle.json');
const HDWalletProvider = require('@truffle/hdwallet-provider');

// Configuración de Web3
const provider = new HDWalletProvider({
  mnemonic: {
    phrase: 'tu frase mnemónica aquí' // Asegúrate de no comprometer esta frase en la producción
  },
  providerOrUrl: 'URL de tu red Ethereum' // Podría ser un nodo local o Infura
});

const web3 = new Web3(provider);

// Dirección y ABI del contrato del Oráculo
const oracleAddress = 'Dirección del contrato del oráculo';
const oracleAbi = OracleContract.abi;

// Crear una instancia de contrato para interactuar con el oráculo
const oracleInstance = new web3.eth.Contract(oracleAbi, oracleAddress);

// Escuchar el evento 'DataRequested'
oracleInstance.events.DataRequested()
.on('data', async (event) => {
  // Cuando recibamos el evento, realizamos una llamada a la API
  try {
    const apiResponse = await axios.get('http://localhost:5000/generateRandomString');
    const randomString = apiResponse.data;
  
    // Luego llamamos a fulfillDataRequest para almacenar el resultado en el contrato
    // Necesitamos una cuenta para hacer esto, y debe tener ETH para pagar por gas
    const accounts = await web3.eth.getAccounts();
    const receipt = await oracleInstance.methods.fulfillDataRequest(event.returnValues.requestId, randomString)
      .send({ from: accounts[0] });

    console.log(`Request ${event.returnValues.requestId} was fulfilled with data: ${randomString}`);
  } catch (error) {
    console.error(`Error fulfilling request ${event.returnValues.requestId}: ${error}`);
  }
})
.on('error', console.error); // Registramos cualquier error
