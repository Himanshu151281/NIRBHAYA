// Deploy IncidentRegistry contract to LOCAL Ganache blockchain
// Usage: npx hardhat run scripts/deploy_local.js --network localhost

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n🚀 Deploying to LOCAL Ganache blockchain...\n");

  // Get deployer account (Ganache provides 10 accounts with 100 ETH each)
  const [deployer, relayer] = await hre.ethers.getSigners();

  console.log("📝 Deployment Details:");
  console.log("   Deployer address:", deployer.address);
  console.log("   Deployer balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH");
  console.log("   Relayer address:", relayer.address);
  console.log("   Network:", hre.network.name);
  console.log("   Chain ID:", (await hre.ethers.provider.getNetwork()).chainId.toString());

  // Deploy IncidentRegistry
  console.log("\n📦 Deploying IncidentRegistry contract...");
  const IncidentRegistry = await hre.ethers.getContractFactory("IncidentRegistry");
  const incidentRegistry = await IncidentRegistry.deploy(relayer.address);

  await incidentRegistry.waitForDeployment();
  const contractAddress = await incidentRegistry.getAddress();

  console.log("✅ IncidentRegistry deployed to:", contractAddress);

  // Get contract state
  const currentRelayer = await incidentRegistry.relayer();
  const incidentCount = await incidentRegistry.incidentCount();

  console.log("\n📊 Contract State:");
  console.log("   Relayer address:", currentRelayer);
  console.log("   Incident count:", incidentCount.toString());

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    chainId: 1337,
    contractAddress: contractAddress,
    deployer: deployer.address,
    relayer: relayer.address,
    relayerPrivateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // Ganache account #1
    deployedAt: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  const deploymentPath = path.join(__dirname, "../deployed-contracts-local.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n💾 Deployment info saved to:", deploymentPath);

  // Generate .env configuration
  console.log("\n" + "=".repeat(70));
  console.log("📋 COPY THIS TO YOUR backend/.env FILE:");
  console.log("=".repeat(70));
  console.log(`
# Local Ganache Configuration (Development)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
RELAYER_PRIVATE_KEY=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
INCIDENT_REGISTRY_CONTRACT_ADDRESS=${contractAddress}
  `.trim());
  console.log("=".repeat(70));

  console.log("\n✨ Deployment complete!");
  console.log("\n📝 Next Steps:");
  console.log("   1. Copy the .env configuration above to backend/.env");
  console.log("   2. Make sure Ganache is running on http://127.0.0.1:8545");
  console.log("   3. Start backend: cd backend && uvicorn main:app --reload --port 8000");
  console.log("   4. Test endpoints: python test_ipfs_endpoints.py");
  console.log("\n🎉 You now have UNLIMITED local transactions!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
