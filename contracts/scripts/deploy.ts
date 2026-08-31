import { ethers } from "hardhat";

async function main() {
  const [deployer, sponsorWallet] = await ethers.getSigners();

  console.log("=================================================");
  console.log("Deploying TrustLedger Smart Contract Stack...");
  console.log("Deployer Address:", deployer.address);
  console.log("Sponsor Wallet:", sponsorWallet.address);
  console.log("=================================================");

  // 1. Deploy EntryPoint (from @account-abstraction/contracts)
  const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
  const entryPoint = await EntryPointFactory.deploy();
  await entryPoint.waitForDeployment();
  const entryPointAddress = await entryPoint.getAddress();
  console.log("1. EntryPoint deployed at:", entryPointAddress);

  // 2. Deploy AccountFactory
  const AccountFactoryFactory = await ethers.getContractFactory("AccountFactory");
  const accountFactory = await AccountFactoryFactory.deploy(entryPointAddress);
  await accountFactory.waitForDeployment();
  const accountFactoryAddress = await accountFactory.getAddress();
  console.log("2. AccountFactory deployed at:", accountFactoryAddress);

  // 3. Deploy TrustLedgerPaymaster
  const PaymasterFactory = await ethers.getContractFactory("TrustLedgerPaymaster");
  const paymaster = await PaymasterFactory.deploy(entryPointAddress, deployer.address);
  await paymaster.waitForDeployment();
  const paymasterAddress = await paymaster.getAddress();
  console.log("3. TrustLedgerPaymaster deployed at:", paymasterAddress);

  // Fund Paymaster's deposit in EntryPoint with 10 ETH from sponsor wallet
  const depositTx = await sponsorWallet.sendTransaction({
    to: paymasterAddress,
    value: ethers.parseEther("10.0"),
  });
  await depositTx.wait();
  console.log("   -> Funded Paymaster with 10 ETH in EntryPoint deposit");

  // Whitelist deployer for initial setup
  await paymaster.setWhitelist(deployer.address, true);

  // 4. Deploy PropertyRegistry
  const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
  const propertyRegistry = await PropertyRegistryFactory.deploy();
  await propertyRegistry.waitForDeployment();
  const propertyRegistryAddress = await propertyRegistry.getAddress();
  console.log("4. PropertyRegistry deployed at:", propertyRegistryAddress);

  // 5. Deploy Escrow
  const EscrowFactory = await ethers.getContractFactory("Escrow");
  const escrow = await EscrowFactory.deploy(propertyRegistryAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("5. Escrow deployed at:", escrowAddress);

  // Authorize Escrow contract in PropertyRegistry
  await propertyRegistry.setEscrowAuthorization(escrowAddress, true);
  console.log("   -> Authorized Escrow in PropertyRegistry");

  console.log("=================================================");
  console.log("TrustLedger Deployment Complete!");
  console.log("=================================================");

  // Output JSON config for backend consumption
  const configOutput = {
    network: "hardhat-local",
    chainId: 31337,
    entryPoint: entryPointAddress,
    accountFactory: accountFactoryAddress,
    paymaster: paymasterAddress,
    propertyRegistry: propertyRegistryAddress,
    escrow: escrowAddress,
  };

  console.log("Contract Addresses JSON:\n", JSON.stringify(configOutput, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
