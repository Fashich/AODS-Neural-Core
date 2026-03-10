// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title AODSICO
 * @dev Initial Coin Offering (ICO) / Initial Exchange Offering (IEO) Contract
 * - Token sale with multiple rounds
 * - Whitelist functionality
 * - Vesting schedule
 * - Refund mechanism
 */
contract AODSICO is ReentrancyGuard, AccessControl {
    using SafeMath for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant WHITELIST_ROLE = keccak256("WHITELIST_ROLE");

    IERC20 public token;
    address public wallet; // Fund receiving wallet

    // Sale rounds
    enum RoundType { SEED, PRIVATE, PUBLIC }
    
    struct SaleRound {
        RoundType roundType;
        uint256 startTime;
        uint256 endTime;
        uint256 tokenPrice; // In wei per token
        uint256 tokensForSale;
        uint256 tokensSold;
        uint256 minPurchase;
        uint256 maxPurchase;
        bool active;
    }

    mapping(RoundType => SaleRound) public saleRounds;
    mapping(address => mapping(RoundType => uint256)) public purchasedAmount;
    mapping(address => bool) public whitelist;
    mapping(address => bool) public kycVerified;

    // Vesting
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliff;
        uint256 duration;
        uint256 interval;
    }

    mapping(address => VestingSchedule) public vestingSchedules;

    // Refund
    mapping(address => uint256) public refundableAmount;
    bool public refundEnabled;
    uint256 public refundDeadline;

    // Statistics
    uint256 public totalRaised;
    uint256 public totalTokensSold;
    uint256 public totalContributors;

    // Events
    event RoundCreated(RoundType roundType, uint256 startTime, uint256 endTime, uint256 price);
    event TokensPurchased(address indexed buyer, RoundType roundType, uint256 amount, uint256 cost);
    event WhitelistAdded(address indexed account);
    event WhitelistRemoved(address indexed account);
    event KYCVerified(address indexed account);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event RefundClaimed(address indexed account, uint256 amount);
    event RoundFinalized(RoundType roundType, uint256 tokensSold, uint256 ethRaised);

    constructor(
        address _token,
        address _wallet
    ) {
        require(_token != address(0), "AODSICO: Invalid token address");
        require(_wallet != address(0), "AODSICO: Invalid wallet address");

        token = IERC20(_token);
        wallet = _wallet;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // Round management
    function createRound(
        RoundType roundType,
        uint256 startTime,
        uint256 endTime,
        uint256 tokenPrice,
        uint256 tokensForSale,
        uint256 minPurchase,
        uint256 maxPurchase
    ) external onlyRole(ADMIN_ROLE) {
        require(startTime > block.timestamp, "AODSICO: Start time must be in future");
        require(endTime > startTime, "AODSICO: End time must be after start");
        require(tokenPrice > 0, "AODSICO: Invalid price");
        require(tokensForSale > 0, "AODSICO: Invalid token amount");

        saleRounds[roundType] = SaleRound({
            roundType: roundType,
            startTime: startTime,
            endTime: endTime,
            tokenPrice: tokenPrice,
            tokensForSale: tokensForSale,
            tokensSold: 0,
            minPurchase: minPurchase,
            maxPurchase: maxPurchase,
            active: true
        });

        emit RoundCreated(roundType, startTime, endTime, tokenPrice);
    }

    function updateRound(
        RoundType roundType,
        uint256 startTime,
        uint256 endTime,
        uint256 tokenPrice
    ) external onlyRole(ADMIN_ROLE) {
        SaleRound storage round = saleRounds[roundType];
        require(round.active, "AODSICO: Round not active");

        round.startTime = startTime;
        round.endTime = endTime;
        round.tokenPrice = tokenPrice;
    }

    // Whitelist management
    function addToWhitelist(address[] calldata accounts) external onlyRole(ADMIN_ROLE) {
        for (uint i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = true;
            emit WhitelistAdded(accounts[i]);
        }
    }

    function removeFromWhitelist(address[] calldata accounts) external onlyRole(ADMIN_ROLE) {
        for (uint i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = false;
            emit WhitelistRemoved(accounts[i]);
        }
    }

    // KYC verification
    function verifyKYC(address account) external onlyRole(ADMIN_ROLE) {
        kycVerified[account] = true;
        emit KYCVerified(account);
    }

    // Token purchase
    function buyTokens(RoundType roundType) external payable nonReentrant {
        SaleRound storage round = saleRounds[roundType];
        
        require(round.active, "AODSICO: Round not active");
        require(block.timestamp >= round.startTime, "AODSICO: Round not started");
        require(block.timestamp <= round.endTime, "AODSICO: Round ended");
        require(kycVerified[msg.sender], "AODSICO: KYC not verified");

        // Whitelist check for seed and private rounds
        if (roundType != RoundType.PUBLIC) {
            require(whitelist[msg.sender], "AODSICO: Not whitelisted");
        }

        uint256 tokenAmount = msg.value.mul(1e18).div(round.tokenPrice);
        
        require(tokenAmount >= round.minPurchase, "AODSICO: Below minimum");
        require(tokenAmount <= round.maxPurchase, "AODSICO: Above maximum");
        require(
            purchasedAmount[msg.sender][roundType].add(tokenAmount) <= round.maxPurchase,
            "AODSICO: Exceeds max purchase"
        );
        require(round.tokensSold.add(tokenAmount) <= round.tokensForSale, "AODSICO: Not enough tokens");

        // Update state
        round.tokensSold = round.tokensSold.add(tokenAmount);
        purchasedAmount[msg.sender][roundType] = purchasedAmount[msg.sender][roundType].add(tokenAmount);
        totalRaised = totalRaised.add(msg.value);
        totalTokensSold = totalTokensSold.add(tokenAmount);

        if (purchasedAmount[msg.sender][roundType] == tokenAmount) {
            totalContributors = totalContributors.add(1);
        }

        // Create vesting schedule
        _createVesting(msg.sender, tokenAmount, roundType);

        // Transfer ETH to wallet
        payable(wallet).transfer(msg.value);

        emit TokensPurchased(msg.sender, roundType, tokenAmount, msg.value);
    }

    function _createVesting(address beneficiary, uint256 amount, RoundType roundType) internal {
        uint256 cliff;
        uint256 duration;
        uint256 interval;

        if (roundType == RoundType.SEED) {
            cliff = 180 days; // 6 months cliff
            duration = 730 days; // 2 years
            interval = 30 days; // Monthly
        } else if (roundType == RoundType.PRIVATE) {
            cliff = 90 days; // 3 months cliff
            duration = 365 days; // 1 year
            interval = 30 days; // Monthly
        } else {
            cliff = 0; // No cliff for public
            duration = 180 days; // 6 months
            interval = 7 days; // Weekly
        }

        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: vestingSchedules[beneficiary].totalAmount.add(amount),
            releasedAmount: 0,
            startTime: block.timestamp,
            cliff: cliff,
            duration: duration,
            interval: interval
        });
    }

    // Vesting release
    function releaseTokens() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "AODSICO: No vesting schedule");

        uint256 releasable = calculateReleasable(msg.sender);
        require(releasable > 0, "AODSICO: No tokens to release");

        schedule.releasedAmount = schedule.releasedAmount.add(releasable);
        token.transfer(msg.sender, releasable);

        emit TokensReleased(msg.sender, releasable);
    }

    function calculateReleasable(address beneficiary) public view returns (uint256) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0) return 0;
        if (block.timestamp < schedule.startTime.add(schedule.cliff)) return 0;

        uint256 elapsed = block.timestamp.sub(schedule.startTime);
        if (elapsed >= schedule.duration) {
            return schedule.totalAmount.sub(schedule.releasedAmount);
        }

        uint256 vestedAmount = schedule.totalAmount.mul(elapsed).div(schedule.duration);
        return vestedAmount.sub(schedule.releasedAmount);
    }

    // Refund mechanism
    function enableRefund(uint256 deadline) external onlyRole(ADMIN_ROLE) {
        require(deadline > block.timestamp, "AODSICO: Invalid deadline");
        refundEnabled = true;
        refundDeadline = deadline;
    }

    function claimRefund() external nonReentrant {
        require(refundEnabled, "AODSICO: Refund not enabled");
        require(block.timestamp <= refundDeadline, "AODSICO: Refund period ended");
        
        uint256 refundAmount = refundableAmount[msg.sender];
        require(refundAmount > 0, "AODSICO: No refund available");

        refundableAmount[msg.sender] = 0;
        payable(msg.sender).transfer(refundAmount);

        emit RefundClaimed(msg.sender, refundAmount);
    }

    // Finalize round
    function finalizeRound(RoundType roundType) external onlyRole(ADMIN_ROLE) {
        SaleRound storage round = saleRounds[roundType];
        require(round.active, "AODSICO: Round not active");
        require(block.timestamp > round.endTime, "AODSICO: Round not ended");

        round.active = false;

        emit RoundFinalized(roundType, round.tokensSold, round.tokensSold.mul(round.tokenPrice).div(1e18));
    }

    // View functions
    function getRoundInfo(RoundType roundType) external view returns (SaleRound memory) {
        return saleRounds[roundType];
    }

    function getPurchasedAmount(address buyer, RoundType roundType) external view returns (uint256) {
        return purchasedAmount[buyer][roundType];
    }

    function getVestingInfo(address beneficiary) external view returns (VestingSchedule memory) {
        return vestingSchedules[beneficiary];
    }

    // Emergency functions
    function emergencyWithdrawTokens(uint256 amount) external onlyRole(ADMIN_ROLE) {
        token.transfer(wallet, amount);
    }

    function emergencyWithdrawETH(uint256 amount) external onlyRole(ADMIN_ROLE) {
        payable(wallet).transfer(amount);
    }

    receive() external payable {
        revert("AODSICO: Use buyTokens function");
    }
}
