# 🛡️ NIRBHAYA - Women Safety Reporting Platform

A decentralized blockchain-based platform for reporting and tracking women's safety incidents with AI-powered analytics and immutable record-keeping.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-20%2B-green.svg)
![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)
![Solidity](https://img.shields.io/badge/solidity-0.8.28-orange.svg)

## 🌟 Overview

**Nirbhaya** empowers communities to report safety incidents transparently and securely on the Celo blockchain. The platform combines:

- 📱 **User-Friendly Interface** - Easy incident reporting with photo capture/upload
- 🔗 **Blockchain Storage** - Immutable, transparent record-keeping
- 🤖 **AI Processing** - Automated report categorization and severity assessment
- 🔐 **Identity Verification** - Optional Self Protocol integration for verified reports
- 📍 **Location Tracking** - Geographic data and route clustering analysis
- 🌐 **IPFS Storage** - Decentralized image hosting via Pinata

## ✨ Key Features

### 🚨 Incident Reporting
- Real-time camera capture or file upload
- Multiple photo support
- Automatic location detection
- AI-powered report generation
- Severity classification (High/Medium/Low)

### 📊 Report Management
- View all incidents on blockchain
- Filter by severity, location, pincode
- Individual report details with images
- Transparent user attribution

### 🔐 Security & Privacy
- Wallet-based authentication (MetaMask)
- Auto-whitelist for development (bypasses Self Protocol verification)
- Decentralized storage (IPFS)
- ⚠️ **Dev Mode**: Self Protocol verification temporarily disabled for easy testing

### 🤖 AI-Powered Analytics
- Smart categorization
- Location-based clustering
- Route analysis
- Severity assessment

## 🚀 Quick Start

Get started in **under 15 minutes**! See [QUICK_START.md](./QUICK_START.md) for the fastest setup.

### Prerequisites

- Node.js 20+
- Python 3.8+
- MetaMask extension
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/Himanshu151281/NIRBHAYA.git
cd NIRBHAYA

# Setup backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
cd ..

# Setup frontend
cd self/app
npm install
cd ../..
```

### Configuration

1. **Backend** - Create `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
```

2. **Frontend** - Create `self/app/.env.local`:
```env
NEXT_PUBLIC_APP_RPC_URL=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_APP_PRIVATE_KEY=0xyour_private_key
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

3. **MetaMask** - Add Celo Alfajores:
   - Network: `Celo Alfajores`
   - RPC: `https://alfajores-forno.celo-testnet.org`
   - Chain ID: `44787`
   - Get testnet CELO: https://faucet.celo.org/alfajores

> **Note**: Self Protocol verification is disabled in development mode. Users are automatically whitelisted after connecting their wallet.

### Run Application

**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd self/app
npm run dev
```

Access at: **http://localhost:3000**

## 📚 Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Get running in 15 minutes
- **[No Credit Card Setup](./NO_CREDIT_CARD_SETUP.md)** - 100% FREE setup (no credit card anywhere!)
- **[Mapbox Integration](./MAPBOX_INTEGRATION.md)** - FREE maps powered by Mapbox
- **[Gemini AI Integration](./GEMINI_INTEGRATION.md)** - FREE AI powered by Google Gemini
- **[Complete Setup Guide](./PROJECT_SETUP_GUIDE.md)** - Detailed installation and configuration
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment steps
- **[Self Protocol Integration](./self/README.md)** - Identity verification setup

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           Frontend (Next.js + React)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Reports  │  │ Testify  │  │ Connect      │  │
│  │ View     │  │ Upload   │  │ Wallet       │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└──────────┬────────────────┬────────────────────┘
           │                │
           ▼                ▼
┌──────────────────┐  ┌────────────────────────┐
│ Backend (Python) │  │ Smart Contracts (Celo) │
│                  │  │                        │
│ • FastAPI        │  │ • Swarakhsha.sol       │
│ • OpenAI API     │  │ • ProofOfHuman.sol     │
│ • Route Cluster  │  │ • Immutable Storage    │
└──────────────────┘  └────────────────────────┘
           │                │
           ▼                ▼
┌──────────────────┐  ┌────────────────────────┐
│  External APIs   │  │   Blockchain Network   │
│                  │  │                        │
│ • Pinata (IPFS)  │  │ • Celo Alfajores       │
│ • OpenAI GPT-4   │  │ • Self Protocol        │
└──────────────────┘  └────────────────────────┘
```

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | Next.js 14, React 18, TailwindCSS, TypeScript |
| **Backend** | FastAPI, Python, OpenAI API |
| **Blockchain** | Solidity 0.8.28, Celo Network |
| **Tools** | ethers.js, Foundry, Hardhat |
| **Storage** | IPFS (Pinata), Blockchain |
| **Identity** | Self Protocol, MetaMask |
| **AI/ML** | Google Gemini, scikit-learn |

## 📂 Project Structure

```
NIRBHAYA/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Main API server
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment template
│
├── contracts/                 # Solidity smart contracts
│   └── Swaraksha.sol         # Main incident reporting contract
│
├── self/                      # Frontend application
│   ├── app/                  # Next.js application
│   │   ├── app/             # App routes and pages
│   │   ├── src/             # Components and utilities
│   │   └── package.json     # Node dependencies
│   │
│   └── contracts/           # Self Protocol contracts
│       └── src/             # ProofOfHuman contract
│
├── PROJECT_SETUP_GUIDE.md   # Comprehensive setup guide
├── QUICK_START.md           # Fast setup guide
├── DEPLOYMENT.md            # Production deployment
└── README.md                # This file
```

## 🔌 API Endpoints

### Backend API (Port 8000)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/query` | POST | AI query processing |
| `/compute` | POST | Route clustering |
| `/health` | GET | Service status |

### Smart Contract Functions

```solidity
// Add incident report (whitelisted users)
addReport(title, description, fullText, location, lat, lng, image, severity, pincode)

// View reports
getAllReports()
getReportsByUser(address)
getReportById(caseId)
getReportsBySeverity(severity)
getReportsByPincode(pincode)

// Admin functions
addUserToWhitelist(address)
removeUserFromWhitelist(address)
isWhitelisted(address)
```

## 🔑 Required API Keys

| Service | Purpose | Get From | Required |
|---------|---------|----------|----------|
| **Gemini API** | AI report processing | https://makersuite.google.com/app/apikey | ✅ Yes |
| Pinata JWT | IPFS image storage | https://app.pinata.cloud/ | ✅ Yes |
| **Mapbox Token** | Route safety mapping | https://account.mapbox.com/access-tokens/ | ✅ Yes (FREE!) |
| Celo Wallet | Blockchain transactions | MetaMask | ✅ Yes |
| Self Protocol | Identity verification | https://tools.self.xyz/ | ⚠️ Optional (Dev mode) |

## 🧪 Testing

### Test Incident Reporting
1. Navigate to "Report Incident"
2. Capture/upload photo
3. Add description
4. Submit and verify blockchain transaction

### Test Backend API
Visit http://localhost:8000/docs for interactive API documentation

### Test Smart Contracts
```bash
cd contracts
forge test
```

## 🚀 Deployment

### Quick Deploy

**Frontend (Vercel):**
```bash
cd self/app
vercel --prod
```

**Backend (Railway):**
```bash
cd backend
railway up
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment guide.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 🐛 Troubleshooting

### Common Issues

**"Cannot connect to backend"**
- Verify backend is running on port 8000
- Check `OPENAI_API_KEY` in `.env`

**"Transaction failed"**
- Ensure wallet has CELO testnet tokens
- Check if address is whitelisted

**"MetaMask not detected"**
- Install MetaMask extension
- Refresh page

See [PROJECT_SETUP_GUIDE.md](./PROJECT_SETUP_GUIDE.md) for detailed troubleshooting.

## 📊 Features Roadmap

- [x] Basic incident reporting
- [x] Blockchain storage
- [x] AI-powered categorization
- [x] IPFS image storage
- [x] Identity verification
- [ ] Email notifications
- [ ] Mobile application
- [ ] Admin dashboard
- [ ] Analytics dashboard
- [ ] Multi-language support

## 🔒 Security

- Never commit private keys
- Use environment variables for secrets
- Audit smart contracts before mainnet
- Implement rate limiting
- Use HTTPS in production
- Regular security updates

## 📄 License

This project is part of a hackathon submission. See LICENSE file for details.

## 👥 Team

- **Himanshu** - [@Himanshu151281](https://github.com/Himanshu151281)

## 🙏 Acknowledgments

- [Self Protocol](https://self.xyz/) - Identity verification
- [Celo](https://celo.org/) - Blockchain platform
- [OpenAI](https://openai.com/) - AI capabilities
- [Pinata](https://pinata.cloud/) - IPFS storage

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/Himanshu151281/NIRBHAYA/issues)
- **Documentation**: See docs in repository
- **Email**: [Your Email]

## 🌐 Links

- **Demo**: [Live Demo URL]
- **Documentation**: [Docs URL]
- **Video Demo**: [YouTube URL]
- **Presentation**: [Slides URL]

---

<div align="center">

**Built with ❤️ for safer communities**

[![GitHub stars](https://img.shields.io/github/stars/Himanshu151281/NIRBHAYA?style=social)](https://github.com/Himanshu151281/NIRBHAYA/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/Himanshu151281/NIRBHAYA?style=social)](https://github.com/Himanshu151281/NIRBHAYA/network/members)

[🚀 Quick Start](./QUICK_START.md) • [📖 Full Guide](./PROJECT_SETUP_GUIDE.md) • [🚢 Deploy](./DEPLOYMENT.md)

</div>
