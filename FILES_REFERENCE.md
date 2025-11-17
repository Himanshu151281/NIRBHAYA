# Project Files Overview

This document provides a quick reference to all important files in the Nirbhaya project.

## 📁 Documentation Files

| File | Purpose |
|------|---------|
| `README.md` | Main project overview and quick start |
| `QUICK_START.md` | Fast 15-minute setup guide |
| `PROJECT_SETUP_GUIDE.md` | Comprehensive installation and configuration |
| `DEPLOYMENT.md` | Production deployment checklist |
| `DEVELOPMENT.md` | Development tips and best practices |
| `FILES_REFERENCE.md` | This file - quick reference guide |

## 🚀 Startup Scripts

| File | Platform | Purpose |
|------|----------|---------|
| `start-dev.bat` | Windows | Auto-start both backend and frontend |
| `start-dev.sh` | macOS/Linux | Auto-start both backend and frontend |

**Usage:**
```bash
# Windows
start-dev.bat

# macOS/Linux
chmod +x start-dev.sh
./start-dev.sh
```

## 🔧 Backend Files

### Core Files
| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI server with AI endpoints |
| `backend/requirements.txt` | Python dependencies |
| `backend/.env.example` | Environment variables template |
| `backend/.env` | Your configuration (create from example) |

### Key Functions in main.py
- `POST /query` - AI-powered query processing
- `POST /compute` - Route clustering analysis
- `GET /health` - Health check endpoint

## 🎨 Frontend Files

### Configuration
| File | Purpose |
|------|---------|
| `self/app/package.json` | Node.js dependencies |
| `self/app/.env.example` | Environment template |
| `self/app/.env.local` | Your configuration (create from example) |
| `self/app/next.config.mjs` | Next.js configuration |
| `self/app/tailwind.config.ts` | TailwindCSS configuration |
| `self/app/tsconfig.json` | TypeScript configuration |

### Pages
| File | Route | Purpose |
|------|-------|---------|
| `app/page.tsx` | `/` | Homepage |
| `app/connect/page.tsx` | `/connect` | Wallet connection |
| `app/testify/page.tsx` | `/testify` | Report incident |
| `app/reports/page.tsx` | `/reports` | View all reports |
| `app/report/[id]/page.tsx` | `/report/:id` | Individual report details |
| `app/self-login/page.tsx` | `/self-login` | Self Protocol verification |
| `app/verified/page.tsx` | `/verified` | Verification success |

### Components
| File | Purpose |
|------|---------|
| `src/components/custom/Nav.tsx` | Navigation bar |
| `src/components/custom/HeroSection.tsx` | Homepage hero |
| `src/components/custom/FeatureHighlights.tsx` | Features display |
| `src/components/custom/QuickAction.tsx` | Quick action buttons |
| `src/components/custom/Map.tsx` | Map component |
| `src/components/custom/Footer.tsx` | Footer component |

### Context & Hooks
| File | Purpose |
|------|---------|
| `src/context/SwarProvider.tsx` | Blockchain provider |
| `src/context/swarContext.ts` | Context definition |
| `src/utils/useSwarContext.ts` | Custom hook |
| `src/utils/abi.json` | Smart contract ABI |

### API Routes
| File | Purpose |
|------|---------|
| `app/api/ai/route.ts` | Proxy to backend AI endpoint |

## ⛓️ Smart Contracts

### Main Contracts
| File | Purpose |
|------|---------|
| `contracts/Swaraksha.sol` | Main incident reporting contract |
| `self/contracts/src/ProofOfHuman.sol` | Self Protocol verification |

### Contract Scripts
| File | Purpose |
|------|---------|
| `self/contracts/script/DeployProofOfHuman.s.sol` | Deployment script |
| `self/contracts/script/Base.s.sol` | Base script utilities |

### Configuration
| File | Purpose |
|------|---------|
| `self/contracts/foundry.toml` | Foundry configuration |
| `self/contracts/.env.example` | Contract environment template |

## 🔑 Environment Variables

### Backend (.env)
```env
OPENAI_API_KEY=your_key_here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_APP_RPC_URL=https://alfajores-forno.celo-testnet.org
NEXT_PUBLIC_APP_PRIVATE_KEY=0x...
NEXT_PUBLIC_PINATA_JWT=your_jwt
```

### Contracts (.env)
```env
PRIVATE_KEY=0x...
VERIFICATION_CONFIG_ID=0x...
NETWORK=celo-alfajores
IDENTITY_VERIFICATION_HUB_ADDRESS=0x...
```

## 📦 Configuration Files

### Root Level
| File | Purpose |
|------|---------|
| `.gitignore` | Git ignore patterns |
| `.DS_Store` | macOS folder metadata (ignore) |

### Frontend
| File | Purpose |
|------|---------|
| `components.json` | Shadcn/ui configuration |
| `postcss.config.mjs` | PostCSS configuration |

## 🎯 Key Directories

```
NIRBHAYA/
├── backend/              # Python FastAPI backend
│   ├── main.py          # Main server file
│   ├── requirements.txt # Dependencies
│   └── .env.example     # Config template
│
├── contracts/           # Main smart contracts
│   └── Swaraksha.sol   # Incident reporting
│
├── self/                # Frontend + Self Protocol
│   ├── app/            # Next.js application
│   │   ├── app/       # Routes and pages
│   │   └── src/       # Components, context, utils
│   │
│   └── contracts/     # Self Protocol contracts
│       └── src/       # ProofOfHuman.sol
│
└── docs/              # Documentation (this folder)
    ├── README.md
    ├── QUICK_START.md
    └── ...
```

## 🔄 Common File Operations

### Creating New Page
1. Create file in `self/app/app/your-page/page.tsx`
2. Add route in navigation component
3. Update routing if needed

### Adding New API Endpoint (Backend)
1. Add function in `backend/main.py`
2. Define Pydantic models
3. Test at `/docs` endpoint

### Adding Smart Contract Function
1. Update contract file
2. Compile: `forge build`
3. Test: `forge test`
4. Update ABI in `src/utils/abi.json`
5. Update provider functions

### Modifying Environment Variables
1. Update `.env.example` files
2. Document in README
3. Update in deployment configs

## 🛠️ File Templates

### New React Component
```typescript
// components/custom/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  title: string;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title }) => {
  return (
    <div>
      <h2>{title}</h2>
    </div>
  );
};
```

### New API Endpoint
```python
# backend/main.py
@app.post("/my-endpoint")
async def my_endpoint(data: RequestModel):
    try:
        result = process_data(data)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### New Smart Contract Function
```solidity
// contracts/Swaraksha.sol
function myFunction(uint256 _id) external view returns (bool) {
    require(_id > 0, "Invalid ID");
    return someMapping[_id];
}
```

## 📝 File Naming Conventions

- **React Components**: PascalCase (e.g., `HeroSection.tsx`)
- **Utilities**: camelCase (e.g., `useSwarContext.ts`)
- **Routes**: kebab-case folders (e.g., `self-login/`)
- **Python Files**: snake_case (e.g., `main.py`)
- **Smart Contracts**: PascalCase (e.g., `Swaraksha.sol`)

## 🔍 Finding Files

### Quick Search Commands

```bash
# Find all TypeScript files
find . -name "*.tsx" -o -name "*.ts"

# Find all Python files
find . -name "*.py"

# Find all Solidity contracts
find . -name "*.sol"

# Find configuration files
find . -name "*.json" -o -name "*.config.*"
```

### Important File Patterns

- `**/.env*` - Environment files (never commit .env!)
- `**/package.json` - Node.js projects
- `**/requirements.txt` - Python projects
- `**/*.sol` - Smart contracts
- `**/page.tsx` - Next.js pages
- `**/route.ts` - Next.js API routes

## 🚨 Files to NEVER Commit

- `.env`
- `.env.local`
- `node_modules/`
- `venv/`
- `__pycache__/`
- `.DS_Store`
- `*.log`
- Private keys
- API keys

## ✅ Essential Files Checklist

For a working project, you need:

- [ ] `backend/.env` (with OPENAI_API_KEY)
- [ ] `self/app/.env.local` (with all keys)
- [ ] `backend/venv/` (virtual environment)
- [ ] `self/app/node_modules/` (dependencies)
- [ ] `src/utils/abi.json` (contract ABI)

## 📚 Further Reading

Each major file type has detailed documentation in the respective README files:

- Backend: See `backend/` directory
- Frontend: See `self/app/` directory  
- Contracts: See `contracts/` and `self/contracts/`

---

**Quick Navigation:**
- [Main README](./README.md)
- [Quick Start](./QUICK_START.md)
- [Setup Guide](./PROJECT_SETUP_GUIDE.md)
- [Deployment](./DEPLOYMENT.md)
- [Development](./DEVELOPMENT.md)
