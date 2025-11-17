# 🚀 Production Deployment Checklist

Complete guide to deploy Nirbhaya platform to production.

## 📋 Pre-Deployment Checklist

### Security Review
- [ ] All private keys removed from code
- [ ] Environment variables properly configured
- [ ] API keys rotated from development
- [ ] Smart contracts audited
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS properly configured
- [ ] HTTPS enabled
- [ ] Security headers configured

### Testing
- [ ] All features tested on testnet
- [ ] Cross-browser testing completed
- [ ] Mobile responsiveness verified
- [ ] Smart contract functions tested
- [ ] API endpoints tested
- [ ] Error handling tested
- [ ] Load testing performed
- [ ] Integration tests passing

### Documentation
- [ ] README.md updated
- [ ] API documentation complete
- [ ] User guide created
- [ ] Deployment notes documented
- [ ] Environment variables documented
- [ ] Architecture diagrams updated

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare for Deployment

```bash
cd self/app

# Test production build locally
npm run build
npm start

# Verify build works correctly
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### 3. Configure Environment Variables in Vercel

Go to Vercel Dashboard → Project → Settings → Environment Variables

Add the following:

```
NEXT_PUBLIC_APP_RPC_URL=https://forno.celo.org
NEXT_PUBLIC_APP_PRIVATE_KEY=your_mainnet_private_key
NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt
NEXT_PUBLIC_SELF_ENDPOINT=your_contract_address
NEXT_PUBLIC_SELF_APP_NAME=Nirbhaya
NEXT_PUBLIC_SELF_SCOPE=nirbhaya-production
```

### 4. Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning

## 🔧 Backend Deployment (Railway)

### 1. Prepare Backend

```bash
cd backend

# Create requirements.txt (if not exists)
pip freeze > requirements.txt

# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port \$PORT" > Procfile

# Test locally with production settings
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 2. Deploy to Railway

1. Go to https://railway.app/
2. Sign up with GitHub
3. New Project → Deploy from GitHub repo
4. Select your repository
5. Configure build settings:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Configure Environment Variables

Add in Railway Dashboard → Variables:

```
OPENAI_API_KEY=your_production_openai_key
PORT=8000
```

### 4. Get Deployment URL

Copy the Railway deployment URL (e.g., `https://your-app.railway.app`)

### 5. Update Frontend API Endpoint

Update `self/app/app/api/ai/route.ts`:

```typescript
const aiResponse = await fetch("https://your-app.railway.app/query", {
  // ... rest of code
});
```

Redeploy frontend to Vercel.

## 📦 Alternative Backend Deployment (Render)

### 1. Prepare for Render

Same as Railway preparation above.

### 2. Deploy to Render

1. Go to https://render.com/
2. New → Web Service
3. Connect GitHub repository
4. Configure:
   - Name: nirbhaya-backend
   - Environment: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 3. Add Environment Variables

Same as Railway configuration.

## ⛓️ Smart Contract Deployment (Celo Mainnet)

### 1. Prepare for Mainnet

```bash
cd contracts

# Update .env for mainnet
PRIVATE_KEY=0xyour_mainnet_private_key
NETWORK=celo
IDENTITY_VERIFICATION_HUB_ADDRESS=0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF
```

### 2. Get Mainnet CELO

1. Buy CELO from exchange (Coinbase, Binance)
2. Transfer to your deployment wallet
3. Ensure sufficient balance for gas fees

### 3. Deploy Swarakhsha Contract

```bash
# Using Remix IDE (Recommended for production)
# 1. Go to https://remix.ethereum.org/
# 2. Upload Swarakhsha.sol
# 3. Compile contract
# 4. Deploy using Injected Provider (MetaMask)
# 5. Confirm network is Celo Mainnet (Chain ID: 42220)
# 6. Deploy and save contract address
```

### 4. Verify Contract on Celoscan

```bash
# If using Foundry
forge verify-contract <CONTRACT_ADDRESS> Swarakhsha \
  --chain-id 42220 \
  --etherscan-api-key $CELOSCAN_API_KEY

# Or verify manually on Celoscan:
# https://celoscan.io/verifyContract
```

### 5. Deploy ProofOfHuman (Optional)

```bash
# Only if using Self Protocol
forge script script/DeployProofOfHuman.s.sol:DeployProofOfHuman \
  --rpc-url https://forno.celo.org \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### 6. Update Frontend Contract Address

Update `self/app/src/context/SwarProvider.tsx`:

```typescript
const contractAddress = "0xYourMainnetContractAddress";
```

## 🔄 Post-Deployment Tasks

### 1. Update Frontend Environment

Redeploy frontend with mainnet contract address:

```bash
cd self/app
vercel --prod
```

### 2. Whitelist Initial Admin

Run whitelisting transaction for contract owner:

```bash
# Using ethers.js script or through frontend
# Or manually through Celoscan write contract interface
```

### 3. Test Production Deployment

- [ ] Visit production URL
- [ ] Connect wallet (mainnet)
- [ ] Test incident reporting
- [ ] Verify transaction on Celoscan
- [ ] Check image uploads to IPFS
- [ ] Test report viewing
- [ ] Test all navigation flows

### 4. Monitor Deployment

Set up monitoring:

- [ ] Vercel analytics enabled
- [ ] Railway/Render logs monitored
- [ ] Smart contract events tracked
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring (UptimeRobot)

### 5. Configure Backups

- [ ] Database backups (if applicable)
- [ ] Contract state snapshots
- [ ] Code repository backups
- [ ] Environment variables backed up securely

## 🔐 Security Hardening

### Frontend
- [ ] Enable Content Security Policy
- [ ] Add security headers
- [ ] Implement rate limiting
- [ ] Add CAPTCHA for reports
- [ ] Enable DDoS protection (Cloudflare)

### Backend
- [ ] Enable CORS properly
- [ ] Implement authentication tokens
- [ ] Add request rate limiting
- [ ] Set up Web Application Firewall
- [ ] Enable HTTPS only

### Smart Contracts
- [ ] Pause functionality for emergencies
- [ ] Multi-sig for admin operations
- [ ] Upgradeable proxy pattern (if needed)
- [ ] Regular security audits

## 📊 Monitoring & Analytics

### Set Up Monitoring

1. **Vercel Analytics**
   - Enable in Vercel dashboard
   - Monitor page views, performance

2. **Railway/Render Logs**
   - Set up log aggregation
   - Configure alerts for errors

3. **Blockchain Monitoring**
   - Track contract transactions
   - Monitor gas usage
   - Set up event listeners

4. **Error Tracking** (Optional)
   ```bash
   npm install @sentry/nextjs
   # Configure Sentry in next.config.js
   ```

## 🚨 Emergency Procedures

### If Something Goes Wrong

1. **Frontend Issues**
   - Rollback in Vercel: Dashboard → Deployments → Rollback
   - Check error logs
   - Verify environment variables

2. **Backend Issues**
   - Check Railway/Render logs
   - Restart service
   - Verify database connections
   - Check API rate limits

3. **Smart Contract Issues**
   - Use pause function if implemented
   - Contact users via social media
   - Prepare migration plan if needed
   - Document incident

## ✅ Final Production Checklist

- [ ] All services deployed and running
- [ ] Environment variables configured
- [ ] Smart contracts deployed and verified
- [ ] Custom domains configured (if applicable)
- [ ] SSL certificates active
- [ ] Monitoring systems active
- [ ] Backup systems configured
- [ ] Documentation updated
- [ ] Team notified of deployment
- [ ] Announcement prepared for users

## 📞 Support Contacts

### Service Providers
- **Vercel Support**: https://vercel.com/support
- **Railway Support**: https://railway.app/help
- **Render Support**: https://render.com/docs
- **Celo Support**: https://discord.com/invite/celo

### External Services
- **OpenAI Status**: https://status.openai.com/
- **Pinata Status**: https://status.pinata.cloud/
- **MetaMask Support**: https://metamask.io/support/

## 🎉 Post-Launch

After successful deployment:

1. **Announce Launch**
   - Social media announcement
   - Product Hunt submission
   - Tech community sharing

2. **Gather Feedback**
   - Set up feedback form
   - Monitor user reports
   - Track error rates

3. **Plan Iterations**
   - Review analytics
   - Plan feature updates
   - Schedule maintenance

4. **Community Building**
   - Create documentation
   - Engage with users
   - Build support channels

---

## 📝 Deployment Log Template

```markdown
## Deployment - [Date]

### Frontend
- URL: https://your-domain.com
- Deployed by: [Name]
- Commit: [Git commit hash]
- Status: ✅ Success

### Backend
- URL: https://api-url.com
- Deployed by: [Name]
- Version: [Version number]
- Status: ✅ Success

### Smart Contracts
- Network: Celo Mainnet
- Swarakhsha: 0x...
- ProofOfHuman: 0x...
- Deployed by: [Wallet address]
- Gas Used: [Amount]
- Status: ✅ Success

### Issues Encountered
- None / [List any issues]

### Post-Deployment Tests
- [ ] Frontend accessible
- [ ] Backend API responding
- [ ] Smart contracts functional
- [ ] All features working

### Notes
[Any additional notes]
```

---

**Deployment Complete! 🎉**

Remember to document everything and keep your deployment credentials secure!
