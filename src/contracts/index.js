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

  // Set up our application systems
  const permissionSystem = permissionsModule.createPermissionSystem();
  const currencySystem = currencyModule.createCurrencySystem();
  const resourceSystem = currencyModule.createResourceSystem();
  const web3Bridge = new web3Module.Web3Bridge();

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
          if (operation.data.type === "MINT") {
            const { currencyId, userPublicKey, amount } = operation.data;
            const key = `${currencyId}_${userPublicKey}`;
            const currentBalance = state.currency.balances.get(key) || 0;
            state.currency.balances.set(key, currentBalance + amount);
          } else if (operation.data.type === "TRANSFER") {
            const { currencyId, fromPublicKey, toPublicKey, amount } =
              operation.data;
            const fromKey = `${currencyId}_${fromPublicKey}`;
            const toKey = `${currencyId}_${toPublicKey}`;
            const fromBalance = state.currency.balances.get(fromKey) || 0;
            const toBalance = state.currency.balances.get(toKey) || 0;

            // Only proceed if sender has enough funds
            if (fromBalance >= amount) {
              state.currency.balances.set(fromKey, fromBalance - amount);
              state.currency.balances.set(toKey, toBalance + amount);
            }
          }
          break;

        case "resource":
          if (operation.data.type === "ADD_RESOURCE") {
            const { userPublicKey, resourceId, quantity } = operation.data;
            if (!state.resources.inventory.has(userPublicKey)) {
              state.resources.inventory.set(userPublicKey, new Map());
            }
            const userInventory = state.resources.inventory.get(userPublicKey);
            const currentQuantity = userInventory.get(resourceId) || 0;
            userInventory.set(resourceId, currentQuantity + quantity);
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

  // Initialize the identity registry with the autobase instance
  const identityRegistry = identityModule.createIdentityRegistry(autobase);

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

  // Add initial writers if provided
  for (const writer of writers) {
    try {
      await autobase.addInput(writer);
    } catch (err) {
      console.error("Error adding writer:", err);
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

  // Set up the smart contract system interface
  return {
    // The underlying autobase instance
    autobase,

    // Current state
    state,

    // Identity management
    identityRegistry,

    // Add a new writer to the autobase
    async addWriter(writerPublicKey) {
      try {
        await autobase.addInput(writerPublicKey);
        return true;
      } catch (err) {
        console.error("Error adding writer:", err);
        return false;
      }
    },

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

    // Currency system methods
    async mintCurrency(currencyId, userPublicKey, amount) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      // Update local state immediately for fast feedback
      const key = `${currencyId}_${keyStr}`;
      const currentBalance = state.currency.balances.get(key) || 0;
      state.currency.balances.set(key, currentBalance + amount);

      const result = await appendOperation("currency", {
        type: "MINT",
        currencyId,
        userPublicKey: keyStr,
        amount,
      });

      return result;
    },

    async transferCurrency(currencyId, fromPublicKey, toPublicKey, amount) {
      const fromKeyStr = Buffer.isBuffer(fromPublicKey)
        ? fromPublicKey.toString("hex")
        : fromPublicKey;

      const toKeyStr = Buffer.isBuffer(toPublicKey)
        ? toPublicKey.toString("hex")
        : toPublicKey;

      // Update local state immediately for fast feedback
      const fromKey = `${currencyId}_${fromKeyStr}`;
      const toKey = `${currencyId}_${toKeyStr}`;
      const fromBalance = state.currency.balances.get(fromKey) || 0;
      const toBalance = state.currency.balances.get(toKey) || 0;

      // Only proceed if sender has enough funds
      if (fromBalance >= amount) {
        state.currency.balances.set(fromKey, fromBalance - amount);
        state.currency.balances.set(toKey, toBalance + amount);
      }

      const result = await appendOperation("currency", {
        type: "TRANSFER",
        currencyId,
        fromPublicKey: fromKeyStr,
        toPublicKey: toKeyStr,
        amount,
      });

      return result;
    },

    getCurrencyBalance(currencyId, userPublicKey) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      const key = `${currencyId}_${keyStr}`;
      return state.currency.balances.get(key) || 0;
    },

    // Resource system methods
    async addResource(userPublicKey, resourceId, quantity) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      // Update local state immediately for fast feedback
      if (!state.resources.inventory.has(keyStr)) {
        state.resources.inventory.set(keyStr, new Map());
      }
      const userInventory = state.resources.inventory.get(keyStr);
      const currentQuantity = userInventory.get(resourceId) || 0;
      userInventory.set(resourceId, currentQuantity + quantity);

      const result = await appendOperation("resource", {
        type: "ADD_RESOURCE",
        userPublicKey: keyStr,
        resourceId,
        quantity,
      });

      return result;
    },

    getResourceQuantity(userPublicKey, resourceId) {
      const keyStr = Buffer.isBuffer(userPublicKey)
        ? userPublicKey.toString("hex")
        : userPublicKey;

      const userInventory = state.resources.inventory.get(keyStr);
      if (!userInventory) return 0;
      return userInventory.get(resourceId) || 0;
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
