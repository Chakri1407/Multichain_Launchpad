// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Launchpad is ReentrancyGuard {
    struct Project {
        address payable owner; // Project creator
        string name; // Project name
        string description; // Short description
        uint256 goalAmount; // Target funding in ETH
        uint256 deadline; // Fundraising end time
        uint256 totalRaised; // Total funds collected
        bool fundsReleased; // Prevent multiple withdrawals
    }

    mapping(uint256 => Project) public projects; // Store projects
    mapping(uint256 => mapping(address => uint256)) public contributions; // Tracks contributions
    uint256 public projectCount; // Track number of projects

    event ProjectCreated(uint256 indexed projectId, address indexed owner, uint256 goalAmount, uint256 deadline);
    event Funded(uint256 indexed projectId, address indexed contributor, uint256 amount);
    event FundsWithdrawn(uint256 indexed projectId, address indexed owner, uint256 amount);
    event RefundIssued(uint256 indexed projectId, address indexed contributor, uint256 amount);

    modifier onlyProjectOwner(uint256 _projectId) {
        require(msg.sender == projects[_projectId].owner, "Not the project owner");
        _;
    }

    modifier onlyBeforeDeadline(uint256 _projectId) {
        require(block.timestamp < projects[_projectId].deadline, "Fundraising ended");
        _;
    }

    modifier onlyAfterDeadline(uint256 _projectId) {
        require(block.timestamp >= projects[_projectId].deadline, "Fundraising still active");
        _;
    }

    // 🚀 Project Owner Registers a Project on the Launchpad
    function createProject(string memory _name, string memory _description, uint256 _goalAmount, uint256 _duration) external {
        require(_goalAmount > 0, "Goal amount must be greater than 0");

        projectCount++;
        projects[projectCount] = Project({
            owner: payable(msg.sender),
            name: _name,
            description: _description,
            goalAmount: _goalAmount,
            deadline: block.timestamp + _duration,
            totalRaised: 0,
            fundsReleased: false
        });

        emit ProjectCreated(projectCount, msg.sender, _goalAmount, block.timestamp + _duration);
    }

    // 📊 Get Project Details
    function getProject(uint256 _projectId) external view returns (Project memory) {
        return projects[_projectId];
    }

    // 💰 Users Contribute ETH to a Project
    function contribute(uint256 _projectId) external payable onlyBeforeDeadline(_projectId) nonReentrant {
        require(msg.value > 0, "Contribution must be greater than 0");

        Project storage project = projects[_projectId];
        project.totalRaised += msg.value;
        contributions[_projectId][msg.sender] += msg.value;

        emit Funded(_projectId, msg.sender, msg.value);
    }

    // 🎉 Project Owner Withdraws Funds If Goal is Met
    function withdrawFunds(uint256 _projectId) external onlyProjectOwner(_projectId) onlyAfterDeadline(_projectId) nonReentrant {
        Project storage project = projects[_projectId];
        require(project.totalRaised >= project.goalAmount, "Funding goal not met");
        require(!project.fundsReleased, "Funds already withdrawn");

        project.fundsReleased = true;
        project.owner.transfer(project.totalRaised);

        emit FundsWithdrawn(_projectId, project.owner, project.totalRaised);
    }

    // 🔄 Users Can Get Refunds If Goal Is Not Met
    function refund(uint256 _projectId) external onlyAfterDeadline(_projectId) nonReentrant {
        Project storage project = projects[_projectId];
        require(project.totalRaised < project.goalAmount, "Funding goal met, no refunds");

        uint256 contributedAmount = contributions[_projectId][msg.sender];
        require(contributedAmount > 0, "No contribution to refund");

        contributions[_projectId][msg.sender] = 0;
        payable(msg.sender).transfer(contributedAmount);

        emit RefundIssued(_projectId, msg.sender, contributedAmount);
    }

    // 📅 Get remaining time in seconds
    function timeRemaining(uint256 _projectId) external view returns (uint256) {
        if (block.timestamp >= projects[_projectId].deadline) {
            return 0; // Deadline passed
        }
        return projects[_projectId].deadline - block.timestamp; // Remaining time
    }

    // 📊 Get goal progress as a percentage (scaled to 100)
    function goalReachedTillNow(uint256 _projectId) external view returns (uint256) {
        Project storage project = projects[_projectId];
        if (project.goalAmount == 0) return 0; // Avoid division by zero
        return (project.totalRaised * 100) / project.goalAmount; // Percentage of goal reached
    }

    
}
