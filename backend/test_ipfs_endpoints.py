"""
Quick test script for IPFS + Blockchain endpoints
Run: python test_ipfs_endpoints.py
"""

import requests
import json
import os
from pathlib import Path

BASE_URL = "http://localhost:8000"

def test_health():
    """Test if backend is running"""
    try:
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ Backend is running")
            return True
        else:
            print("❌ Backend returned status:", response.status_code)
            return False
    except Exception as e:
        print(f"❌ Backend not accessible: {e}")
        print("💡 Start backend with: uvicorn main:app --reload --port 8000")
        return False

def test_upload_image():
    """Test image upload to IPFS"""
    print("\n📸 Testing image upload...")
    
    # Create a small test image (1x1 pixel PNG)
    test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    files = {'image': ('test_incident.png', test_image_data, 'image/png')}
    
    try:
        response = requests.post(f"{BASE_URL}/api/ipfs/upload-image", files=files)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Image uploaded successfully!")
            print(f"   CID: {data['cid']}")
            print(f"   URL: {data['gateway_url']}")
            return data['cid']
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_upload_metadata(image_cid):
    """Test metadata upload to IPFS"""
    print("\n📋 Testing metadata upload...")
    
    metadata = {
        "title": "Test Incident Report",
        "description": "This is a test incident for IPFS + Blockchain integration",
        "location": {
            "lat": 28.6139,
            "lng": 77.2090,
            "address": "Test Location, Delhi"
        },
        "images": [image_cid] if image_cid else [],
        "severity": "Medium",
        "timestamp": 1700000000000,
        "date": "17 Nov 2025",
        "reporter_address": "0x0000000000000000000000000000000000000000"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ipfs/upload-metadata",
            json=metadata
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Metadata uploaded successfully!")
            print(f"   CID: {data['cid']}")
            print(f"   URL: {data['gateway_url']}")
            return data['cid']
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_blockchain_submit(image_cid, metadata_cid):
    """Test blockchain submission (requires contract deployed)"""
    print("\n⛓️ Testing blockchain submission...")
    
    if not image_cid or not metadata_cid:
        print("⚠️ Skipping (missing CIDs)")
        return
    
    data = {
        "image_cid": image_cid,
        "metadata_cid": metadata_cid,
        "reporter_address": "0x0000000000000000000000000000000000000000"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ipfs/submit-to-blockchain",
            data=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Blockchain submission successful!")
            print(f"   Incident ID: {result['incident_id']}")
            print(f"   TX Hash: {result['tx_hash']}")
            print(f"   Explorer: {result['explorer_url']}")
        elif response.status_code == 500:
            print(f"⚠️ Blockchain not configured (expected)")
            print(f"   Set up contract deployment first (see IPFS_BLOCKCHAIN_SETUP.md)")
        else:
            print(f"❌ Submission failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_complete_workflow():
    """Test complete workflow endpoint"""
    print("\n🔄 Testing complete workflow...")
    
    # Create test image
    test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    
    metadata = {
        "title": "Complete Workflow Test",
        "description": "Testing the all-in-one endpoint",
        "location": {"lat": 28.6139, "lng": 77.2090, "address": "Delhi"},
        "images": [],
        "severity": "Low",
        "timestamp": 1700000000000,
        "date": "17 Nov 2025"
    }
    
    files = {'image': ('test.png', test_image_data, 'image/png')}
    data = {'metadata': json.dumps(metadata)}
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/ipfs/submit-incident-complete",
            files=files,
            data=data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Complete workflow successful!")
            print(f"   Image CID: {result['image_cid']}")
            print(f"   Metadata CID: {result['metadata_cid']}")
            print(f"   Image URL: {result['image_url']}")
            print(f"   Blockchain submitted: {result.get('blockchain_submitted', False)}")
            if result.get('tx_hash'):
                print(f"   TX Hash: {result['tx_hash']}")
        else:
            print(f"❌ Workflow failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("=" * 60)
    print("🧪 NIRBHAYA IPFS + Blockchain Endpoint Tests")
    print("=" * 60)
    
    # Check if backend is running
    if not test_health():
        return
    
    # Test individual endpoints
    image_cid = test_upload_image()
    metadata_cid = test_upload_metadata(image_cid)
    test_blockchain_submit(image_cid, metadata_cid)
    
    # Test complete workflow
    test_complete_workflow()
    
    print("\n" + "=" * 60)
    print("✅ Tests completed!")
    print("\n💡 Next steps:")
    print("1. Check .env file has WEB3_STORAGE_TOKEN")
    print("2. Deploy smart contract (see IPFS_BLOCKCHAIN_SETUP.md)")
    print("3. Add CONTRACT_ADDRESS to .env")
    print("4. Re-run tests to verify blockchain integration")
    print("=" * 60)

if __name__ == "__main__":
    main()
