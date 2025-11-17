# 🔧 Development Tips & Best Practices

Essential tips for developing and maintaining the Nirbhaya platform.

## 🎯 Development Workflow

### 1. Setting Up Development Environment

```bash
# Always use virtual environments
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Install in development mode
pip install -r requirements.txt

# For frontend
cd self/app
npm install
```

### 2. Running in Development Mode

**Backend with auto-reload:**
```bash
uvicorn main:app --reload --port 8000
```

**Frontend with fast refresh:**
```bash
npm run dev
```

**Watch smart contracts:**
```bash
forge test --watch
```

## 💡 Coding Best Practices

### Frontend (Next.js/React)

#### 1. Component Structure
```typescript
// Good: Separate concerns
const ReportCard = ({ report }: { report: Report }) => {
  return (
    <div className="report-card">
      <ReportHeader title={report.title} />
      <ReportBody description={report.description} />
      <ReportFooter severity={report.severity} />
    </div>
  );
};

// Bad: Everything in one component
```

#### 2. Use Custom Hooks
```typescript
// Good: Reusable logic
const { addReport, getAllReports } = useSwarakhsha();

// Bad: Directly accessing context everywhere
const context = useContext(SwarContext);
```

#### 3. Error Handling
```typescript
// Good: Handle all states
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

try {
  setLoading(true);
  const result = await fetchData();
  setData(result);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}

// Bad: No error handling
const data = await fetchData();
```

#### 4. Environment Variables
```typescript
// Good: Type-safe environment variables
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT;
if (!PINATA_JWT) throw new Error("Pinata JWT not configured");

// Bad: Direct usage without validation
const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;
```

### Backend (FastAPI/Python)

#### 1. Type Hints
```python
# Good: Clear types
async def add_report(
    title: str,
    description: str,
    severity: str
) -> Report:
    ...

# Bad: No type hints
async def add_report(title, description, severity):
    ...
```

#### 2. Error Handling
```python
# Good: Specific exceptions
try:
    result = await process_data()
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")

# Bad: Catching everything silently
try:
    result = await process_data()
except:
    pass
```

#### 3. Logging
```python
# Good: Structured logging
import logging

logging.info(f"Processing report: {report_id}")
logging.error(f"Failed to process: {error}", exc_info=True)

# Bad: Print statements
print("Processing report")
```

### Smart Contracts (Solidity)

#### 1. Access Control
```solidity
// Good: Clear modifiers
modifier onlyWhitelisted() {
    require(whitelist[msg.sender], "Not whitelisted");
    _;
}

function addReport(...) external onlyWhitelisted {
    // function code
}

// Bad: Checking everywhere
function addReport(...) external {
    require(whitelist[msg.sender], "Not whitelisted");
    // function code
}
```

#### 2. Event Logging
```solidity
// Good: Detailed events
event ReportAdded(
    uint256 indexed caseId,
    address indexed reporter,
    string severity,
    uint256 timestamp
);

emit ReportAdded(caseId, msg.sender, severity, block.timestamp);

// Bad: No events
```

#### 3. Gas Optimization
```solidity
// Good: Use mappings for O(1) lookup
mapping(uint256 => Report) private reportById;

// Bad: Iterate through array
for (uint256 i = 0; i < allReports.length; i++) {
    if (allReports[i].caseId == targetId) {
        return allReports[i];
    }
}
```

## 🧪 Testing Strategies

### Frontend Testing

```typescript
// Test component rendering
import { render, screen } from '@testing-library/react';

test('renders report card', () => {
  render(<ReportCard report={mockReport} />);
  expect(screen.getByText(mockReport.title)).toBeInTheDocument();
});

// Test hooks
test('useSwarakhsha returns correct functions', () => {
  const { result } = renderHook(() => useSwarakhsha());
  expect(result.current.addReport).toBeDefined();
  expect(result.current.getAllReports).toBeDefined();
});
```

### Backend Testing

```python
# test_main.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_query_endpoint():
    response = client.post(
        "/query",
        json={"query": "test", "context": "test"}
    )
    assert response.status_code == 200
```

### Smart Contract Testing

```solidity
// Test contract functions
function testAddReport() public {
    // Setup
    vm.prank(owner);
    contract.addUserToWhitelist(user);
    
    // Execute
    vm.prank(user);
    contract.addReport("Title", "Desc", ...);
    
    // Assert
    assertEq(contract.getTotalReports(), 1);
}
```

## 🔍 Debugging Tips

### Frontend Debugging

```typescript
// Use console.group for organized logs
console.group('Report Submission');
console.log('Data:', reportData);
console.log('User:', currentAccount);
console.groupEnd();

// Check component lifecycle
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);

// Debug network requests
fetch(url)
  .then(res => {
    console.log('Response status:', res.status);
    return res.json();
  })
  .then(data => console.log('Data:', data));
```

### Backend Debugging

```python
# Enable debug mode
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="debug")

# Add logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Debug requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.debug(f"Request: {request.method} {request.url}")
    response = await call_next(request)
    logger.debug(f"Response: {response.status_code}")
    return response
```

### Smart Contract Debugging

```bash
# Use forge console logs
forge test -vvvv  # Maximum verbosity

# Use debugger
forge test --debug <test_function>

# Check gas usage
forge test --gas-report
```

## 🚀 Performance Optimization

### Frontend Optimization

```typescript
// Use React.memo for expensive components
const ReportCard = React.memo(({ report }) => {
  return <div>{report.title}</div>;
});

// Lazy load components
const ReportDetails = lazy(() => import('./ReportDetails'));

// Use useMemo for expensive calculations
const filteredReports = useMemo(() => {
  return reports.filter(r => r.severity === 'High');
}, [reports]);

// Debounce search inputs
const debouncedSearch = debounce((value) => {
  search(value);
}, 300);
```

### Backend Optimization

```python
# Use async/await
async def fetch_data():
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.json()

# Cache frequently accessed data
from functools import lru_cache

@lru_cache(maxsize=100)
def get_config():
    # Expensive operation
    return config

# Use background tasks
from fastapi import BackgroundTasks

@app.post("/report")
async def add_report(background_tasks: BackgroundTasks):
    background_tasks.add_task(send_notification)
    return {"status": "success"}
```

### Smart Contract Optimization

```solidity
// Use uint256 instead of smaller types (except in structs)
uint256 public count;  // Good

// Pack struct variables
struct Report {
    uint128 timestamp;
    uint128 caseId;
    address reporter;
    // More storage efficient
}

// Use events instead of storing logs
event ReportAdded(uint256 indexed caseId, address reporter);
// Don't store in array if only needed for history
```

## 🔐 Security Best Practices

### Frontend Security

```typescript
// Sanitize user input
import DOMPurify from 'dompurify';

const sanitizedInput = DOMPurify.sanitize(userInput);

// Validate addresses
import { ethers } from 'ethers';

if (!ethers.isAddress(address)) {
  throw new Error('Invalid address');
}

// Never expose private keys
// ❌ WRONG
const privateKey = "0x123...";

// ✅ RIGHT
const privateKey = process.env.PRIVATE_KEY;
```

### Backend Security

```python
# Validate inputs
from pydantic import BaseModel, validator

class ReportRequest(BaseModel):
    title: str
    description: str
    
    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v

# Rate limiting
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/query")
@limiter.limit("10/minute")
async def query_endpoint():
    ...

# Use environment variables
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("OPENAI_API_KEY")
```

### Smart Contract Security

```solidity
// Check for reentrancy
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Swarakhsha is ReentrancyGuard {
    function addReport(...) external nonReentrant {
        // Safe from reentrancy
    }
}

// Use SafeMath for older Solidity versions
// (Not needed in 0.8+ with built-in overflow checks)

// Validate inputs
function addReport(string memory title, ...) external {
    require(bytes(title).length > 0, "Title required");
    require(bytes(title).length <= 200, "Title too long");
    ...
}
```

## 📝 Code Documentation

### JSDoc for TypeScript

```typescript
/**
 * Adds a new incident report to the blockchain
 * @param title - The report title
 * @param description - Brief description of the incident
 * @param severity - Severity level (High/Medium/Low)
 * @returns Promise resolving to transaction receipt
 * @throws Error if wallet not connected or not whitelisted
 */
async function addReport(
  title: string,
  description: string,
  severity: string
): Promise<TransactionReceipt> {
  // Implementation
}
```

### Docstrings for Python

```python
def process_report(data: dict) -> Report:
    """
    Process incident report data and create Report object.
    
    Args:
        data: Dictionary containing report information
        
    Returns:
        Report: Processed report object
        
    Raises:
        ValueError: If required fields are missing
        ValidationError: If data format is invalid
    """
    # Implementation
```

### NatSpec for Solidity

```solidity
/// @title Swarakhsha Incident Reporting Contract
/// @author Nirbhaya Team
/// @notice Store and retrieve incident reports on blockchain
/// @dev Implements whitelist access control

/// @notice Add new incident report
/// @dev Only whitelisted users can add reports
/// @param _title Report title
/// @param _description Brief description
/// @return caseId The unique case identifier
function addReport(
    string memory _title,
    string memory _description
) external onlyWhitelisted returns (uint256) {
    // Implementation
}
```

## 🛠️ Useful Commands

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-feature

# Commit with descriptive message
git commit -m "feat: add report filtering by severity"

# Rebase before merge
git fetch origin
git rebase origin/main

# Clean up branches
git branch -d feature/old-feature
```

### NPM Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "type-check": "tsc --noEmit",
    "format": "prettier --write ."
  }
}
```

### Foundry Commands

```bash
# Build contracts
forge build

# Run tests
forge test

# Run specific test
forge test --match-test testAddReport

# Check coverage
forge coverage

# Format code
forge fmt

# Update dependencies
forge update
```

## 📊 Monitoring in Development

### Frontend Monitoring

```typescript
// Track component renders
useEffect(() => {
  console.log('Component rendered', { props });
}, [props]);

// Monitor API calls
const api = {
  async call(endpoint, data) {
    const start = performance.now();
    const result = await fetch(endpoint, { body: JSON.stringify(data) });
    const duration = performance.now() - start;
    console.log(`API call to ${endpoint} took ${duration}ms`);
    return result;
  }
};
```

### Backend Monitoring

```python
# Track request duration
import time

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Log slow queries
if process_time > 1.0:
    logger.warning(f"Slow request: {request.url} took {process_time}s")
```

## 🎓 Learning Resources

- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com/
- **Solidity**: https://docs.soliditylang.org/
- **Foundry**: https://book.getfoundry.sh/
- **ethers.js**: https://docs.ethers.org/
- **Celo**: https://docs.celo.org/

---

**Happy Coding! 🚀**
