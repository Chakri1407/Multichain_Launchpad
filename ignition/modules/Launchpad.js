const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("LaunchpadDeployment", (m) => {
  const launchpad = m.contract("Launchpad");
  
  console.log("Launchpad contract deployed to:", launchpad.address);

  return { launchpad };
});