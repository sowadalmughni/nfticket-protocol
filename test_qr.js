const axios = require('axios');

async function testRotatingQR() {
  const API_URL = 'http://localhost:3001';

  try {
    console.log("1. Requesting Ticket Proof (Frontend -> Backend)...");
    const proofResponse = await axios.post(`${API_URL}/generate-proof`, {
      tokenId: 123,
      owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" // Valid Hardhat Account #0
    });
    
    const { data, signature } = proofResponse.data;
    console.log("   ✅ Proof Received!");
    console.log("   Timestamp:", data.timestamp);
    console.log("   Signature:", signature.substring(0, 20) + "...");

    console.log("\n2. Verifying Proof (Mobile App -> Validator API)...");
    const verifyResponse = await axios.post(`${API_URL}/verify`, {
      data,
      signature
    });

    console.log("   ✅ Verification Result:", verifyResponse.data);

  } catch (error) {
    console.error("❌ Test Failed:", error.response ? error.response.data : error.message);
  }
}

testRotatingQR();
