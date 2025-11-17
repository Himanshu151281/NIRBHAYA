"""Check Ganache connection and contract status"""
from web3 import Web3
from dotenv import load_dotenv
import os

load_dotenv()

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
account = "0xF35CcD5828C13Aa8f7E685D117d6251a82a985a1"
contract_address = os.getenv("INCIDENT_REGISTRY_CONTRACT_ADDRESS")

print(f"\n{'='*60}")
print(f"GANACHE STATUS CHECK")
print(f"{'='*60}")
print(f"✅ Connected: {w3.is_connected()}")
print(f"Network ID: {w3.eth.chain_id}")
print(f"\n📍 Account: {account}")
print(f"Balance: {w3.eth.get_balance(account) / 10**18} ETH")

print(f"\n📄 Contract: {contract_address}")
code = w3.eth.get_code(contract_address)
print(f"Has Code: {len(code) > 0}")
print(f"Code Length: {len(code)} bytes")

if len(code) == 0:
    print(f"\n❌ CONTRACT NOT DEPLOYED!")
    print(f"You need to deploy the contract first.")
else:
    print(f"\n✅ Contract is deployed and ready!")
print(f"{'='*60}\n")
