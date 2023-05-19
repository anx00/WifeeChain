const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log('Deploying contracts with the account:', deployer.address);

  const WiFeeRegistry = await ethers.getContractFactory('WiFeeRegistry');
  const wiFeeRegistry = await WiFeeRegistry.deploy();
  await wiFeeRegistry.deployed();
  console.log('WiFeeRegistry deployed at:', wiFeeRegistry.address);

  const InternetToken = await ethers.getContractFactory('InternetToken');
  const internetToken = await InternetToken.deploy(1000000);
  await internetToken.deployed();
  console.log('InternetToken deployed at:', internetToken.address);

  const WiFeeAccess = await ethers.getContractFactory('WiFeeAccess');
  const wiFeeAccess = await WiFeeAccess.deploy(wiFeeRegistry.address, internetToken.address);
  await wiFeeAccess.deployed();
  console.log('WiFeeAccess deployed at:', wiFeeAccess.address);

  saveFrontendFiles(wiFeeRegistry, 'WiFeeRegistry');
  saveFrontendFiles(internetToken, 'InternetToken');
  saveFrontendFiles(wiFeeAccess, 'WiFeeAccess');
}

function saveFrontendFiles(contract, name) {
  const contractsDir = path.join(__dirname, '..', 'frontend', 'contractsABI');

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, `${name}-address.json`),
    JSON.stringify({ address: contract.address }, undefined, 2)
  );

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(
    path.join(contractsDir, `${name}.json`),
    JSON.stringify(contractArtifact, null, 2)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
