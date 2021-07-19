// import object which represents your smartContract
const Migrations = artifacts.require("Migrations");

// then you export a function 
// This function receives a deployer object
// you call the deploy method and give the smartContract object and other arguments if constructor
module.exports = function (deployer) {
  deployer.deploy(Migrations);
};

// Development process for frontend of application
// Step one: deploy smart contract using truffle framework
// // to deploy, need to create migration file.
// Step two: connect frontend to contract
// // will use web3, a JS library as well as the contract artifact (the ABI shit)
// Step three: interact with smart contract
// // by using the web3 connection we created
// // Can read data from smartContract
// // Can update data from smartContract