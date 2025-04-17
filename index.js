/**
 * Main Entry Point
 *
 * This file exports all the modules of the Autobase Smart Contract system.
 */

// Export core modules
const identity = require("./src/identity");
const permissions = require("./src/permissions");
const currency = require("./src/currency");
const web3 = require("./src/web3");
const contracts = require("./src/contracts");

module.exports = {
  // Identity module
  createIdentity: identity.createIdentity,
  createIdentityRegistry: identity.createIdentityRegistry,

  // Permissions module
  createPermissionSystem: permissions.createPermissionSystem,
  createRoom: permissions.createRoom,
  DEFAULT_PERMISSIONS: permissions.DEFAULT_PERMISSIONS,

  // Currency module
  createCurrencySystem: currency.createCurrencySystem,
  createResourceSystem: currency.createResourceSystem,

  // Web3 module
  Web3Bridge: web3.Web3Bridge,
  createTokenGatedAccess: web3.createTokenGatedAccess,
  createWeb3Account: web3.createWeb3Account,

  // Contracts module
  createSmartContractSystem: contracts.createSmartContractSystem,
  createContractIdentity: contracts.createContractIdentity,

  // Examples
  examples: {
    chat: require("./examples/chat"),
    gameCurrency: require("./examples/game-currency"),
  },
};
