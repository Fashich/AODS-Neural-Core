// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title AODSP2PLending
 * @dev Peer-to-Peer Lending Platform
 * - Collateralized loans
 * - Interest rate based on credit score
 * - Liquidation mechanism
 * - Insurance fund
 */
contract AODSP2PLending is ReentrancyGuard, AccessControl {
    using SafeMath for uint256;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

    IERC20 public lendingToken; // Token yang dipinjamkan (stablecoin)
    IERC20 public collateralToken; // Token jaminan

    // Loan struct
    struct Loan {
        address borrower;
        address lender;
        uint256 principal;
        uint256 collateral;
        uint256 interestRate; // Basis points (e.g., 1000 = 10%)
        uint256 duration; // In seconds
        uint256 startTime;
        uint256 dueDate;
        uint256 totalRepayment;
        uint256 repaidAmount;
        LoanStatus status;
    }

    enum LoanStatus { PENDING, ACTIVE, REPAID, DEFAULTED, LIQUIDATED }

    mapping(uint256 => Loan) public loans;
    mapping(address => uint256[]) public borrowerLoans;
    mapping(address => uint256[]) public lenderLoans;
    uint256 public loanCounter;

    // Credit score system
    mapping(address => uint256) public creditScores; // 0-1000
    mapping(address => uint256) public successfulRepayments;
    mapping(address => uint256) public defaults;

    // Collateral ratio
    uint256 public constant MIN_COLLATERAL_RATIO = 15000; // 150% (basis points)
    uint256 public constant LIQUIDATION_THRESHOLD = 12000; // 120%
    uint256 public constant LIQUIDATION_PENALTY = 1000; // 10%

    // Interest rates based on credit score
    uint256 public constant BASE_RATE = 500; // 5%
    uint256 public constant MAX_RATE = 3000; // 30%

    // Insurance fund
    uint256 public insuranceFund;
    uint256 public constant INSURANCE_FEE = 100; // 1% of loan

    // Lending pool
    mapping(address => uint256) public lenderDeposits;
    uint256 public totalPoolDeposits;
    uint256 public totalPoolLoans;

    // Events
    event LoanCreated(uint256 loanId, address borrower, uint256 principal, uint256 collateral);
    event LoanFunded(uint256 loanId, address lender);
    event LoanRepaid(uint256 loanId, uint256 amount);
    event LoanDefaulted(uint256 loanId);
    event LoanLiquidated(uint256 loanId, uint256 collateralSold);
    event DepositMade(address lender, uint256 amount);
    event WithdrawalMade(address lender, uint256 amount);
    event CreditScoreUpdated(address user, uint256 newScore);

    constructor(address _lendingToken, address _collateralToken) {
        lendingToken = IERC20(_lendingToken);
        collateralToken = IERC20(_collateralToken);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(LIQUIDATOR_ROLE, msg.sender);
    }

    // Credit score calculation
    function calculateInterestRate(address borrower) public view returns (uint256) {
        uint256 score = creditScores[borrower];
        
        if (score >= 800) return BASE_RATE; // 5% for excellent
        if (score >= 600) return BASE_RATE.add(500); // 10% for good
        if (score >= 400) return BASE_RATE.add(1000); // 15% for fair
        if (score >= 200) return BASE_RATE.add(1500); // 20% for poor
        return MAX_RATE; // 30% for very poor
    }

    function updateCreditScore(address user) internal {
        uint256 totalLoans = successfulRepayments[user].add(defaults[user]);
        if (totalLoans == 0) {
            creditScores[user] = 500; // Default score
            return;
        }

        uint256 successRate = successfulRepayments[user].mul(1000).div(totalLoans);
        creditScores[user] = successRate;
        
        emit CreditScoreUpdated(user, creditScores[user]);
    }

    // Deposit to lending pool
    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "P2P: Invalid amount");
        
        lendingToken.transferFrom(msg.sender, address(this), amount);
        lenderDeposits[msg.sender] = lenderDeposits[msg.sender].add(amount);
        totalPoolDeposits = totalPoolDeposits.add(amount);

        emit DepositMade(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "P2P: Invalid amount");
        require(lenderDeposits[msg.sender] >= amount, "P2P: Insufficient balance");
        require(
            totalPoolDeposits.sub(totalPoolLoans) >= amount,
            "P2P: Insufficient liquidity"
        );

        lenderDeposits[msg.sender] = lenderDeposits[msg.sender].sub(amount);
        totalPoolDeposits = totalPoolDeposits.sub(amount);
        lendingToken.transfer(msg.sender, amount);

        emit WithdrawalMade(msg.sender, amount);
    }

    // Create loan request
    function requestLoan(
        uint256 principal,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(principal > 0, "P2P: Invalid principal");
        require(duration > 0, "P2P: Invalid duration");

        uint256 interestRate = calculateInterestRate(msg.sender);
        uint256 interest = principal.mul(interestRate).mul(duration).div(365 days).div(10000);
        uint256 totalRepayment = principal.add(interest);
        
        // Calculate required collateral (150% of principal)
        uint256 collateralRequired = principal.mul(MIN_COLLATERAL_RATIO).div(10000);

        loanCounter++;
        uint256 loanId = loanCounter;

        loans[loanId] = Loan({
            borrower: msg.sender,
            lender: address(0),
            principal: principal,
            collateral: 0,
            interestRate: interestRate,
            duration: duration,
            startTime: 0,
            dueDate: 0,
            totalRepayment: totalRepayment,
            repaidAmount: 0,
            status: LoanStatus.PENDING
        });

        borrowerLoans[msg.sender].push(loanId);

        emit LoanCreated(loanId, msg.sender, principal, collateralRequired);
        return loanId;
    }

    // Fund loan with collateral
    function fundLoan(uint256 loanId, uint256 collateralAmount) external nonReentrant {
        Loan storage loan = loans[loanId];
        
        require(loan.borrower == msg.sender, "P2P: Not borrower");
        require(loan.status == LoanStatus.PENDING, "P2P: Invalid status");
        
        uint256 collateralRequired = loan.principal.mul(MIN_COLLATERAL_RATIO).div(10000);
        require(collateralAmount >= collateralRequired, "P2P: Insufficient collateral");

        // Transfer collateral
        collateralToken.transferFrom(msg.sender, address(this), collateralAmount);
        loan.collateral = collateralAmount;

        // Fund from pool
        require(totalPoolDeposits.sub(totalPoolLoans) >= loan.principal, "P2P: Insufficient pool");
        totalPoolLoans = totalPoolLoans.add(loan.principal);
        
        // Transfer principal to borrower
        lendingToken.transfer(msg.sender, loan.principal);

        // Update loan
        loan.lender = address(this); // Pool is lender
        loan.startTime = block.timestamp;
        loan.dueDate = block.timestamp.add(loan.duration);
        loan.status = LoanStatus.ACTIVE;

        emit LoanFunded(loanId, address(this));
    }

    // Repay loan
    function repayLoan(uint256 loanId, uint256 amount) external nonReentrant {
        Loan storage loan = loans[loanId];
        
        require(loan.borrower == msg.sender, "P2P: Not borrower");
        require(loan.status == LoanStatus.ACTIVE, "P2P: Not active");

        uint256 remaining = loan.totalRepayment.sub(loan.repaidAmount);
        uint256 payAmount = amount > remaining ? remaining : amount;

        lendingToken.transferFrom(msg.sender, address(this), payAmount);
        loan.repaidAmount = loan.repaidAmount.add(payAmount);

        if (loan.repaidAmount >= loan.totalRepayment) {
            // Loan fully repaid
            loan.status = LoanStatus.REPAID;
            totalPoolLoans = totalPoolLoans.sub(loan.principal);
            
            // Return collateral
            collateralToken.transfer(loan.borrower, loan.collateral);
            
            // Update credit score
            successfulRepayments[loan.borrower]++;
            updateCreditScore(loan.borrower);
        }

        emit LoanRepaid(loanId, payAmount);
    }

    // Check if loan can be liquidated
    function canLiquidate(uint256 loanId) public view returns (bool) {
        Loan storage loan = loans[loanId];
        
        if (loan.status != LoanStatus.ACTIVE) return false;
        if (block.timestamp > loan.dueDate) return true;

        // Check collateral ratio
        uint256 collateralValue = getCollateralValue(loan.collateral);
        uint256 requiredCollateral = loan.principal.mul(LIQUIDATION_THRESHOLD).div(10000);
        
        return collateralValue < requiredCollateral;
    }

    function getCollateralValue(uint256 collateralAmount) public view returns (uint256) {
        // In production, use Chainlink price feed
        // For now, assume 1:1 ratio
        return collateralAmount;
    }

    // Liquidate loan
    function liquidateLoan(uint256 loanId) external nonReentrant onlyRole(LIQUIDATOR_ROLE) {
        require(canLiquidate(loanId), "P2P: Cannot liquidate");

        Loan storage loan = loans[loanId];
        loan.status = LoanStatus.LIQUIDATED;

        // Calculate penalty
        uint256 penalty = loan.collateral.mul(LIQUIDATION_PENALTY).div(10000);
        uint256 liquidatorReward = penalty.div(2);
        uint256 insuranceContribution = penalty.sub(liquidatorReward);

        // Transfer reward to liquidator
        collateralToken.transfer(msg.sender, liquidatorReward);
        
        // Add to insurance fund
        insuranceFund = insuranceFund.add(insuranceContribution);

        // Sell remaining collateral to cover loan
        uint256 remainingCollateral = loan.collateral.sub(penalty);
        // In production: swap collateral for lending token
        
        totalPoolLoans = totalPoolLoans.sub(loan.principal);
        
        // Update credit score
        defaults[loan.borrower]++;
        updateCreditScore(loan.borrower);

        emit LoanLiquidated(loanId, remainingCollateral);
    }

    // Claim insurance for defaulted loan
    function claimInsurance(uint256 loanId) external onlyRole(ADMIN_ROLE) {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.DEFAULTED, "P2P: Not defaulted");
        
        uint256 claimAmount = loan.principal.sub(loan.repaidAmount);
        require(insuranceFund >= claimAmount, "P2P: Insufficient insurance");

        insuranceFund = insuranceFund.sub(claimAmount);
        // Compensate lenders
    }

    // View functions
    function getLoan(uint256 loanId) external view returns (Loan memory) {
        return loans[loanId];
    }

    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    function getLenderLoans(address lender) external view returns (uint256[] memory) {
        return lenderLoans[lender];
    }

    function getPoolInfo() external view returns (
        uint256 totalDeposits,
        uint256 totalLoans,
        uint256 availableLiquidity,
        uint256 insuranceFundAmount
    ) {
        return (
            totalPoolDeposits,
            totalPoolLoans,
            totalPoolDeposits.sub(totalPoolLoans),
            insuranceFund
        );
    }
}
