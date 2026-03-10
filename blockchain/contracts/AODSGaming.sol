// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title AODSGaming
 * @dev Gaming & Esports platform with tournaments, leaderboards, rewards
 * Features: tournaments, player stats, team management, prize distribution
 */
contract AODSGaming is 
    AccessControlUpgradeable, 
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable 
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant TOURNAMENT_ORGANIZER_ROLE = keccak256("TOURNAMENT_ORGANIZER_ROLE");
    bytes32 public constant GAME_MASTER_ROLE = keccak256("GAME_MASTER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    enum TournamentType { SINGLE_ELIMINATION, DOUBLE_ELIMINATION, ROUND_ROBIN, SWISS, BATTLE_ROYALE }
    enum TournamentStatus { PENDING, REGISTRATION, ACTIVE, PAUSED, COMPLETED, CANCELLED }
    enum GameType { FPS, MOBA, RTS, SPORTS, RACING, FIGHTING, BATTLE_ROYALE, CARD, PUZZLE, RPG }

    struct Tournament {
        uint256 tournamentId;
        string name;
        string description;
        GameType gameType;
        TournamentType tournamentType;
        TournamentStatus status;
        uint256 entryFee;
        uint256 prizePool;
        uint256 maxParticipants;
        uint256 currentParticipants;
        uint256 registrationStart;
        uint256 registrationEnd;
        uint256 tournamentStart;
        uint256 tournamentEnd;
        address organizer;
        address[] participants;
        mapping(address => bool) isParticipant;
        mapping(uint256 => Match) matches;
        uint256 matchCount;
        uint256[] prizeDistribution;
        address tokenAddress;
        string metadataCID;
        bool prizesDistributed;
    }

    struct Match {
        uint256 matchId;
        uint256 tournamentId;
        address player1;
        address player2;
        address winner;
        uint256 score1;
        uint256 score2;
        uint256 scheduledTime;
        uint256 completedTime;
        bool isCompleted;
        string proofCID;
    }

    struct Player {
        address playerAddress;
        string gamerTag;
        string profileCID;
        uint256 totalMatches;
        uint256 wins;
        uint256 losses;
        uint256 draws;
        uint256 totalEarnings;
        uint256 ranking;
        uint256 reputation;
        bool isActive;
        uint256 registeredAt;
    }

    struct Team {
        uint256 teamId;
        string name;
        string logoCID;
        address captain;
        address[] members;
        mapping(address => bool) isMember;
        uint256 wins;
        uint256 losses;
        uint256 totalEarnings;
        bool isActive;
        uint256 createdAt;
    }

    struct Achievement {
        uint256 achievementId;
        string name;
        string description;
        string imageCID;
        uint256 rarity;
        uint256 totalMinted;
    }

    struct PlayerAchievement {
        uint256 achievementId;
        uint256 earnedAt;
        uint256 tokenId;
    }

    // Mappings
    mapping(uint256 => Tournament) public tournaments;
    mapping(address => Player) public players;
    mapping(uint256 => Team) public teams;
    mapping(uint256 => Achievement) public achievements;
    mapping(address => mapping(uint256 => PlayerAchievement)) public playerAchievements;
    mapping(address => uint256[]) public playerTournaments;
    mapping(address => uint256) public playerTeam;
    mapping(uint256 => address[]) public tournamentLeaderboard;
    mapping(address => mapping(GameType => uint256)) public playerGameStats;

    // Counters
    uint256 public tournamentCounter;
    uint256 public teamCounter;
    uint256 public achievementCounter;

    // Token contracts
    IERC20 public aodsToken;
    IERC721 public achievementNFT;

    // Events
    event TournamentCreated(uint256 indexed tournamentId, string name, GameType gameType, uint256 prizePool);
    event TournamentStarted(uint256 indexed tournamentId, uint256 startTime);
    event TournamentCompleted(uint256 indexed tournamentId, address winner);
    event PlayerRegistered(address indexed player, string gamerTag);
    event PlayerJoinedTournament(uint256 indexed tournamentId, address indexed player);
    event MatchCompleted(uint256 indexed tournamentId, uint256 indexed matchId, address winner);
    event PrizeDistributed(uint256 indexed tournamentId, address indexed winner, uint256 amount);
    event TeamCreated(uint256 indexed teamId, string name, address captain);
    event TeamMemberAdded(uint256 indexed teamId, address member);
    event AchievementUnlocked(address indexed player, uint256 indexed achievementId);
    event LeaderboardUpdated(GameType gameType, address[] topPlayers);

    modifier onlyOrganizer() {
        require(hasRole(TOURNAMENT_ORGANIZER_ROLE, msg.sender), "Not an organizer");
        _;
    }

    modifier onlyGameMaster() {
        require(hasRole(GAME_MASTER_ROLE, msg.sender), "Not a game master");
        _;
    }

    modifier onlyPlayer() {
        require(players[msg.sender].isActive, "Not a registered player");
        _;
    }

    function initialize(address _aodsToken, address _achievementNFT) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(TOURNAMENT_ORGANIZER_ROLE, msg.sender);
        _grantRole(GAME_MASTER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        aodsToken = IERC20(_aodsToken);
        achievementNFT = IERC721(_achievementNFT);
    }

    // ==================== Player Management ====================

    function registerPlayer(string memory _gamerTag, string memory _profileCID) external returns (bool) {
        require(!players[msg.sender].isActive, "Already registered");
        require(bytes(_gamerTag).length > 0, "Gamer tag required");

        Player storage player = players[msg.sender];
        player.playerAddress = msg.sender;
        player.gamerTag = _gamerTag;
        player.profileCID = _profileCID;
        player.totalMatches = 0;
        player.wins = 0;
        player.losses = 0;
        player.totalEarnings = 0;
        player.ranking = 0;
        player.reputation = 100;
        player.isActive = true;
        player.registeredAt = block.timestamp;

        emit PlayerRegistered(msg.sender, _gamerTag);
        return true;
    }

    function updatePlayerProfile(string memory _gamerTag, string memory _profileCID) external onlyPlayer {
        Player storage player = players[msg.sender];
        if (bytes(_gamerTag).length > 0) {
            player.gamerTag = _gamerTag;
        }
        if (bytes(_profileCID).length > 0) {
            player.profileCID = _profileCID;
        }
    }

    // ==================== Tournament Management ====================

    function createTournament(
        string memory _name,
        string memory _description,
        GameType _gameType,
        TournamentType _tournamentType,
        uint256 _entryFee,
        uint256 _prizePool,
        uint256 _maxParticipants,
        uint256 _registrationStart,
        uint256 _registrationEnd,
        uint256 _tournamentStart,
        uint256 _tournamentEnd,
        address _tokenAddress,
        string memory _metadataCID,
        uint256[] memory _prizeDistribution
    ) external onlyOrganizer returns (uint256) {
        require(_registrationStart > block.timestamp, "Registration must be in future");
        require(_registrationEnd > _registrationStart, "Invalid registration period");
        require(_tournamentStart > _registrationEnd, "Tournament must start after registration");
        require(_prizeDistribution.length > 0, "Prize distribution required");

        tournamentCounter++;
        uint256 tournamentId = tournamentCounter;

        Tournament storage tournament = tournaments[tournamentId];
        tournament.tournamentId = tournamentId;
        tournament.name = _name;
        tournament.description = _description;
        tournament.gameType = _gameType;
        tournament.tournamentType = _tournamentType;
        tournament.status = TournamentStatus.PENDING;
        tournament.entryFee = _entryFee;
        tournament.prizePool = _prizePool;
        tournament.maxParticipants = _maxParticipants;
        tournament.currentParticipants = 0;
        tournament.registrationStart = _registrationStart;
        tournament.registrationEnd = _registrationEnd;
        tournament.tournamentStart = _tournamentStart;
        tournament.tournamentEnd = _tournamentEnd;
        tournament.organizer = msg.sender;
        tournament.tokenAddress = _tokenAddress;
        tournament.metadataCID = _metadataCID;
        tournament.prizeDistribution = _prizeDistribution;

        emit TournamentCreated(tournamentId, _name, _gameType, _prizePool);
        return tournamentId;
    }

    function openRegistration(uint256 _tournamentId) external onlyOrganizer {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.organizer == msg.sender, "Not the organizer");
        require(tournament.status == TournamentStatus.PENDING, "Invalid status");
        require(block.timestamp >= tournament.registrationStart, "Registration time not reached");

        tournament.status = TournamentStatus.REGISTRATION;
    }

    function startTournament(uint256 _tournamentId) external onlyOrganizer {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.organizer == msg.sender, "Not the organizer");
        require(tournament.status == TournamentStatus.REGISTRATION, "Invalid status");
        require(block.timestamp >= tournament.tournamentStart, "Tournament time not reached");
        require(tournament.currentParticipants >= 2, "Need at least 2 participants");

        tournament.status = TournamentStatus.ACTIVE;

        emit TournamentStarted(_tournamentId, block.timestamp);
    }

    function completeTournament(uint256 _tournamentId, address _winner) external onlyOrganizer {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.organizer == msg.sender, "Not the organizer");
        require(tournament.status == TournamentStatus.ACTIVE, "Tournament not active");
        require(tournament.isParticipant[_winner], "Winner not a participant");

        tournament.status = TournamentStatus.COMPLETED;

        emit TournamentCompleted(_tournamentId, _winner);
    }

    function cancelTournament(uint256 _tournamentId) external onlyOrganizer {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.organizer == msg.sender, "Not the organizer");
        require(tournament.status != TournamentStatus.COMPLETED, "Already completed");
        require(tournament.status != TournamentStatus.CANCELLED, "Already cancelled");

        tournament.status = TournamentStatus.CANCELLED;

        // Refund entry fees
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            if (tournament.entryFee > 0) {
                IERC20(tournament.tokenAddress).transfer(tournament.participants[i], tournament.entryFee);
            }
        }
    }

    // ==================== Tournament Participation ====================

    function joinTournament(uint256 _tournamentId) external onlyPlayer nonReentrant {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(tournament.status == TournamentStatus.REGISTRATION, "Registration not open");
        require(block.timestamp >= tournament.registrationStart, "Registration not started");
        require(block.timestamp <= tournament.registrationEnd, "Registration ended");
        require(!tournament.isParticipant[msg.sender], "Already joined");
        require(tournament.currentParticipants < tournament.maxParticipants, "Tournament full");

        // Pay entry fee
        if (tournament.entryFee > 0) {
            require(
                IERC20(tournament.tokenAddress).transferFrom(msg.sender, address(this), tournament.entryFee),
                "Entry fee transfer failed"
            );
        }

        tournament.participants.push(msg.sender);
        tournament.isParticipant[msg.sender] = true;
        tournament.currentParticipants++;
        playerTournaments[msg.sender].push(_tournamentId);

        emit PlayerJoinedTournament(_tournamentId, msg.sender);
    }

    function leaveTournament(uint256 _tournamentId) external onlyPlayer {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(tournament.status == TournamentStatus.REGISTRATION, "Cannot leave now");
        require(tournament.isParticipant[msg.sender], "Not a participant");

        // Remove participant
        tournament.isParticipant[msg.sender] = false;
        tournament.currentParticipants--;

        // Refund entry fee
        if (tournament.entryFee > 0) {
            IERC20(tournament.tokenAddress).transfer(msg.sender, tournament.entryFee);
        }

        // Remove from array
        for (uint256 i = 0; i < tournament.participants.length; i++) {
            if (tournament.participants[i] == msg.sender) {
                tournament.participants[i] = tournament.participants[tournament.participants.length - 1];
                tournament.participants.pop();
                break;
            }
        }
    }

    // ==================== Match Management ====================

    function createMatch(
        uint256 _tournamentId,
        address _player1,
        address _player2,
        uint256 _scheduledTime
    ) external onlyOrganizer returns (uint256) {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.organizer == msg.sender, "Not the organizer");
        require(tournament.isParticipant[_player1], "Player 1 not participant");
        require(tournament.isParticipant[_player2], "Player 2 not participant");

        tournament.matchCount++;
        uint256 matchId = tournament.matchCount;

        Match storage match_ = tournament.matches[matchId];
        match_.matchId = matchId;
        match_.tournamentId = _tournamentId;
        match_.player1 = _player1;
        match_.player2 = _player2;
        match_.scheduledTime = _scheduledTime;
        match_.isCompleted = false;

        return matchId;
    }

    function submitMatchResult(
        uint256 _tournamentId,
        uint256 _matchId,
        address _winner,
        uint256 _score1,
        uint256 _score2,
        string memory _proofCID
    ) external onlyOrganizer {
        Tournament storage tournament = tournaments[_tournamentId];
        Match storage match_ = tournament.matches[_matchId];
        
        require(tournament.organizer == msg.sender, "Not the organizer");
        require(!match_.isCompleted, "Match already completed");
        require(_winner == match_.player1 || _winner == match_.player2, "Invalid winner");

        match_.winner = _winner;
        match_.score1 = _score1;
        match_.score2 = _score2;
        match_.completedTime = block.timestamp;
        match_.isCompleted = true;
        match_.proofCID = _proofCID;

        // Update player stats
        if (_winner == match_.player1) {
            players[match_.player1].wins++;
            players[match_.player2].losses++;
        } else {
            players[match_.player2].wins++;
            players[match_.player1].losses++;
        }
        players[match_.player1].totalMatches++;
        players[match_.player2].totalMatches++;

        emit MatchCompleted(_tournamentId, _matchId, _winner);
    }

    // ==================== Prize Distribution ====================

    function distributePrizes(uint256 _tournamentId) external onlyOrganizer nonReentrant {
        Tournament storage tournament = tournaments[_tournamentId];
        
        require(tournament.organizer == msg.sender, "Not the organizer");
        require(tournament.status == TournamentStatus.COMPLETED, "Tournament not completed");
        require(!tournament.prizesDistributed, "Prizes already distributed");

        tournament.prizesDistributed = true;

        // Get winners based on leaderboard
        address[] memory winners = tournamentLeaderboard[_tournamentId];
        
        for (uint256 i = 0; i < winners.length && i < tournament.prizeDistribution.length; i++) {
            uint256 prize = (tournament.prizePool * tournament.prizeDistribution[i]) / 100;
            
            if (prize > 0) {
                require(
                    IERC20(tournament.tokenAddress).transfer(winners[i], prize),
                    "Prize transfer failed"
                );
                
                players[winners[i]].totalEarnings += prize;
                emit PrizeDistributed(_tournamentId, winners[i], prize);
            }
        }
    }

    function updateLeaderboard(uint256 _tournamentId, address[] memory _rankedPlayers) external onlyOrganizer {
        Tournament storage tournament = tournaments[_tournamentId];
        require(tournament.organizer == msg.sender, "Not the organizer");
        require(tournament.status == TournamentStatus.ACTIVE || tournament.status == TournamentStatus.COMPLETED, "Invalid status");

        tournamentLeaderboard[_tournamentId] = _rankedPlayers;
    }

    // ==================== Team Management ====================

    function createTeam(string memory _name, string memory _logoCID) external onlyPlayer returns (uint256) {
        require(playerTeam[msg.sender] == 0, "Already in a team");

        teamCounter++;
        uint256 teamId = teamCounter;

        Team storage team = teams[teamId];
        team.teamId = teamId;
        team.name = _name;
        team.logoCID = _logoCID;
        team.captain = msg.sender;
        team.members.push(msg.sender);
        team.isMember[msg.sender] = true;
        team.isActive = true;
        team.createdAt = block.timestamp;

        playerTeam[msg.sender] = teamId;

        emit TeamCreated(teamId, _name, msg.sender);
        return teamId;
    }

    function inviteTeamMember(uint256 _teamId, address _member) external {
        Team storage team = teams[_teamId];
        require(team.captain == msg.sender, "Not captain");
        require(team.isActive, "Team not active");
        require(!team.isMember[_member], "Already a member");
        require(playerTeam[_member] == 0, "Member already in a team");
        require(players[_member].isActive, "Not a registered player");

        team.members.push(_member);
        team.isMember[_member] = true;
        playerTeam[_member] = _teamId;

        emit TeamMemberAdded(_teamId, _member);
    }

    function leaveTeam(uint256 _teamId) external {
        Team storage team = teams[_teamId];
        require(team.isMember[msg.sender], "Not a member");
        require(team.captain != msg.sender, "Captain cannot leave");

        team.isMember[msg.sender] = false;
        playerTeam[msg.sender] = 0;

        // Remove from array
        for (uint256 i = 0; i < team.members.length; i++) {
            if (team.members[i] == msg.sender) {
                team.members[i] = team.members[team.members.length - 1];
                team.members.pop();
                break;
            }
        }
    }

    // ==================== Achievement System ====================

    function createAchievement(
        string memory _name,
        string memory _description,
        string memory _imageCID,
        uint256 _rarity
    ) external onlyGameMaster returns (uint256) {
        achievementCounter++;
        uint256 achievementId = achievementCounter;

        Achievement storage achievement = achievements[achievementId];
        achievement.achievementId = achievementId;
        achievement.name = _name;
        achievement.description = _description;
        achievement.imageCID = _imageCID;
        achievement.rarity = _rarity;
        achievement.totalMinted = 0;

        return achievementId;
    }

    function unlockAchievement(address _player, uint256 _achievementId, uint256 _tokenId) external onlyGameMaster {
        require(players[_player].isActive, "Not a registered player");
        require(achievements[_achievementId].achievementId != 0, "Achievement not found");

        PlayerAchievement storage playerAch = playerAchievements[_player][_achievementId];
        require(playerAch.earnedAt == 0, "Achievement already unlocked");

        playerAch.achievementId = _achievementId;
        playerAch.earnedAt = block.timestamp;
        playerAch.tokenId = _tokenId;

        achievements[_achievementId].totalMinted++;

        emit AchievementUnlocked(_player, _achievementId);
    }

    // ==================== View Functions ====================

    function getTournament(uint256 _tournamentId) external view returns (
        uint256 tournamentId,
        string memory name,
        GameType gameType,
        TournamentType tournamentType,
        TournamentStatus status,
        uint256 entryFee,
        uint256 prizePool,
        uint256 maxParticipants,
        uint256 currentParticipants,
        uint256 tournamentStart,
        uint256 tournamentEnd,
        address organizer,
        bool prizesDistributed
    ) {
        Tournament storage tournament = tournaments[_tournamentId];
        return (
            tournament.tournamentId,
            tournament.name,
            tournament.gameType,
            tournament.tournamentType,
            tournament.status,
            tournament.entryFee,
            tournament.prizePool,
            tournament.maxParticipants,
            tournament.currentParticipants,
            tournament.tournamentStart,
            tournament.tournamentEnd,
            tournament.organizer,
            tournament.prizesDistributed
        );
    }

    function getPlayer(address _player) external view returns (Player memory) {
        return players[_player];
    }

    function getPlayerStats(address _player) external view returns (
        uint256 totalMatches,
        uint256 wins,
        uint256 losses,
        uint256 draws,
        uint256 totalEarnings,
        uint256 ranking,
        uint256 reputation
    ) {
        Player storage player = players[_player];
        return (
            player.totalMatches,
            player.wins,
            player.losses,
            player.draws,
            player.totalEarnings,
            player.ranking,
            player.reputation
        );
    }

    function getTeam(uint256 _teamId) external view returns (
        uint256 teamId,
        string memory name,
        address captain,
        address[] memory members,
        uint256 wins,
        uint256 losses,
        uint256 totalEarnings,
        bool isActive
    ) {
        Team storage team = teams[_teamId];
        return (
            team.teamId,
            team.name,
            team.captain,
            team.members,
            team.wins,
            team.losses,
            team.totalEarnings,
            team.isActive
        );
    }

    function getTournamentParticipants(uint256 _tournamentId) external view returns (address[] memory) {
        return tournaments[_tournamentId].participants;
    }

    function getMatch(uint256 _tournamentId, uint256 _matchId) external view returns (Match memory) {
        return tournaments[_tournamentId].matches[_matchId];
    }

    function getLeaderboard(uint256 _tournamentId) external view returns (address[] memory) {
        return tournamentLeaderboard[_tournamentId];
    }

    function getPlayerTournaments(address _player) external view returns (uint256[] memory) {
        return playerTournaments[_player];
    }

    function getWinRate(address _player) external view returns (uint256) {
        Player storage player = players[_player];
        if (player.totalMatches == 0) return 0;
        return (player.wins * 100) / player.totalMatches;
    }

    // ==================== Upgrade Authorization ====================

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}
}
