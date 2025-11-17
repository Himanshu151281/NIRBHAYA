from web3 import Web3
from dotenv import load_dotenv
import os

load_dotenv()

w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:7545'))
account = '0xd749aba0590D86a682fFEfa6C7F98AE8498E7Dd4'
balance = w3.eth.get_balance(account)

print(f'\n✅ Relayer Account: {account}')
print(f'✅ Balance: {w3.from_wei(balance, "ether")} ETH')
print(f'✅ Connected: {w3.is_connected()}')
print(f'✅ Chain ID: {w3.eth.chain_id}')
print(f'✅ Latest Block: {w3.eth.block_number}')
print(f'✅ Contract: {os.getenv("INCIDENT_REGISTRY_CONTRACT_ADDRESS")}')
