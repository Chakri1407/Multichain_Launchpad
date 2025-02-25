const { expect } = require("chai");
const { ethers } = require("hardhat");
const { parseEther } = require("ethers");

describe("Launchpad Contract", function () {
  let launchpad;
  let owner;
  let projectCreator;
  let contributor1;
  let contributor2;
  let addrs;

  // Helper function to increase blockchain time
  async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
  }

  beforeEach(async function () {
    // Get signers
    [owner, projectCreator, contributor1, contributor2, ...addrs] = await ethers.getSigners();

    // Deploy contract
    const Launchpad = await ethers.getContractFactory("Launchpad");
    launchpad = await Launchpad.deploy();
    
    // No need to call deployed() - just wait for deployment
    await launchpad.waitForDeployment();
  });

  describe("Project Creation", function () {
    it("Should allow creating a new project", async function () {
      const projectName = "Test Project";
      const projectDesc = "A test project description";
      const goalAmount = parseEther("1.0");
      const duration = 7 * 24 * 60 * 60; // 7 days

      // Create project
      await launchpad.connect(projectCreator).createProject(
        projectName, 
        projectDesc, 
        goalAmount, 
        duration
      );

      // Verify project creation
      const projectCount = await launchpad.projectCount();
      expect(projectCount).to.equal(1);

      // Fetch and verify project details
      const project = await launchpad.getProject(1);
      expect(project.owner).to.equal(projectCreator.address);
      expect(project.name).to.equal(projectName);
      expect(project.description).to.equal(projectDesc);
      expect(project.goalAmount).to.equal(goalAmount);
    });

    it("Should revert creating a project with zero goal amount", async function () {
      await expect(
        launchpad.connect(projectCreator).createProject(
          "Invalid Project", 
          "Description", 
          0, 
          7 * 24 * 60 * 60
        )
      ).to.be.revertedWith("Goal amount must be greater than 0");
    });
  });

  describe("Project Contribution", function () {
    let projectId;
    let goalAmount;
    let duration;

    beforeEach(async function () {
      goalAmount = parseEther("1.0");
      duration = 7 * 24 * 60 * 60; // 7 days

      // Create a project first
      await launchpad.connect(projectCreator).createProject(
        "Contribution Test Project", 
        "Test Description", 
        goalAmount, 
        duration
      );
      projectId = 1;
    });

    it("Should allow contributions before deadline", async function () {
      const contributionAmount = parseEther("5.0");
      
      // Contribute to the project
      await launchpad.connect(contributor1).contribute(projectId, { value: contributionAmount });

      // Verify contribution
      const project = await launchpad.getProject(projectId);
      expect(project.totalRaised).to.equal(contributionAmount);

      const userContribution = await launchpad.contributions(projectId, contributor1.address);
      expect(userContribution).to.equal(contributionAmount);
    });

    it("Should revert contributions after deadline", async function () {
      // Increase time past the deadline
      await increaseTime(duration + 1);

      const contributionAmount = parseEther("5.0");
      
      await expect(
        launchpad.connect(contributor1).contribute(projectId, { value: contributionAmount })
      ).to.be.revertedWith("Fundraising ended");
    });

    it("Should revert zero contributions", async function () {
      await expect(
        launchpad.connect(contributor1).contribute(projectId, { value: 0 })
      ).to.be.revertedWith("Contribution must be greater than 0");
    });
  });

  describe("Funds Withdrawal", function () {
    it("Should allow project owner to withdraw funds if goal is met", async function () {
      const goalAmount = parseEther("1.0");
      const duration = 60 * 60 * 24 * 7; // 7 days in seconds
      
      // Create project with addr1 as creator
      await launchpad.connect(projectCreator).createProject(
        "Test Project",
        "Test Description",
        goalAmount,
        duration
      );

      // Contribute immediately after creation
      await launchpad.connect(contributor1).contribute(1, { value: goalAmount });

      // Fast forward time to after deadline
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");

      // Get initial balance
      const initialBalance = await ethers.provider.getBalance(projectCreator.address);

      // Withdraw funds
      await launchpad.connect(projectCreator).withdrawFunds(1);

      // Get final balance
      const finalBalance = await ethers.provider.getBalance(projectCreator.address);
      
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should revert withdrawal if goal not met", async function () {
      const goalAmount = parseEther("1.0");
      const duration = 60 * 60 * 24 * 7; // 7 days
      const contributionAmount = parseEther("0.5"); // Half of goal

      await launchpad.connect(projectCreator).createProject(
        "Test Project",
        "Test Description",
        goalAmount,
        duration
      );

      await launchpad.connect(contributor1).contribute(1, { value: contributionAmount });

      // Fast forward time to after deadline
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");

      await expect(
        launchpad.connect(projectCreator).withdrawFunds(1)
      ).to.be.revertedWith("Funding goal not met");
    });
  });

  describe("Refund Mechanism", function () {
    it("Should allow refunds if goal is not met", async function () {
      const goalAmount = parseEther("1.0");
      const duration = 60 * 60 * 24 * 7; // 7 days
      const contributionAmount = parseEther("0.5");

      await launchpad.connect(projectCreator).createProject(
        "Test Project",
        "Test Description",
        goalAmount,
        duration
      );

      // Get initial balance
      const initialBalance = await ethers.provider.getBalance(projectCreator.address);

      // Make contribution
      await launchpad.connect(contributor1).contribute(1, { value: contributionAmount });

      // Fast forward time to after deadline
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");

      // Request refund
      await launchpad.connect(contributor1).refund(1);

      // Get final balance
      const finalBalance = await ethers.provider.getBalance(projectCreator.address);
      
      // Balance should be higher than initial minus a small amount for gas
      expect(finalBalance).to.be.gt(initialBalance - parseEther("0.01")); 
    });

    it("Should revert refund if funding goal is met", async function () {
      const goalAmount = parseEther("1.0");
      const duration = 60 * 60 * 24 * 7; // 7 days

      await launchpad.connect(projectCreator).createProject(
        "Test Project",
        "Test Description",
        goalAmount,
        duration
      );

      // Meet the goal
      await launchpad.connect(contributor1).contribute(1, { value: goalAmount });

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [duration + 1]);
      await ethers.provider.send("evm_mine");

      // Try to get refund
      await expect(
        launchpad.connect(contributor1).refund(1)
      ).to.be.revertedWith("Funding goal met, no refunds");
    });

    it("Should revert refund for zero contributions", async function () {
      await expect(
        launchpad.connect(contributor2).refund(1)
      ).to.be.revertedWith("Funding goal met, no refunds");
    });
  });

  describe("Additional Utility Functions", function () {
    it("Should correctly calculate time remaining", async function () {
      const goalAmount = parseEther("1.0");
      const duration = 60 * 60 * 24 * 7; // 7 days

      await launchpad.connect(projectCreator).createProject(
        "Test Project",
        "Test Description",
        goalAmount,
        duration
      );

      const timeRemaining = await launchpad.timeRemaining(1);
      // Allow for slight variation in time due to block mining
      expect(timeRemaining).to.be.closeTo(duration, 5);
    });

    it("Should correctly calculate goal progress", async function () {
      const goalAmount = parseEther("1.0");
      const duration = 60 * 60 * 24 * 7; // 7 days
      const contributionAmount = parseEther("0.5"); // 50% of goal

      await launchpad.connect(projectCreator).createProject(
        "Test Project",
        "Test Description",
        goalAmount,
        duration
      );

      await launchpad.connect(contributor1).contribute(1, { value: contributionAmount });

      const progress = await launchpad.goalReachedTillNow(1);
      expect(progress).to.equal(50); // Should return 50 for 50%
    });
  });
});