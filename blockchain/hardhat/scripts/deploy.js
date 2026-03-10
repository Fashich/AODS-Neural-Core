const { ethers, upgrades } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  // ==================== Deploy AODS Token ====================
  console.log("\n=== Deploying AODS Token ===");
  const AODSToken = await ethers.getContractFactory("AODSToken");
  const aodsToken = await upgrades.deployProxy(AODSToken, [], {
    initializer: "initialize",
  });
  await aodsToken.waitForDeployment();
  const aodsTokenAddress = await aodsToken.getAddress();
  console.log("AODSToken deployed to:", aodsTokenAddress);
  deploymentInfo.contracts.AODSToken = {
    address: aodsTokenAddress,
    proxy: true,
  };

  // ==================== Deploy AODS NFT ====================
  console.log("\n=== Deploying AODS NFT ===");
  const AODSNFT = await ethers.getContractFactory("AODSNFT");
  const aodsNFT = await upgrades.deployProxy(AODSNFT, [], {
    initializer: "initialize",
  });
  await aodsNFT.waitForDeployment();
  const aodsNFTAddress = await aodsNFT.getAddress();
  console.log("AODSNFT deployed to:", aodsNFTAddress);
  deploymentInfo.contracts.AODSNFT = {
    address: aodsNFTAddress,
    proxy: true,
  };

  // ==================== Deploy AODS ICO ====================
  console.log("\n=== Deploying AODS ICO ===");
  const AODSICO = await ethers.getContractFactory("AODSICO");
  const aodsICO = await upgrades.deployProxy(
    AODSICO,
    [aodsTokenAddress, deployer.address],
    {
      initializer: "initialize",
    }
  );
  await aodsICO.waitForDeployment();
  const aodsICOAddress = await aodsICO.getAddress();
  console.log("AODSICO deployed to:", aodsICOAddress);
  deploymentInfo.contracts.AODSICO = {
    address: aodsICOAddress,
    proxy: true,
  };

  // ==================== Deploy AODS P2P Lending ====================
  console.log("\n=== Deploying AODS P2P Lending ===");
  const AODSP2PLending = await ethers.getContractFactory("AODSP2PLending");
  const aodsP2PLending = await upgrades.deployProxy(
    AODSP2PLending,
    [aodsTokenAddress],
    {
      initializer: "initialize",
    }
  );
  await aodsP2PLending.waitForDeployment();
  const aodsP2PLendingAddress = await aodsP2PLending.getAddress();
  console.log("AODSP2PLending deployed to:", aodsP2PLendingAddress);
  deploymentInfo.contracts.AODSP2PLending = {
    address: aodsP2PLendingAddress,
    proxy: true,
  };

  // ==================== Deploy AODS Supply Chain ====================
  console.log("\n=== Deploying AODS Supply Chain ===");
  const AODSSupplyChain = await ethers.getContractFactory("AODSSupplyChain");
  const aodsSupplyChain = await upgrades.deployProxy(AODSSupplyChain, [], {
    initializer: "initialize",
  });
  await aodsSupplyChain.waitForDeployment();
  const aodsSupplyChainAddress = await aodsSupplyChain.getAddress();
  console.log("AODSSupplyChain deployed to:", aodsSupplyChainAddress);
  deploymentInfo.contracts.AODSSupplyChain = {
    address: aodsSupplyChainAddress,
    proxy: true,
  };

  // ==================== Deploy AODS Healthcare ====================
  console.log("\n=== Deploying AODS Healthcare ===");
  const AODSHealthcare = await ethers.getContractFactory("AODSHealthcare");
  const aodsHealthcare = await upgrades.deployProxy(AODSHealthcare, [], {
    initializer: "initialize",
  });
  await aodsHealthcare.waitForDeployment();
  const aodsHealthcareAddress = await aodsHealthcare.getAddress();
  console.log("AODSHealthcare deployed to:", aodsHealthcareAddress);
  deploymentInfo.contracts.AODSHealthcare = {
    address: aodsHealthcareAddress,
    proxy: true,
  };

  // ==================== Deploy AODS e-Voting ====================
  console.log("\n=== Deploying AODS e-Voting ===");
  const AODSeVoting = await ethers.getContractFactory("AODSeVoting");
  const aodsEVoting = await upgrades.deployProxy(AODSeVoting, [], {
    initializer: "initialize",
  });
  await aodsEVoting.waitForDeployment();
  const aodsEVotingAddress = await aodsEVoting.getAddress();
  console.log("AODSeVoting deployed to:", aodsEVotingAddress);
  deploymentInfo.contracts.AODSeVoting = {
    address: aodsEVotingAddress,
    proxy: true,
  };

  // ==================== Deploy AODS Gaming ====================
  console.log("\n=== Deploying AODS Gaming ===");
  const AODSGaming = await ethers.getContractFactory("AODSGaming");
  const aodsGaming = await upgrades.deployProxy(
    AODSGaming,
    [aodsTokenAddress, aodsNFTAddress],
    {
      initializer: "initialize",
    }
  );
  await aodsGaming.waitForDeployment();
  const aodsGamingAddress = await aodsGaming.getAddress();
  console.log("AODSGaming deployed to:", aodsGamingAddress);
  deploymentInfo.contracts.AODSGaming = {
    address: aodsGamingAddress,
    proxy: true,
  };

  // ==================== Deploy AODS Digital Identity ====================
  console.log("\n=== Deploying AODS Digital Identity ===");
  const AODSDigitalIdentity = await ethers.getContractFactory("AODSDigitalIdentity");
  const aodsDigitalIdentity = await upgrades.deployProxy(AODSDigitalIdentity, [], {
    initializer: "initialize",
  });
  await aodsDigitalIdentity.waitForDeployment();
  const aodsDigitalIdentityAddress = await aodsDigitalIdentity.getAddress();
  console.log("AODSDigitalIdentity deployed to:", aodsDigitalIdentityAddress);
  deploymentInfo.contracts.AODSDigitalIdentity = {
    address: aodsDigitalIdentityAddress,
    proxy: true,
  };

  // ==================== Setup Roles and Permissions ====================
  console.log("\n=== Setting up roles and permissions ===");

  // Grant minter role to ICO contract
  const MINTER_ROLE = await aodsToken.MINTER_ROLE();
  await (await aodsToken.grantRole(MINTER_ROLE, aodsICOAddress)).wait();
  console.log("Granted MINTER_ROLE to ICO contract");

  // Grant minter role to Gaming contract
  await (await aodsToken.grantRole(MINTER_ROLE, aodsGamingAddress)).wait();
  console.log("Granted MINTER_ROLE to Gaming contract");

  // Grant minter role to P2P Lending contract
  await (await aodsToken.grantRole(MINTER_ROLE, aodsP2PLendingAddress)).wait();
  console.log("Granted MINTER_ROLE to P2P Lending contract");

  // Setup Healthcare roles
  const ADMIN_ROLE = await aodsHealthcare.ADMIN_ROLE();
  await (await aodsHealthcare.grantRole(ADMIN_ROLE, deployer.address)).wait();
  console.log("Granted ADMIN_ROLE to deployer for Healthcare");

  // Setup e-Voting roles
  const ELECTION_OFFICIAL_ROLE = await aodsEVoting.ELECTION_OFFICIAL_ROLE();
  await (await aodsEVoting.grantRole(ELECTION_OFFICIAL_ROLE, deployer.address)).wait();
  console.log("Granted ELECTION_OFFICIAL_ROLE to deployer for e-Voting");

  // Setup Gaming roles
  const TOURNAMENT_ORGANIZER_ROLE = await aodsGaming.TOURNAMENT_ORGANIZER_ROLE();
  await (await aodsGaming.grantRole(TOURNAMENT_ORGANIZER_ROLE, deployer.address)).wait();
  console.log("Granted TOURNAMENT_ORGANIZER_ROLE to deployer for Gaming");

  // Setup Digital Identity roles
  const ISSUER_ROLE = await aodsDigitalIdentity.ISSUER_ROLE();
  await (await aodsDigitalIdentity.grantRole(ISSUER_ROLE, deployer.address)).wait();
  console.log("Granted ISSUER_ROLE to deployer for Digital Identity");

  // ==================== Save Deployment Info ====================
  const deploymentPath = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }

  const filename = `${network.name}-${new Date().toISOString().split("T")[0]}.json`;
  fs.writeFileSync(
    path.join(deploymentPath, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Also save as latest.json
  fs.writeFileSync(
    path.join(deploymentPath, "latest.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n=== Deployment Summary ===");
  console.log("Network:", network.name);
  console.log("Deployer:", deployer.address);
  console.log("\nContract Addresses:");
  Object.entries(deploymentInfo.contracts).forEach(([name, info]) => {
    console.log(`  ${name}: ${info.address}`);
  });
  console.log("\nDeployment info saved to:", path.join(deploymentPath, filename));

  // ==================== Verify Contracts (if not localhost) ====================
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n=== Waiting for block confirmations before verification ===");
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 1 minute

    console.log("\n=== Verifying contracts ===");
    try {
      await hre.run("verify:verify", {
        address: aodsTokenAddress,
        constructorArguments: [],
      });
      console.log("AODSToken verified");
    } catch (error) {
      console.log("AODSToken verification failed:", error.message);
    }

    // Add more verifications as needed
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
