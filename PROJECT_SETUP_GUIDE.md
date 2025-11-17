# NIRBHAYA - Women Safety Reporting Platform

## 🎯 Project Overview

**Nirbhaya** is a comprehensive blockchain-based platform for reporting and tracking women's safety incidents. The platform combines:

- **Frontend (Next.js)**: User interface for reporting incidents, viewing reports, and wallet management
- **Backend (FastAPI)**: AI-powered route clustering and incident processing
- **Blockchain (Solidity)**: Immutable incident storage on Celo network with Self Protocol identity verification
- **Smart Contracts**: Two contract systems:
  - `Swarakhsha.sol`: Main incident reporting contract
  - `ProofOfHuman.sol`: Self Protocol identity verification

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Technology Stack](#technology-stack)
4. [Installation Guide](#installation-guide)
5. [Configuration](#configuration)
6. [Running the Project](#running-the-project)
7. [Credentials & API Keys](#credentials--api-keys)
8. [Deployment](#deployment)
9. [Features](#features)
10. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  - Report Incidents (with camera/upload)                    │
│  - View All Reports                                         │
│  - Wallet Connection (MetaMask)                            │
│  - Self Protocol Identity Verification                      │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐    ┌───────────────────────────┐
│   Backend (FastAPI)      │    │   Smart Contracts (Celo)  │
│   - AI Query Processing  │    │   - Swarakhsha.sol        │
│   - Route Clustering     │    │   - ProofOfHuman.sol      │
│   - OpenAI Integration   │    │   - Immutable Storage     │
└──────────────────────────┘    └───────────────────────────┘
```

---

## 🔧 Prerequisites

### Required Software

1. **Node.js** (v20.x or higher)
   - Download: https://nodejs.org/

2. **Python** (v3.8 or higher)
   - Download: https://www.python.org/downloads/

3. **Git**
   - Download: https://git-scm.com/

4. **MetaMask Browser Extension**
   - Chrome: https://chrome.google.com/webstore/detail/metamask/
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/

5. **Foundry (for smart contract development)**
   - Installation: 
     ```bash
     curl -L https://foundry.paradigm.xyz | bash
     foundryup
     ```

### Optional Software

- **Self Mobile App** (for identity verification)
  - iOS: https://apps.apple.com/app/self-protocol
  - Android: https://play.google.com/store/apps/details?id=xyz.self

---

## 💻 Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18)
- **Styling**: TailwindCSS
- **Blockchain**: ethers.js v6
- **Identity**: Self Protocol SDK
- **Maps**: Google Maps API
- **Image Storage**: Pinata (IPFS)

### Backend
- **Framework**: FastAPI
- **AI/ML**: OpenAI API, scikit-learn
- **Data Processing**: pandas, numpy

### Blockchain
- **Network**: Celo Alfajores (Testnet) / Celo Mainnet
- **Smart Contracts**: Solidity 0.8.28
- **Development**: Foundry
- **Identity**: Self Protocol

---

## 📥 Installation Guide

### 1. Clone the Repository

```bash
git clone https://github.com/Himanshu151281/NIRBHAYA.git
cd NIRBHAYA
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd ../self/app

# Install dependencies
npm install

# Create .env.local file (see Configuration section)
```

### 4. Smart Contracts Setup (Swarakhsha)

The main `Swarakhsha.sol` contract is already deployed. You'll need the contract address and ABI for frontend integration.

**Deployed Contract Address**: `0xA40086386174Cb0DcA5C34f619E8960dFF3a21f1` (Update if different)

### 5. Self Protocol Contracts Setup (Optional)

```bash
# Navigate to contracts directory
cd ../contracts

# Install npm dependencies
npm install

# Install Foundry dependencies
forge install
```

---

## ⚙️ Configuration

### Backend Configuration

Create `backend/.env`:

```env
# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Frontend Configuration

Create `self/app/.env.local`:

```env
# Blockchain Configuration
NEXT_PUBLIC_APP_RPC_URL=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_APP_PRIVATE_KEY=your_private_key_here_for_whitelisting

# Pinata (IPFS) Configuration
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_token

# Self Protocol Configuration (Optional)
NEXT_PUBLIC_SELF_ENDPOINT=your_proof_of_human_contract_address
NEXT_PUBLIC_SELF_APP_NAME="Nirbhaya"
NEXT_PUBLIC_SELF_SCOPE="nirbhaya-app"
```

### Self Protocol Contracts Configuration (Optional)

Create `self/contracts/.env`:

```env
# Deployment Configuration
PRIVATE_KEY=0xyour_private_key_here
VERIFICATION_CONFIG_ID=0x_your_config_id_from_tools.self.xyz
NETWORK=celo-alfajores
SCOPE_SEED="nirbhaya-self"

# Celo Network Configuration
IDENTITY_VERIFICATION_HUB_ADDRESS=0x68c931C9a534D37aa78094877F46fE46a49F1A51
PLACEHOLDER_SCOPE=1

# Celoscan API Key (for contract verification)
CELOSCAN_API_KEY=your_celoscan_api_key
```

---

## 🔑 Credentials & API Keys

### 1. OpenAI API Key
- **Purpose**: AI-powered incident report processing and route clustering
- **Where to get**:
  1. Visit https://platform.openai.com/
  2. Sign up or log in
  3. Go to API Keys section
  4. Create new secret key
  5. Copy and add to `backend/.env`

### 2. Pinata JWT Token
- **Purpose**: IPFS image storage for incident photos
- **Where to get**:
  1. Visit https://pinata.cloud/
  2. Sign up for free account
  3. Go to API Keys
  4. Generate new JWT token
  5. Copy and add to `self/app/.env.local`

### 3. MetaMask Wallet
- **Purpose**: Blockchain interaction, signing transactions
- **Setup**:
  1. Install MetaMask extension
  2. Create new wallet or import existing
  3. Save your private key securely
  4. Add Celo Alfajores testnet:
     - Network Name: `Celo Alfajores`
     - RPC URL: `https://alfajores-forno.celo-testnet.org`
     - Chain ID: `44787`
     - Currency Symbol: `CELO`
     - Block Explorer: `https://alfajores.celoscan.io`
  5. Get testnet tokens: https://faucet.celo.org/alfajores

### 4. Google Maps API (Optional)
- **Purpose**: Location display on maps
- **Where to get**:
  1. Visit https://console.cloud.google.com/
  2. Create new project
  3. Enable Maps JavaScript API
  4. Create credentials (API Key)
  5. Add to frontend environment

### 5. Celoscan API Key (Optional)
- **Purpose**: Smart contract verification
- **Where to get**:
  1. Visit https://celoscan.io/
  2. Sign up for account
  3. Go to API Keys section
  4. Generate free API key

### 6. Self Protocol Configuration (Optional)
- **Purpose**: Identity verification
- **Where to get**:
  1. Visit https://tools.self.xyz/
  2. Create verification config
  3. Set age requirements, country exclusions
  4. Deploy configuration (testnet)
  5. Copy Config ID (bytes32 format)

---

## 🚀 Running the Project

### Step 1: Start Backend Server

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment (if not already active)
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start FastAPI server
uvicorn main:app --reload --port 8000

# Server will be available at: http://localhost:8000
# API docs at: http://localhost:8000/docs
```

### Step 2: Start Frontend Development Server

```bash
# Open new terminal
# Navigate to frontend directory
cd self/app

# Start Next.js development server
npm run dev

# Application will be available at: http://localhost:3000
```

### Step 3: Access the Application

1. Open browser: http://localhost:3000
2. Connect MetaMask wallet
3. Switch to Celo Alfajores network (if not automatic)
4. Complete identity verification (if using Self Protocol)
5. Start reporting incidents!

---

## 🔄 Project Workflow

### User Flow

```
1. User visits homepage
   ↓
2. Connect wallet (MetaMask)
   ↓
3. Identity verification (Self Protocol - Optional)
   ↓
4. Whitelist address (automated)
   ↓
5. Access application features:
   - Report Incident
   - View Reports
   - Search Location
```

### Incident Reporting Flow

```
1. Navigate to /testify
   ↓
2. Capture/Upload photos
   ↓
3. Add description
   ↓
4. Location automatically captured
   ↓
5. Submit → Photos uploaded to IPFS (Pinata)
   ↓
6. AI processes description → Backend API
   ↓
7. Smart contract stores report → Blockchain
   ↓
8. Transaction confirmed
   ↓
9. Redirect to homepage
```

---

## 🎨 Key Features

### 1. **Incident Reporting**
- Camera capture or file upload
- Multiple photo support
- Automatic location detection
- AI-powered report generation
- IPFS storage for images

### 2. **Report Viewing**
- Browse all incidents
- Filter by severity (High/Medium/Low)
- Filter by location/pincode
- View individual report details

### 3. **Blockchain Storage**
- Immutable record keeping
- Transparent and auditable
- Decentralized storage
- User authentication via wallet

### 4. **Identity Verification (Optional)**
- Self Protocol integration
- Proof of humanity
- Age verification
- Country restrictions

### 5. **AI-Powered Features**
- Smart report categorization
- Severity assessment
- Route clustering analysis
- Location-based insights

---

## 📝 Smart Contract Functions

### Swarakhsha Contract

```solidity
// Add report (whitelisted users only)
function addReport(
    string memory _title,
    string memory _description,
    string memory _fullText,
    string memory _location,
    string memory _latitude,
    string memory _longitude,
    string memory _image,
    string memory _severity,
    string memory _pincode
) external onlyWhitelisted

// Get all reports
function getAllReports() external view returns (Report[] memory)

// Get reports by user
function getReportsByUser(address _user) external view returns (Report[] memory)

// Get report by ID
function getReportById(uint256 _caseId) external view returns (Report memory)

// Get reports by severity
function getReportsBySeverity(string memory _severity) external view returns (Report[] memory)

// Get reports by pincode
function getReportsByPincode(string memory _pincode) external view returns (Report[] memory)

// Whitelist management (owner only)
function addUserToWhitelist(address _user) external onlyOwner
function removeUserFromWhitelist(address _user) external onlyOwner
function isWhitelisted(address _user) external view returns (bool)
```

---

## 🛠️ Development Commands

### Frontend Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Backend Commands

```bash
# Start development server
uvicorn main:app --reload

# Start production server
uvicorn main:app --host 0.0.0.0 --port 8000

# Run with specific workers
uvicorn main:app --workers 4
```

### Smart Contract Commands

```bash
# Compile contracts
forge build

# Run tests
forge test

# Deploy contract
forge script script/DeployProofOfHuman.s.sol:DeployProofOfHuman --rpc-url $RPC_URL --broadcast

# Verify contract
forge verify-contract <CONTRACT_ADDRESS> ProofOfHuman --chain-id 44787
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **MetaMask not connecting**
- Ensure MetaMask is installed
- Check if you're on correct network (Celo Alfajores)
- Try refreshing the page
- Clear browser cache

#### 2. **Backend API errors**
- Check if backend server is running (port 8000)
- Verify OpenAI API key is set correctly
- Check Python virtual environment is activated

#### 3. **Transaction failures**
- Ensure you have CELO testnet tokens
- Check if address is whitelisted
- Verify contract address in code
- Check gas limits

#### 4. **Image upload failures**
- Verify Pinata JWT token is correct
- Check file size (keep under 10MB)
- Ensure stable internet connection

#### 5. **Contract interaction errors**
- Verify ABI matches deployed contract
- Check contract address is correct
- Ensure wallet has sufficient gas

### Error Messages

**"Not a whitelisted user"**
- Solution: Wait for automatic whitelisting or contact admin

**"OpenAI API key not set"**
- Solution: Add `OPENAI_API_KEY` to `backend/.env`

**"Failed to fetch reports"**
- Solution: Check blockchain connection and contract address

**"Insufficient funds"**
- Solution: Get testnet CELO from faucet

---

## 📦 Deployment

### Frontend Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd self/app
vercel

# Add environment variables in Vercel dashboard
```

### Backend Deployment (Railway/Render)

1. Create new project
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

### Smart Contract Deployment

```bash
# Deploy to Celo Alfajores
cd contracts
forge script script/DeployProofOfHuman.s.sol:DeployProofOfHuman \
  --rpc-url https://alfajores-forno.celo-testnet.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify

# Deploy Swarakhsha contract (if needed)
# Use Remix IDE or Foundry
```

---

## 🔒 Security Considerations

1. **Never commit private keys** to version control
2. **Use .env files** for sensitive data
3. **Validate all user inputs** on backend
4. **Implement rate limiting** for API endpoints
5. **Use HTTPS** in production
6. **Audit smart contracts** before mainnet deployment
7. **Implement proper access controls**
8. **Keep dependencies updated**

---

## 📊 API Endpoints

### Backend API

#### `GET /`
- Returns health check message

#### `POST /query`
Request:
```json
{
  "query": "string",
  "context": "string"
}
```
Response:
```json
{
  "answer": "string",
  "raw": {}
}
```

#### `POST /compute`
Request:
```json
{
  "startingLat": 0,
  "startingLong": 0,
  "endingLat": 0,
  "endingLong": 0,
  "records": [],
  "k": 10,
  "max_points": 2000
}
```

#### `GET /health`
- Returns API health status

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is part of a hackathon submission.

---

## 👥 Support

For issues and questions:
- GitHub Issues: https://github.com/Himanshu151281/NIRBHAYA/issues
- Email: [Your Email]

---

## 🎯 Next Steps

### To Make This Production Ready:

1. **Testing**
   - [ ] Add unit tests for smart contracts
   - [ ] Add integration tests for API
   - [ ] Add E2E tests for frontend
   - [ ] Test on multiple browsers

2. **Security**
   - [ ] Smart contract audit
   - [ ] Penetration testing
   - [ ] Input validation improvements
   - [ ] Rate limiting implementation

3. **Features**
   - [ ] Email notifications
   - [ ] SMS alerts
   - [ ] Admin dashboard
   - [ ] Analytics dashboard
   - [ ] Mobile app (React Native)

4. **Infrastructure**
   - [ ] CDN for static assets
   - [ ] Database for off-chain data
   - [ ] Monitoring and logging
   - [ ] Backup strategies

5. **Documentation**
   - [ ] API documentation
   - [ ] User manual
   - [ ] Developer guide
   - [ ] Video tutorials

---

## 📞 Quick Start Checklist

- [ ] Install Node.js 20+
- [ ] Install Python 3.8+
- [ ] Install MetaMask
- [ ] Clone repository
- [ ] Setup backend (.env with OpenAI key)
- [ ] Setup frontend (.env.local with Pinata JWT)
- [ ] Get testnet CELO tokens
- [ ] Start backend server (port 8000)
- [ ] Start frontend server (port 3000)
- [ ] Connect wallet
- [ ] Test incident reporting

---

**Ready to make communities safer! 🛡️**
