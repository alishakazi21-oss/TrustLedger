import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TrustLedger ERC-4337 Account Abstraction & Real Estate Stack", function () {
  let deployer: SignerWithAddress;
  let sponsor: SignerWithAddress;
  let relayer: SignerWithAddress;
  let userEOA: SignerWithAddress;
  let buyerEOA: SignerWithAddress;
  let sellerEOA: SignerWithAddress;

  let entryPoint: any;
  let accountFactory: any;
  let paymaster: any;
  let propertyRegistry: any;
  let escrow: any;

  beforeEach(async function () {
    [deployer, sponsor, relayer, userEOA, buyerEOA, sellerEOA] = await ethers.getSigners();

    // 1. Deploy EntryPoint
    const EntryPointFactory = await ethers.getContractFactory("EntryPoint");
    entryPoint = await EntryPointFactory.deploy();
    await entryPoint.waitForDeployment();

    // 2. Deploy AccountFactory
    const AccountFactoryFactory = await ethers.getContractFactory("AccountFactory");
    accountFactory = await AccountFactoryFactory.deploy(await entryPoint.getAddress());
    await accountFactory.waitForDeployment();

    // 3. Deploy TrustLedgerPaymaster
    const PaymasterFactory = await ethers.getContractFactory("TrustLedgerPaymaster");
    paymaster = await PaymasterFactory.deploy(await entryPoint.getAddress(), deployer.address);
    await paymaster.waitForDeployment();

    // Fund Paymaster's deposit in EntryPoint with 10 ETH
    await sponsor.sendTransaction({
      to: await paymaster.getAddress(),
      value: ethers.parseEther("10.0"),
    });

    // 4. Deploy PropertyRegistry
    const PropertyRegistryFactory = await ethers.getContractFactory("PropertyRegistry");
    propertyRegistry = await PropertyRegistryFactory.deploy();
    await propertyRegistry.waitForDeployment();

    // 5. Deploy Escrow
    const EscrowFactory = await ethers.getContractFactory("Escrow");
    escrow = await EscrowFactory.deploy(await propertyRegistry.getAddress());
    await escrow.waitForDeployment();

    await propertyRegistry.setEscrowAuthorization(await escrow.getAddress(), true);
  });

  it("1. Should compute counterfactual deterministic address and deploy SmartAccount", async function () {
    const salt = 12345;
    const predictedAddress = await accountFactory.getAddress(userEOA.address, salt);

    // Code size at predicted address should initially be 0
    const codeBefore = await ethers.provider.getCode(predictedAddress);
    expect(codeBefore).to.equal("0x");

    // Deploy account
    await accountFactory.createAccount(userEOA.address, salt);

    const codeAfter = await ethers.provider.getCode(predictedAddress);
    expect(codeAfter).to.not.equal("0x");

    const smartAccount = await ethers.getContractAt("SmartAccount", predictedAddress);
    expect(await smartAccount.owner()).to.equal(userEOA.address);
  });

  it("2. Should execute a gas-sponsored UserOperation where user balance is unchanged and paymaster deposit decreases", async function () {
    const salt = 999;
    const smartAccountAddress = await accountFactory.getAddress(userEOA.address, salt);

    // Whitelist user smart account in paymaster
    await paymaster.setWhitelist(smartAccountAddress, true);

    // Register property
    const propId = "TL-PROP-9821";
    const parcelId = "GLR-GB-9821";
    const deedHash = ethers.keccak256(ethers.toUtf8Bytes("Deed-Initial-v1"));
    await propertyRegistry.registerProperty(propId, parcelId, deedHash, smartAccountAddress);

    // Prepare UserOperation to call updateDeedHash
    const newDeedHash = ethers.keccak256(ethers.toUtf8Bytes("Deed-Amended-v2"));
    const updateCallData = propertyRegistry.interface.encodeFunctionData("updateDeedHash", [
      propId,
      newDeedHash,
    ]);

    const SmartAccountInterface = (await ethers.getContractFactory("SmartAccount")).interface;
    const executeCallData = SmartAccountInterface.encodeFunctionData("execute", [
      await propertyRegistry.getAddress(),
      0,
      updateCallData,
    ]);

    // InitCode to deploy account if not yet deployed
    const factoryInterface = accountFactory.interface;
    const initCode = ethers.concat([
      await accountFactory.getAddress(),
      factoryInterface.encodeFunctionData("createAccount", [userEOA.address, salt]),
    ]);

    const paymasterAddress = await paymaster.getAddress();

    const userOp = {
      sender: smartAccountAddress,
      nonce: 0,
      initCode: initCode,
      callData: executeCallData,
      callGasLimit: 200000,
      verificationGasLimit: 300000,
      preVerificationGas: 50000,
      maxFeePerGas: ethers.parseUnits("10", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
      paymasterAndData: paymasterAddress,
      signature: "0x",
    };

    // Calculate UserOp hash and sign with user EOA
    const userOpHash = await entryPoint.getUserOpHash(userOp);
    const signature = await userEOA.signMessage(ethers.getBytes(userOpHash));
    userOp.signature = signature;

    // Record balances before execution
    const userEoaBalanceBefore = await ethers.provider.getBalance(userEOA.address);
    const paymasterDepositBefore = await entryPoint.balanceOf(paymasterAddress);

    // Relayer submits the UserOp
    const handleOpsTx = await entryPoint.connect(relayer).handleOps([userOp], relayer.address);
    await handleOpsTx.wait();

    // Verify 1: Property deed hash was updated on-chain
    const propRecord = await propertyRegistry.getProperty(propId);
    expect(propRecord.deedHash).to.equal(newDeedHash);
    expect(propRecord.versionNumber).to.equal(2);

    // Verify 2: User EOA balance is 100% UNCHANGED (Zero gas paid by user)
    const userEoaBalanceAfter = await ethers.provider.getBalance(userEOA.address);
    expect(userEoaBalanceAfter).to.equal(userEoaBalanceBefore);

    // Verify 3: Paymaster deposit inside EntryPoint DECREASED to cover gas
    const paymasterDepositAfter = await entryPoint.balanceOf(paymasterAddress);
    expect(paymasterDepositAfter).to.be.lessThan(paymasterDepositBefore);

    // Verify 4: Paymaster telemetry recorded sponsored gas
    const totalSponsored = await paymaster.totalGasSponsored();
    expect(totalSponsored).to.be.greaterThan(0);
    expect(await paymaster.totalOperationsSponsored()).to.equal(1);
  });

  it("3. Should complete full Escrow lifecycle: Create -> Fund -> Verification Release -> Title Transfer", async function () {
    const propId = "TL-PROP-1001";
    const parcelId = "KENSINGTON-1001";
    const deedHashV1 = ethers.keccak256(ethers.toUtf8Bytes("Deed-V1"));
    const deedHashV2 = ethers.keccak256(ethers.toUtf8Bytes("Deed-V2-Transferred"));

    // Register property to seller
    await propertyRegistry.registerProperty(propId, parcelId, deedHashV1, sellerEOA.address);

    const dealId = ethers.keccak256(ethers.toUtf8Bytes("DEAL-2026-001"));
    const dealAmount = ethers.parseEther("2.5");

    // 1. Create Escrow Deal
    await escrow.createDeal(dealId, propId, buyerEOA.address, sellerEOA.address, dealAmount, deedHashV2);

    // 2. Buyer deposits funds
    await escrow.connect(buyerEOA).depositFunds(dealId, { value: dealAmount });

    const sellerBalanceBefore = await ethers.provider.getBalance(sellerEOA.address);

    // 3. Backend verification signal approves deal
    await escrow.connect(deployer).approveAndRelease(dealId);

    // Verify funds received by seller
    const sellerBalanceAfter = await ethers.provider.getBalance(sellerEOA.address);
    expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(dealAmount);

    // Verify property transferred to buyer
    const updatedProp = await propertyRegistry.getProperty(propId);
    expect(updatedProp.currentOwner).to.equal(buyerEOA.address);
    expect(updatedProp.deedHash).to.equal(deedHashV2);
    expect(updatedProp.versionNumber).to.equal(2);
  });
});
