// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title AODSToken
 * @dev ERC20 Token for AODS Ecosystem
 * - Governance token
 * - Payment token
 * - Staking rewards
 */
contract AODSToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ERC20Permit {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion tokens
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10**18; // 100 Million initial

    // Token distribution
    uint256 public teamAllocation = 150_000_000 * 10**18;
    uint256 public ecosystemAllocation = 300_000_000 * 10**18;
    uint256 public stakingAllocation = 200_000_000 * 10**18;
    uint256 public publicSaleAllocation = 350_000_000 * 10**18;

    // Vesting
    mapping(address => uint256) public vestedAmount;
    mapping(address => uint256) public vestingStart;
    mapping(address => uint256) public vestingDuration;

    event TokensVested(address indexed beneficiary, uint256 amount, uint256 start, uint256 duration);
    event TokensReleased(address indexed beneficiary, uint256 amount);

    constructor(
        address teamWallet,
        address ecosystemWallet,
        address stakingWallet,
        address publicSaleWallet
    ) ERC20("AODS Token", "AODS") ERC20Permit("AODS Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        // Mint initial supply
        _mint(teamWallet, teamAllocation);
        _mint(ecosystemWallet, ecosystemAllocation);
        _mint(stakingWallet, stakingAllocation);
        _mint(publicSaleWallet, publicSaleAllocation);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "AODS: Max supply exceeded");
        _mint(to, amount);
    }

    function burn(uint256 amount) public override onlyRole(BURNER_ROLE) {
        super.burn(amount);
    }

    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Vesting functionality
    function createVesting(
        address beneficiary,
        uint256 amount,
        uint256 duration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(balanceOf(msg.sender) >= amount, "AODS: Insufficient balance");
        
        vestedAmount[beneficiary] = amount;
        vestingStart[beneficiary] = block.timestamp;
        vestingDuration[beneficiary] = duration;

        _transfer(msg.sender, address(this), amount);
        
        emit TokensVested(beneficiary, amount, block.timestamp, duration);
    }

    function releaseVestedTokens() external {
        uint256 releasable = calculateReleasable(msg.sender);
        require(releasable > 0, "AODS: No tokens to release");

        vestedAmount[msg.sender] -= releasable;
        _transfer(address(this), msg.sender, releasable);

        emit TokensReleased(msg.sender, releasable);
    }

    function calculateReleasable(address beneficiary) public view returns (uint256) {
        if (vestedAmount[beneficiary] == 0) return 0;
        
        uint256 elapsed = block.timestamp - vestingStart[beneficiary];
        if (elapsed >= vestingDuration[beneficiary]) {
            return vestedAmount[beneficiary];
        }
        
        return (vestedAmount[beneficiary] * elapsed) / vestingDuration[beneficiary];
    }

    // Staking functionality
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingStart;
    uint256 public constant REWARD_RATE = 100; // 10% APR (basis points)

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount, uint256 reward);

    function stake(uint256 amount) external whenNotPaused {
        require(amount > 0, "AODS: Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "AODS: Insufficient balance");

        _transfer(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        stakingStart[msg.sender] = block.timestamp;

        emit Staked(msg.sender, amount);
    }

    function unstake() external whenNotPaused {
        uint256 amount = stakedBalance[msg.sender];
        require(amount > 0, "AODS: No staked tokens");

        uint256 reward = calculateReward(msg.sender);
        stakedBalance[msg.sender] = 0;

        _transfer(address(this), msg.sender, amount);
        if (reward > 0) {
            _mint(msg.sender, reward);
        }

        emit Unstaked(msg.sender, amount, reward);
    }

    function calculateReward(address user) public view returns (uint256) {
        if (stakedBalance[user] == 0) return 0;
        
        uint256 stakingPeriod = block.timestamp - stakingStart[user];
        uint256 annualReward = (stakedBalance[user] * REWARD_RATE) / 1000;
        
        return (annualReward * stakingPeriod) / 365 days;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
