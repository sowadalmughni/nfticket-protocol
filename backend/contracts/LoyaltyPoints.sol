// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LoyaltyPoints
 * @dev Non-tradeable (soulbound) loyalty points for NFTicket Protocol
 * Users earn points through ticket purchases, attendance, and POAP collection
 * Points can be redeemed for discounts, exclusive access, and perks
 * @author Sowad Al-Mughni
 */
contract LoyaltyPoints is AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    // Token metadata
    string public name = "NFTicket Loyalty Points";
    string public symbol = "NTLP";
    uint8 public constant decimals = 0; // Points are whole numbers

    // Points balances
    mapping(address => uint256) private _balances;
    uint256 private _totalSupply;

    // Points earning rates (configurable by admin)
    uint256 public pointsPerTicketPurchase = 100;
    uint256 public pointsPerAttendance = 50;
    uint256 public pointsPerPOAP = 25;
    uint256 public pointsPerReferral = 200;

    // Tier thresholds
    struct Tier {
        string name;
        uint256 threshold;
        uint256 discountBps; // Basis points (100 = 1%)
    }

    Tier[] public tiers;
    
    // Earning history for transparency
    struct EarningRecord {
        uint256 amount;
        string reason;
        uint256 timestamp;
    }
    mapping(address => EarningRecord[]) private _earningHistory;

    // Redemption records
    struct RedemptionRecord {
        uint256 amount;
        string reward;
        uint256 timestamp;
    }
    mapping(address => RedemptionRecord[]) private _redemptionHistory;

    // Events
    event PointsEarned(address indexed user, uint256 amount, string reason);
    event PointsRedeemed(address indexed user, uint256 amount, string reward);
    event TierReached(address indexed user, string tierName, uint256 threshold);
    event EarningRatesUpdated(
        uint256 ticketPurchase,
        uint256 attendance,
        uint256 poap,
        uint256 referral
    );

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(BURNER_ROLE, admin);

        // Initialize default tiers
        tiers.push(Tier("Bronze", 0, 0));
        tiers.push(Tier("Silver", 500, 500)); // 5% discount
        tiers.push(Tier("Gold", 2000, 1000)); // 10% discount
        tiers.push(Tier("Platinum", 5000, 1500)); // 15% discount
        tiers.push(Tier("Diamond", 10000, 2500)); // 25% discount
    }

    // ============ View Functions ============

    /**
     * @dev Returns the points balance of an account
     */
    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    /**
     * @dev Returns the total supply of points
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Get user's current tier
     */
    function getTier(address user) public view returns (string memory tierName, uint256 discountBps) {
        uint256 balance = _balances[user];
        
        for (uint256 i = tiers.length; i > 0; i--) {
            if (balance >= tiers[i - 1].threshold) {
                return (tiers[i - 1].name, tiers[i - 1].discountBps);
            }
        }
        
        return (tiers[0].name, tiers[0].discountBps);
    }

    /**
     * @dev Get user's tier index (0-based)
     */
    function getTierIndex(address user) public view returns (uint256) {
        uint256 balance = _balances[user];
        
        for (uint256 i = tiers.length; i > 0; i--) {
            if (balance >= tiers[i - 1].threshold) {
                return i - 1;
            }
        }
        
        return 0;
    }

    /**
     * @dev Get all tiers
     */
    function getAllTiers() public view returns (Tier[] memory) {
        return tiers;
    }

    /**
     * @dev Get points until next tier
     */
    function pointsToNextTier(address user) public view returns (uint256 needed, string memory nextTierName) {
        uint256 balance = _balances[user];
        uint256 currentTierIdx = getTierIndex(user);

        if (currentTierIdx >= tiers.length - 1) {
            return (0, "Max Tier");
        }

        Tier memory nextTier = tiers[currentTierIdx + 1];
        return (nextTier.threshold - balance, nextTier.name);
    }

    /**
     * @dev Get earning history for a user
     */
    function getEarningHistory(address user, uint256 limit) public view returns (EarningRecord[] memory) {
        EarningRecord[] storage history = _earningHistory[user];
        uint256 count = limit > history.length ? history.length : limit;
        
        EarningRecord[] memory result = new EarningRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = history[history.length - 1 - i]; // Most recent first
        }
        
        return result;
    }

    /**
     * @dev Get redemption history for a user
     */
    function getRedemptionHistory(address user, uint256 limit) public view returns (RedemptionRecord[] memory) {
        RedemptionRecord[] storage history = _redemptionHistory[user];
        uint256 count = limit > history.length ? history.length : limit;
        
        RedemptionRecord[] memory result = new RedemptionRecord[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = history[history.length - 1 - i]; // Most recent first
        }
        
        return result;
    }

    // ============ Minting Functions ============

    /**
     * @dev Award points to a user
     * @param to Recipient address
     * @param amount Points to award
     * @param reason Reason for earning (for transparency)
     */
    function awardPoints(
        address to,
        uint256 amount,
        string memory reason
    ) external onlyRole(MINTER_ROLE) nonReentrant {
        require(to != address(0), "Invalid address");
        require(amount > 0, "Amount must be positive");

        uint256 previousTierIdx = getTierIndex(to);

        _balances[to] += amount;
        _totalSupply += amount;

        _earningHistory[to].push(EarningRecord({
            amount: amount,
            reason: reason,
            timestamp: block.timestamp
        }));

        emit PointsEarned(to, amount, reason);

        // Check for tier upgrade
        uint256 newTierIdx = getTierIndex(to);
        if (newTierIdx > previousTierIdx) {
            emit TierReached(to, tiers[newTierIdx].name, tiers[newTierIdx].threshold);
        }
    }

    /**
     * @dev Award points for ticket purchase
     */
    function awardForTicketPurchase(address to) external onlyRole(MINTER_ROLE) {
        _awardWithReason(to, pointsPerTicketPurchase, "Ticket Purchase");
    }

    /**
     * @dev Award points for event attendance
     */
    function awardForAttendance(address to) external onlyRole(MINTER_ROLE) {
        _awardWithReason(to, pointsPerAttendance, "Event Attendance");
    }

    /**
     * @dev Award points for POAP claim
     */
    function awardForPOAP(address to) external onlyRole(MINTER_ROLE) {
        _awardWithReason(to, pointsPerPOAP, "POAP Claimed");
    }

    /**
     * @dev Award points for referral
     */
    function awardForReferral(address referrer, address referred) external onlyRole(MINTER_ROLE) {
        _awardWithReason(referrer, pointsPerReferral, "Referral Bonus");
        _awardWithReason(referred, pointsPerReferral / 2, "Referred Bonus");
    }

    function _awardWithReason(address to, uint256 amount, string memory reason) internal {
        require(to != address(0), "Invalid address");

        uint256 previousTierIdx = getTierIndex(to);

        _balances[to] += amount;
        _totalSupply += amount;

        _earningHistory[to].push(EarningRecord({
            amount: amount,
            reason: reason,
            timestamp: block.timestamp
        }));

        emit PointsEarned(to, amount, reason);

        uint256 newTierIdx = getTierIndex(to);
        if (newTierIdx > previousTierIdx) {
            emit TierReached(to, tiers[newTierIdx].name, tiers[newTierIdx].threshold);
        }
    }

    // ============ Redemption Functions ============

    /**
     * @dev Redeem points for a reward
     * @param amount Points to redeem
     * @param reward Description of the reward
     */
    function redeemPoints(
        uint256 amount,
        string memory reward
    ) external nonReentrant {
        require(_balances[msg.sender] >= amount, "Insufficient points");
        require(amount > 0, "Amount must be positive");

        _balances[msg.sender] -= amount;
        _totalSupply -= amount;

        _redemptionHistory[msg.sender].push(RedemptionRecord({
            amount: amount,
            reward: reward,
            timestamp: block.timestamp
        }));

        emit PointsRedeemed(msg.sender, amount, reward);
    }

    /**
     * @dev Burn points from a user (admin function for corrections)
     */
    function burnPoints(
        address from,
        uint256 amount,
        string memory reason
    ) external onlyRole(BURNER_ROLE) {
        require(_balances[from] >= amount, "Insufficient points");

        _balances[from] -= amount;
        _totalSupply -= amount;

        _redemptionHistory[from].push(RedemptionRecord({
            amount: amount,
            reward: reason,
            timestamp: block.timestamp
        }));

        emit PointsRedeemed(from, amount, reason);
    }

    // ============ Admin Functions ============

    /**
     * @dev Update earning rates
     */
    function setEarningRates(
        uint256 ticketPurchase,
        uint256 attendance,
        uint256 poap,
        uint256 referral
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pointsPerTicketPurchase = ticketPurchase;
        pointsPerAttendance = attendance;
        pointsPerPOAP = poap;
        pointsPerReferral = referral;

        emit EarningRatesUpdated(ticketPurchase, attendance, poap, referral);
    }

    /**
     * @dev Add a new tier
     */
    function addTier(
        string memory tierName,
        uint256 threshold,
        uint256 discountBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(discountBps <= 10000, "Discount cannot exceed 100%");
        tiers.push(Tier(tierName, threshold, discountBps));
    }

    /**
     * @dev Update a tier
     */
    function updateTier(
        uint256 index,
        string memory tierName,
        uint256 threshold,
        uint256 discountBps
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(index < tiers.length, "Invalid tier index");
        require(discountBps <= 10000, "Discount cannot exceed 100%");
        
        tiers[index] = Tier(tierName, threshold, discountBps);
    }

    // ============ Transfer Prevention ============

    /**
     * @dev Points are non-tradeable (soulbound)
     * These functions always revert to prevent transfers
     */
    function transfer(address, uint256) external pure returns (bool) {
        revert("Points are non-transferable");
    }

    function transferFrom(address, address, uint256) external pure returns (bool) {
        revert("Points are non-transferable");
    }

    function approve(address, uint256) external pure returns (bool) {
        revert("Points are non-transferable");
    }

    function allowance(address, address) external pure returns (uint256) {
        return 0;
    }
}
