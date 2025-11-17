"""
Hardhat deployment script for IncidentRegistry contract
Run: npx hardhat run scripts/deploy_incident_registry.js --network sepolia
"""

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying IncidentRegistry to Sepolia...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Get relayer address from environment or use deployer
  const relayerAddress = process.env.RELAYER_ADDRESS || deployer.address;
  console.log("🔐 Relayer address:", relayerAddress);

  // Deploy contract
  const IncidentRegistry = await hre.ethers.getContractFactory("IncidentRegistry");
  const contract = await IncidentRegistry.deploy(relayerAddress);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ IncidentRegistry deployed to:", contractAddress);
  console.log("📋 Relayer address set to:", relayerAddress);

  // Verify initial state
  const owner = await contract.owner();
  const relayer = await contract.relayer();
  const incidentCount = await contract.incidentCount();

  console.log("\n📊 Contract State:");
  console.log("   Owner:", owner);
  console.log("   Relayer:", relayer);
  console.log("   Incident Count:", incidentCount.toString());

  console.log("\n📝 Next steps:");
  console.log("1. Copy contract address above");
  console.log("2. Add to backend/.env: INCIDENT_REGISTRY_CONTRACT_ADDRESS=" + contractAddress);
  console.log("3. Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${contractAddress} ${relayerAddress}`);
  console.log("\n4. View on Sepolia Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${contractAddress}`);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: contractAddress,
    relayerAddress: relayerAddress,
    ownerAddress: owner,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
  };

  fs.writeFileSync(
    "deployment_incident_registry.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to: deployment_incident_registry.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
