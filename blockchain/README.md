# AODS Blockchain Integration

This directory contains the complete blockchain integration for the AODS (Advanced Omnichannel Digital System) platform, including smart contracts, Hyperledger Fabric chaincode, and deployment scripts.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Smart Contracts](#smart-contracts)
- [Hyperledger Fabric](#hyperledger-fabric)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Contract Interactions](#contract-interactions)
- [Security Considerations](#security-considerations)

## 🏗️ Architecture Overview

The AODS blockchain layer consists of:

1. **Ethereum/Polygon Smart Contracts** - For public, transparent operations
2. **Hyperledger Fabric** - For private, permissioned enterprise operations
3. **Cross-chain Bridges** - For interoperability between networks

```
┌─────────────────────────────────────────────────────────────┐
│                        AODS Platform                         │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)  │  Backend (Python/FastAPI)           │
├──────────────────────┼──────────────────────────────────────┤
│  Web3 Integration    │  Blockchain Indexer                  │
├──────────────────────┴──────────────────────────────────────┤
│                    Smart Contract Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  AODSToken   │  │   AODSNFT    │  │   AODSICO    │      │
│  │  (ERC20)     │  │  (ERC721)    │  │  (Crowdsale) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │AODSHealthcare│  │ AODSeVoting  │  │ AODSGaming   │      │
│  │              │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ AODSP2P      │  │ AODSSupply   │  │ AODSDigital  │      │
│  │ Lending      │  │ Chain        │  │ Identity     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│                 Hyperledger Fabric Layer                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           AODSContract (Chaincode)                   │   │
│  │  - Asset Management                                  │   │
│  │  - Supply Chain Tracking                             │   │
│  │  - Identity Verification                             │   │
│  │  - Private Transactions                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📜 Smart Contracts

### 1. AODSToken (ERC20)

The native utility token of the AODS ecosystem.

**Features:**
- Mintable with role-based access control
- Burnable tokens
- Pausable transfers
- Staking mechanism with rewards
- Vesting schedules for team and advisors
- Transaction fee mechanism

**Key Functions:**
```solidity
// Staking
function stake(uint256 amount, uint256 duration) external returns (bool);
function unstake(uint256 stakeIndex) external returns (bool);
function claimRewards() external returns (uint256);

// Vesting
function createVestingSchedule(
    address beneficiary,
    uint256 amount,
    uint256 duration,
    uint256 cliff,
    VestingType vestingType
) external onlyRole(ADMIN_ROLE);

// Tokenomics
function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE);
function burn(uint256 amount) external;
```

### 2. AODSNFT (ERC721)

Multi-purpose NFT contract for profiles, gaming assets, and digital identity.

**Features:**
- Mintable NFTs with metadata
- Enumerable tokens
- URI storage for IPFS
- Royalty support (EIP-2981)
- Batch minting
- Marketplace integration

**Token Types:**
- Profile NFTs
- Gaming Assets
- Achievement Badges
- Digital Credentials

### 3. AODSICO (Crowdfunding)

ICO/IEO crowdfunding contract with multiple sale rounds.

**Features:**
- Multiple sale rounds (Seed, Private, Public)
- Whitelist functionality
- KYC integration ready
- Vesting schedules
- Refund mechanism
- Token distribution

**Sale Rounds:**
| Round | Price | Allocation | Vesting | Cliff |
|-------|-------|------------|---------|-------|
| Seed | 0.001 ETH | 1M tokens | 1 year | 90 days |
| Private | 0.002 ETH | 2M tokens | 6 months | 30 days |
| Public | 0.005 ETH | 5M tokens | None | None |

### 4. AODSP2PLending

Decentralized peer-to-peer lending platform.

**Features:**
- Loan creation and funding
- Collateral management
- Credit scoring system
- Interest calculation
- Liquidation mechanism
- Insurance fund

**Loan States:**
- Pending
- Active
- Repaid
- Defaulted
- Liquidated

### 5. AODSSupplyChain

Supply chain tracking and verification system.

**Features:**
- Product registration
- Ownership tracking
- IoT sensor integration
- Certificate management
- Recall system
- Dispute resolution

**Tracking Data:**
- Product origin
- Manufacturing details
- Shipping information
- Quality certifications
- Temperature/humidity logs

### 6. AODSHealthcare

HIPAA-compliant healthcare data management.

**Features:**
- Patient profile management
- Medical record storage
- Prescription management
- Appointment scheduling
- Insurance claims
- Access control

**Privacy:**
- Encrypted data storage (IPFS)
- Granular access control
- Audit trails
- Emergency access
- Consent management

### 7. AODSeVoting

Secure electronic voting system.

**Features:**
- Anonymous voting (ZK proofs)
- Multiple election types
- Real-time results
- Vote delegation
- Audit trails
- Result verification

**Election Types:**
- General
- Presidential
- Parliamentary
- Local
- Referendum
- Organizational

### 8. AODSGaming

Gaming and esports platform.

**Features:**
- Tournament management
- Player profiles
- Team management
- Prize distribution
- Achievement system
- Leaderboards

**Tournament Types:**
- Single Elimination
- Double Elimination
- Round Robin
- Swiss System
- Battle Royale

### 9. AODSDigitalIdentity

Self-sovereign digital identity system.

**Features:**
- DID creation
- Credential issuance
- Selective disclosure
- Service provider integration
- Consent management
- Verification system

**Credential Types:**
- Identity
- Age verification
- Address proof
- Education
- Employment
- Financial
- Health
- Government ID

## 🏭 Hyperledger Fabric

### Chaincode (Go)

The Hyperledger Fabric chaincode provides enterprise-grade private blockchain functionality.

**Features:**
- Asset management
- Supply chain tracking
- Identity verification
- Private data collections
- Rich queries
- Event handling

**Key Functions:**
```go
// Asset Management
func (c *AODSContract) CreateAsset(ctx contractapi.TransactionContextInterface, 
    id string, assetType string, owner string, data string) (*Asset, error)

// Supply Chain
func (c *AODSContract) CreateProduct(ctx contractapi.TransactionContextInterface,
    id string, sku string, name string, description string, manufacturer string) (*Product, error)

func (c *AODSContract) AddIoTData(ctx contractapi.TransactionContextInterface,
    id string, sensorID string, sensorType string, value float64, unit string, metadata string) (*Product, error)

// Identity
func (c *AODSContract) CreateIdentity(ctx contractapi.TransactionContextInterface,
    did string, publicKey string) (*Identity, error)

func (c *AODSContract) AddCredential(ctx contractapi.TransactionContextInterface,
    did string, credType string, issuer string, expiresAt string, data string, signature string) (*Identity, error)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Hardhat
- Go 1.20+ (for Hyperledger)
- Docker (for local network)

### Installation

```bash
# Install dependencies
cd blockchain/hardhat
npm install

# Install Hyperledger dependencies
cd ../hyperledger/chaincode-go
go mod download
```

### Environment Setup

Create `.env` file in `blockchain/hardhat`:

```env
# Network Configuration
PRIVATE_KEY=your_private_key
INFURA_API_KEY=your_infura_key
ALCHEMY_API_KEY=your_alchemy_key
ETHERSCAN_API_KEY=your_etherscan_key
POLYGONSCAN_API_KEY=your_polygonscan_key

# Contract Configuration
TOKEN_NAME="AODS Token"
TOKEN_SYMBOL="AODS"
INITIAL_SUPPLY=1000000000

# ICO Configuration
SEED_PRICE=0.001
PRIVATE_PRICE=0.002
PUBLIC_PRICE=0.005
```

## 📦 Deployment

### Local Deployment

```bash
# Start local Hardhat network
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Setup ICO
npx hardhat run scripts/setup-ico.js --network localhost
```

### Testnet Deployment (Sepolia)

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### Mainnet Deployment

```bash
# Deploy to Ethereum Mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Deploy to Polygon
npx hardhat run scripts/deploy.js --network polygon
```

## 🔗 Contract Interactions

### Using Hardhat Console

```bash
npx hardhat console --network localhost

# Load contracts
const AODSToken = await ethers.getContractFactory("AODSToken");
const token = await AODSToken.attach("<TOKEN_ADDRESS>");

# Check balance
await token.balanceOf("<ADDRESS>");

# Stake tokens
await token.stake(ethers.parseEther("1000"), 2592000); // 30 days
```

### Using Web3.js/ethers.js

```javascript
import { ethers } from 'ethers';
import AODSTokenABI from './abis/AODSToken.json';

const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY');
const signer = new ethers.Wallet('PRIVATE_KEY', provider);

const token = new ethers.Contract('TOKEN_ADDRESS', AODSTokenABI, signer);

// Stake tokens
const tx = await token.stake(
  ethers.parseEther('1000'),
  30 * 24 * 60 * 60 // 30 days
);
await tx.wait();
```

## 🔒 Security Considerations

### Access Control

All contracts use OpenZeppelin's AccessControl for role-based permissions:

- `DEFAULT_ADMIN_ROLE` - Contract administration
- `MINTER_ROLE` - Token minting
- `PAUSER_ROLE` - Emergency pause
- `UPGRADER_ROLE` - Contract upgrades

### Upgradeability

Contracts use the UUPS proxy pattern for upgradeability:

```solidity
function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
```

### Emergency Functions

- `pause()` - Pause all transfers
- `unpause()` - Resume transfers
- `emergencyWithdraw()` - Withdraw stuck tokens

### Audit Checklist

- [ ] Reentrancy protection
- [ ] Integer overflow/underflow
- [ ] Access control validation
- [ ] Input validation
- [ ] Event emission
- [ ] Gas optimization
- [ ] Front-running protection

## 📊 Tokenomics

### AODS Token Distribution

| Allocation | Percentage | Amount | Vesting |
|------------|------------|--------|---------|
| Public Sale | 30% | 30M | None |
| Private Sale | 20% | 20M | 6 months |
| Seed | 10% | 10M | 1 year |
| Team | 15% | 15M | 2 years |
| Advisors | 5% | 5M | 1 year |
| Ecosystem | 10% | 10M | 3 years |
| Reserve | 10% | 10M | 4 years |

### Total Supply: 100,000,000 AODS

## 📚 Additional Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [Hyperledger Fabric](https://hyperledger-fabric.readthedocs.io/)
- [EIP-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20)
- [EIP-721 NFT Standard](https://eips.ethereum.org/EIPS/eip-721)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.
