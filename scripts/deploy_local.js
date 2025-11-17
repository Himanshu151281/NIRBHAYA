const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying IncidentRegistry to Ganache local blockchain...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  const IncidentRegistry = await hre.ethers.getContractFactory("IncidentRegistry");
  const incidentRegistry = await IncidentRegistry.deploy();
  
  await incidentRegistry.waitForDeployment();
  const contractAddress = await incidentRegistry.getAddress();

  console.log("✅ IncidentRegistry deployed to:", contractAddress);
  console.log("🔗 Network: Ganache (localhost:7545)\n");

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    contractAddress: contractAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber()
  };

  const deploymentPath = path.join(__dirname, "..", "deployed-contracts-local.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to:", deploymentPath);

  // Update .env file
  const envPath = path.join(__dirname, "..", "backend", ".env");
  let envContent = fs.readFileSync(envPath, "utf8");
  
  if (envContent.includes("INCIDENT_REGISTRY_CONTRACT_ADDRESS=")) {
    envContent = envContent.replace(
      /INCIDENT_REGISTRY_CONTRACT_ADDRESS=.*/,
      `INCIDENT_REGISTRY_CONTRACT_ADDRESS=${contractAddress}`
    );
  } else {
    envContent += `\nINCIDENT_REGISTRY_CONTRACT_ADDRESS=${contractAddress}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated backend/.env with contract address\n");

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🎉 DEPLOYMENT SUCCESSFUL!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📋 Next Steps:");
  console.log("1. Start backend: cd backend && uvicorn main:app --reload --port 8000");
  console.log("2. Test health: curl http://localhost:8000/api/incidents/health/check");
  console.log("3. Start frontend: cd self/app && npm run dev");
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
