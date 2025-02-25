
# Multichain Launchpad

A decentralized fundraising platform that operates across multiple blockchains, supporting Ethereum (via Polygon Amoy testnet) and Solana (via Devnet). This platform enables project creators to raise funds and investors to back promising projects in a secure, transparent environment.

## 🚀 Features

- **Cross-Chain Compatibility**: Launch projects on both EVM-compatible chains (Polygon) and Solana
- **Wallet Integration**: Seamless connection with MetaMask (Ethereum/Polygon) and Phantom (Solana)
- **Complete Fundraising Lifecycle**:
  - Project creation with customizable goals and timeframes
  - Transparent contribution tracking
  - Automatic fund distribution when goals are met
  - Refund mechanism when projects don't reach their targets
- **Real-time Project Metrics**: Track funding progress, time remaining, and more

## 📋 Prerequisites

- Node.js (v16 or newer)
- MetaMask extension for EVM chain interactions
- Phantom wallet for Solana interactions
- Test tokens for Polygon Amoy testnet and Solana Devnet
- WSL Ubuntu for Solana development (Windows users)
- Anchor framework for Solana program development

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/multichain-launchpad.git
   cd multichain-launchpad
   ```

2. Install dependencies:

```bash
npm install     
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Then edit the .env file with your configuration details.

``` bash 
PRIVATE_KEY = ""
RPC_URL = ""
Amoy_API_Key = ""
DEPLOYED_CONTRACT_ADDRESS = ""
```

4. Start the development server:

```bash
npm start
```

## 💻 Smart Contracts
### Ethereum/Polygon Contract
The Ethereum contract (Launchpad.sol) implements the core crowdfunding functionality:

- Project registration with name, description, funding goal, and deadline
- Contribution handling with secure fund management
- Withdrawal mechanism for successful projects
- Refund capability for unsuccessful projects

### Solana Program
The Solana program leverages Anchor framework to provide similar functionality:

- Project initialization with configurable parameters
- Contribution tracking with secure fund custody
- Fund distribution upon successful campaign completion
- Refund mechanism for unsuccessful campaigns

### Solana Development Setup
For Windows users, it's recommended to use WSL (Windows Subsystem for Linux) with Ubuntu for Solana development:

1. Install WSL Ubuntu from the Microsoft Store or via PowerShell
2. Set up the Anchor development environment in WSL:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"

# Install Anchor
npm install -g @coral-xyz/anchor-cli
```

3. Configure Solana for Devnet:
```bash
solana config set --url devnet
``` 

🏗️ Project Structure
```
multichain-launchpad/
├── contracts/                  # Smart contracts
│   ├── ethereum/               # Ethereum/Polygon contracts
│   │   └── Launchpad.sol       # Main EVM launchpad contract
│   └── solana/                 # Solana program files
│       └── launchpad.rs        # Main Solana launchpad program
├── scripts/                    # Deployment and utility scripts
├── src/                        # Frontend React application
│   ├── components/             # UI components
│   ├── contexts/               # React contexts for state management
│   ├── hooks/                  # Custom React hooks
│   ├── pages/                  # Application pages
│   └── utils/                  # Utility functions
├── test/                       # Test files
├── .env.example                # Example environment configuration
├── README.md                   # This file
└── package.json                # Project dependencies

```
### 🔄 Workflow

1. Project Creation

- Project creators connect their wallet (MetaMask or Phantom)
- Fill in project details and set funding goals
- Deploy project to chosen blockchain (Polygon or Solana)


2. Funding

- Investors browse available projects
- Connect appropriate wallet based on project chain
- Contribute funds to projects they wish to support


3. Completion

- Successful projects: Creators withdraw funds after deadline
- Unsuccessful projects: Contributors claim refunds

## 🖥️ Screenshots
### Main Dashboard
Landing page with wallet connection options for both Polygon and Solana chains

### Project Creation
Form for creating a new project on the selected blockchain.

### Contract Tests
All tests passing for the Launchpad smart contract



### 🛠️ Technology Stack

- Frontend: React.js (v19.0.0), React Router (v7.1.3)
- Ethereum/Polygon: Hardhat, ethers.js, OpenZeppelin Contracts
- Solana: Anchor Framework
- Wallets: MetaMask (EVM), Phantom (Solana)

### 🧪 Testing
Run tests with:
``` bash
npm test
``` 

For Ethereum contract specific tests:
```bash
npx hardhat test
```

## 🚀 Deployment
### Ethereum/Polygon Deployment
``` bash
npx hardhat run scripts/deploy.js --network amoy
```

### Solana Deployment
``` bash
anchor deploy --provider.cluster devnet
```

### 📝 License
This project is licensed under the ISC License - see the LICENSE file for details.
### 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
