# Security Policy

**Author:** Md. Sowad Al-Mughni  
**Maintained By:** Kitalon Labs

Reference for security procedures and vulnerability reporting for the NFTicket Protocol.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our smart contracts and user data extremely seriously. If you have discovered a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

### Process

1.  **Do not** open a public GitHub issue.
2.  Email full details to **sowad@kitalonlabs.com**.
3.  Include a Proof of Concept (PoC) if possible (e.g., a Hardhat test case demonstrating the exploit).

### Response Timeline

*   **Acknowledgement:** Within 24 hours.
*   **Assessment:** Within 72 hours.
*   **Fix/Patch:** Timeline will be communicated based on severity.

## Scope

### In Scope
*   Smart Contract Logic Errors (e.g., reentrancy, integer overflow/underflow, access control bypass).
*   Validator API Authentication Bypasses.
*   Wallet Key Leakage via Mobile App Logs.

### Out of Scope
*   Phishing attacks against users.
*   Issues related to third-party dependencies (unless immediate mitigation is required).
*   DDoS attacks on the demo dashboard.

## Security Audits

*   *No external audits have been completed for v1.0.0 yet.*
*   Internal audit performed by Kitalon Labs Team (Jan 2026).

---
**Note:** Mainnet deployment involves real funds. While we strive for perfection, always use your own judgment and verify the verified contract source code on Etherscan before interacting.
