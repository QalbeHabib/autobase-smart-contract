/**
 * Smart Contracts Module
 *
 * This module ties together the various components of the system
 * to create a unified smart contract-like experience with Autobase.
 */

const Autobase = require("autobase");
const Hypercore = require("hypercore");
const identityModule = require("../identity");
const permissionsModule = require("../permissions");
const currencyModule = require("../currency");
const web3Module = require("../web3");

/**
 * Smart Contract System
 *
 * This module provides the core smart contract functionality
 * using Autobase as the underlying consensus mechanism.
 */

/**
 * Creates a smart contract system using Autobase
 * @param {Object} storage - The storage mechanism (e.g., RAM, corestore)
 * @param {Object} options - Configuration options
 * @param {Object} options.localIdentity - The local user's identity
 * @param {Array} options.writers - Initial writers allowed to append to the autobase
 * @returns {Object} The smart contract system
 */
async function createSmartContractSystem(storage, options = {}) {
  const { localIdentity, writers = [] } = options;

  // Ensure storage is ready
  await storage.ready();

  // Initialize variables that will be set later
  let identityRegistry = null;
  let currencySystem = null;
  let resourceSystem = null;
  let web3Bridge = null;

  // Set up our application systems
  const permissionSystem = permissionsModule.createPermissionSystem();

  // Initialize state
  const state = {
    identityRegistry: new Map(), // Maps masterPublicKey -> Set of devicePublicKeys
    permissions: {
      channels: new Map(), // Maps channelId -> Map of userPublicKey -> role
      defaultRoles: new Map(), // Maps userPublicKey -> default role
    },
    currency: {
      balances: new Map(), // Maps currencyId_userPublicKey -> balance
    },
    resources: {
      inventory: new Map(), // Maps userPublicKey -> Map of resourceId -> quantity
    },
    tokenGated: {
      access: new Map(), // Maps channelId -> Map of tokenContract -> { minBalance, tokenType }
    },
  };

  // Create the local input feed
  const localInputKey = localIdentity
    ? localIdentity.privateIdentity.deviceKeyPair.publicKey
    : null;

  // Define the open and apply functions
  const open = (store) => {
    return store.get("contract-state", { valueEncoding: "json" });
  };

  const apply = async (nodes, view, host) => {
    // Process each node
    for (const node of nodes) {
      if (!node || !node.value) continue;

      const operation = node.value;

      // Skip if missing system type or data
      if (!operation.system || !operation.data) continue;

      // Process by system type
      switch (operation.system) {
        case "permission":
          if (operation.data.type === "SET_PERMISSION") {
            const { channelId, userPublicKey, role } = operation.data;
            if (!state.permissions.channels.has(channelId)) {
              state.permissions.channels.set(channelId, new Map());
            }
            state.permissions.channels.get(channelId).set(userPublicKey, role);
          } else if (operation.data.type === "SET_DEFAULT_ROLE") {
            const { userPublicKey, role } = operation.data;
            state.permissions.defaultRoles.set(userPublicKey, role);
          }
          break;

        case "currency":
          console.log(`Processing currency operation: ${operation.data.type}`);
          // Update our currencySystem with this operation
          if (typeof currencySystem.updateFromOperation === "function") {
            const success = currencySystem.updateFromOperation(operation);
            if (success) {
              console.log(
                `Successfully applied currency operation: ${operation.data.type}`
              );
            }
          } else {
            console.warn(
              "Currency system does not have updateFromOperation method"
            );
          }
          break;

        case "resource":
          console.log(`Processing resource operation: ${operation.data.type}`);
          // Update our resourceSystem with this operation
          if (typeof resourceSystem.updateFromOperation === "function") {
            const success = resourceSystem.updateFromOperation(operation);
            if (success) {
              console.log(
                `Successfully applied resource operation: ${operation.data.type}`
              );
            }
          } else {
            console.warn(
              "Resource system does not have updateFromOperation method"
            );
          }
          break;

        case "identity":
          if (operation.data.type === "REGISTER_DEVICE") {
            const { masterPublicKey, devicePublicKey } = operation.data;
            if (!state.identityRegistry.has(masterPublicKey)) {
              state.identityRegistry.set(masterPublicKey, new Set());
            }
            state.identityRegistry.get(masterPublicKey).add(devicePublicKey);
          }
          break;

        case "tokenGated":
          if (operation.data.type === "SET_TOKEN_GATE") {
            const { channelId, tokenContract, minBalance, tokenType } =
              operation.data;
            if (!state.tokenGated.access.has(channelId)) {
              state.tokenGated.access.set(channelId, new Map());
            }
            state.tokenGated.access
              .get(channelId)
              .set(tokenContract, { minBalance, tokenType });
          }
          break;
      }

      // Write the operation to the view for persistence
      await view.append(operation);
    }
  };

  // Create Autobase according to documentation
  const autobase = new Autobase(storage, null, {
    open,
    apply,
    valueEncoding: "json",
    ackInterval: 1000, // Enable auto acking
  });

  await autobase.ready();

  // Initialize the various subsystems with the autobase instance
  permissionSystem.setAutobase(autobase);
  identityRegistry = identityModule.createIdentityRegistry(autobase);
  currencySystem = currencyModule.createCurrencySystem(autobase);
  resourceSystem = currencyModule.createResourceSystem(autobase);
  web3Bridge = new web3Module.Web3Bridge();

  // Register the local identity's device if available
  if (localIdentity) {
    const { publicKey } = localIdentity.publicIdentity;
    const { deviceKeyPair, authSignature } = localIdentity.privateIdentity;

    identityRegistry.registerDevice(
      publicKey,
      deviceKeyPair.publicKey,
      authSignature
    );
  }

  // Fix writer management: Provide a workaround for the addWriter function
  // since autobase.addInput is not available in the current Autobase version
  async function addWriter(writerPublicKey) {
    try {
      // Check if Autobase has the expected method
      if (typeof autobase.addInput === "function") {
        // Use the original method if available
        await autobase.addInput(writerPublicKey);
        return true;
      } else if (typeof autobase.append === "function") {
        // Use an operation-based approach as a workaround
        const operation = {
          system: "system",
          data: {
            type: "ADD_WRITER",
            writerPublicKey: Buffer.isBuffer(writerPublicKey)
              ? writerPublicKey.toString("hex")
              : writerPublicKey,
          },
          timestamp: Date.now(),
        };
        await autobase.append(operation);
        console.log(
          `Writer added via operation: ${operation.data.writerPublicKey}`
        );
        return true;
      } else {
        console.warn("No method available to add writer");
        return false;
      }
    } catch (err) {
      console.error("Error adding writer:", err);
      return false;
    }
  }

  // Simple function to create operations
  async function appendOperation(system, data) {
    try {
      const operation = {
        system,
        data,
        timestamp: Date.now(),
      };

      await autobase.append(operation);
      return true;
    } catch (err) {
      console.error("Error appending operation:", err);
      return false;
    }
  }

  // Initialize all subsystems to load and apply existing operations
  async function initializeAllSubsystems() {
    console.log("Initializing all subsystems...");

    try {
      // Initialize identity registry
      if (
        identityRegistry &&
        typeof identityRegistry.forceInitialize === "function"
      ) {
        await identityRegistry.forceInitialize();
      }

      // Initialize currency system
      if (
        currencySystem &&
        typeof currencySystem.forceInitialize === "function"
      ) {
        await currencySystem.forceInitialize();
      }

      // Initialize resource system
      if (
        resourceSystem &&
        typeof resourceSystem.forceInitialize === "function"
      ) {
        await resourceSystem.forceInitialize();
      }

      console.log("All subsystems initialized");
    } catch (error) {
      console.error("Error initializing subsystems:", error);
    }
  }

  // Schedule initialization after current execution context
  setTimeout(() => {
    initializeAllSubsystems().catch((err) =>
      console.error("Error during subsystem initialization:", err)
    );
  }, 0);

  // Set up the smart contract system interface
  return {
    // The underlying autobase instance
    autobase,

    // Current state
    state,

    // Identity management
    identityRegistry,

    // Currency management
    currencySystem,

    // Resource management
    resourceSystem,

    // Add a new writer to the autobase
    addWriter,

    // Initialize all subsystems
    initializeAllSubsystems,

    // Permission system methods
    async setPermission(channelId, userPublicKey, role) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      // Update local state immediately for fast feedback
      if (!state.permissions.channels.has(channelId)) {
        state.permissions.channels.set(channelId, new Map());
      }
      state.permissions.channels.get(channelId).set(keyStr, role);

      const result = await appendOperation("permission", {
        type: "SET_PERMISSION",
        channelId,
        userPublicKey: keyStr,
        role,
      });

      return result;
    },

    async getPermission(channelId, userPublicKey) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      const channelPermissions = state.permissions.channels.get(channelId);
      if (!channelPermissions) return "MEMBER"; // Default role

      return (
        channelPermissions.get(keyStr) ||
        state.permissions.defaultRoles.get(keyStr) ||
        "MEMBER"
      );
    },

    // Currency system methods - delegate to currencySystem
    async mintCurrency(currencyId, userPublicKey, amount) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      // Instead of updating state directly, use the currencySystem
      const success = currencySystem.mint(keyStr, amount, {
        publicIdentity: { publicKey: Buffer.from("system") },
      });

      return success;
    },

    async transferCurrency(currencyId, fromPublicKey, toPublicKey, amount) {
      const fromKeyStr = Buffer.isBuffer(fromPublicKey)
        ? fromPublicKey.toString("hex")
        : fromPublicKey;

      const toKeyStr = Buffer.isBuffer(toPublicKey)
        ? toPublicKey.toString("hex")
        : toPublicKey;

      // Use the currencySystem to handle the transfer
      const success = currencySystem.transfer(fromKeyStr, toKeyStr, amount);

      return success;
    },

    getCurrencyBalance(currencyId, userPublicKey) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      // Use the currencySystem to get the balance
      return currencySystem.balanceOf(keyStr);
    },

    // Resource system methods - delegate to resourceSystem
    async addResource(userPublicKey, resourceId, quantity) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      // Use the resourceSystem to handle adding resources
      if (quantity > 0) {
        return resourceSystem.mintResource(resourceId, keyStr, quantity, {
          publicIdentity: { publicKey: Buffer.from("system") },
        });
      } else if (quantity < 0) {
        // For removal, use consume
        return resourceSystem.consumeResource(
          resourceId,
          keyStr,
          Math.abs(quantity),
          "Manual adjustment"
        );
      }

      return true;
    },

    getResourceQuantity(userPublicKey, resourceId) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      // Use the resourceSystem to get the quantity
      const holdings = resourceSystem.getHoldings(keyStr);
      return holdings[resourceId] || 0;
    },

    // Token-gated access
    async setTokenGate(
      channelId,
      tokenContract,
      minBalance,
      tokenType = "ERC20"
    ) {
      // Update local state immediately for fast feedback
      if (!state.tokenGated.access.has(channelId)) {
        state.tokenGated.access.set(channelId, new Map());
      }
      state.tokenGated.access
        .get(channelId)
        .set(tokenContract, { minBalance, tokenType });

      const result = await appendOperation("tokenGated", {
        type: "SET_TOKEN_GATE",
        channelId,
        tokenContract,
        minBalance,
        tokenType,
      });

      return result;
    },

    // Check token-gated access
    async verifyTokenAccess(channelId, userAddress) {
      const channelTokens = state.tokenGated.access.get(channelId);
      if (!channelTokens || channelTokens.size === 0) return true; // No token gates

      // Check each token gate
      for (const [
        tokenContract,
        { minBalance, tokenType },
      ] of channelTokens.entries()) {
        // In this simplified example, we'll simulate checking tokens
        // In a real implementation, this would query the blockchain
        const balance = 0; // Simulated balance
        if (balance >= minBalance) return true;
      }

      return false;
    },
  };
}

/**
 * Creates an identity from a seed phrase
 * @param {string} seed - The seed phrase
 * @returns {Object} The identity
 */
function createContractIdentity(seed) {
  return identityModule.createIdentity(seed);
}

module.exports = {
  createSmartContractSystem,
  createContractIdentity,
};
