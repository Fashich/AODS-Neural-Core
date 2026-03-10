const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up ICO with account:", deployer.address);

  // Load deployment info
  const deploymentPath = path.join(__dirname, "..", "deployments", "latest.json");
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const aodsToken = await ethers.getContractAt("AODSToken", deploymentInfo.contracts.AODSToken.address);
  const aodsICO = await ethers.getContractAt("AODSICO", deploymentInfo.contracts.AODSICO.address);

  // ==================== Setup ICO Rounds ====================
  console.log("\n=== Setting up ICO Rounds ===");

  const currentTime = Math.floor(Date.now() / 1000);
  const ONE_DAY = 86400;
  const ONE_WEEK = 7 * ONE_DAY;

  // Seed Round
  await (await aodsICO.createRound(
    0, // Seed
    ethers.parseEther("0.001"), // 0.001 ETH per token
    ethers.parseEther("1000000"), // 1M tokens
    currentTime + ONE_DAY, // Starts in 1 day
    currentTime + ONE_WEEK, // Ends in 1 week
    ethers.parseEther("0.1"), // Min purchase 0.1 ETH
    ethers.parseEther("5"), // Max purchase 5 ETH
    365 * ONE_DAY, // 1 year vesting
    90 * ONE_DAY, // 90 day cliff
    true // Whitelist required
  )).wait();
  console.log("Seed round created");

  // Private Sale
  await (await aodsICO.createRound(
    1, // Private
    ethers.parseEther("0.002"), // 0.002 ETH per token
    ethers.parseEther("2000000"), // 2M tokens
    currentTime + ONE_WEEK, // Starts in 1 week
    currentTime + 2 * ONE_WEEK, // Ends in 2 weeks
    ethers.parseEther("0.5"), // Min purchase 0.5 ETH
    ethers.parseEther("20"), // Max purchase 20 ETH
    180 * ONE_DAY, // 6 month vesting
    30 * ONE_DAY, // 30 day cliff
    true // Whitelist required
  )).wait();
  console.log("Private sale round created");

  // Public Sale
  await (await aodsICO.createRound(
    2, // Public
    ethers.parseEther("0.005"), // 0.005 ETH per token
    ethers.parseEther("5000000"), // 5M tokens
    currentTime + 2 * ONE_WEEK, // Starts in 2 weeks
    currentTime + 4 * ONE_WEEK, // Ends in 4 weeks
    ethers.parseEther("0.01"), // Min purchase 0.01 ETH
    ethers.parseEther("50"), // Max purchase 50 ETH
    0, // No vesting
    0, // No cliff
    false // No whitelist
  )).wait();
  console.log("Public sale round created");

  // ==================== Add Whitelist Addresses ====================
  console.log("\n=== Adding whitelist addresses ===");

  const whitelistAddresses = [
    "0x1234567890123456789012345678901234567890",
    "0x2345678901234567890123456789012345678901",
    "0x3456789012345678901234567890123456789012",
  ];

  await (await aodsICO.addToWhitelist(0, whitelistAddresses)).wait();
  console.log("Added addresses to seed round whitelist");

  await (await aodsICO.addToWhitelist(1, whitelistAddresses)).wait();
  console.log("Added addresses to private sale whitelist");

  // ==================== Setup Vesting for Team and Advisors ====================
  console.log("\n=== Setting up vesting schedules ===");

  // Team vesting (2 year vesting, 6 month cliff)
  await (await aodsICO.createVestingSchedule(
    deployer.address,
    ethers.parseEther("10000000"), // 10M tokens
    730 * ONE_DAY, // 2 years
    180 * ONE_DAY, // 6 month cliff
    30 * ONE_DAY, // Monthly releases
    0 // Team allocation
  )).wait();
  console.log("Team vesting schedule created");

  // Advisor vesting (1 year vesting, 3 month cliff)
  await (await aodsICO.createVestingSchedule(
    "0x9876543210987654321098765432109876543210",
    ethers.parseEther("2000000"), // 2M tokens
    365 * ONE_DAY, // 1 year
    90 * ONE_DAY, // 3 month cliff
    30 * ONE_DAY, // Monthly releases
    1 // Advisor allocation
  )).wait();
  console.log("Advisor vesting schedule created");

  console.log("\n=== ICO Setup Complete ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
