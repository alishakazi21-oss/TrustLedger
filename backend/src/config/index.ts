import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/trustledger',
  jwt: {
    secret: process.env.JWT_SECRET || 'trustledger-super-secret-dev-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  blockchain: {
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545',
    chainId: parseInt(process.env.CHAIN_ID || '31337', 10),
    relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY || '',
    sponsorPrivateKey: process.env.SPONSOR_PRIVATE_KEY || '',
  },
  contracts: {
    entryPoint: process.env.CONTRACT_ENTRY_POINT || '',
    accountFactory: process.env.CONTRACT_ACCOUNT_FACTORY || '',
    paymaster: process.env.CONTRACT_PAYMASTER || '',
    propertyRegistry: process.env.CONTRACT_PROPERTY_REGISTRY || '',
    escrow: process.env.CONTRACT_ESCROW || '',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10),
  },
};
