const crypto = require("crypto");
const b4a = require("b4a");

/**
 * Identity Management Module
 *
 * This module provides functionality for creating and managing seed-based identities
 * that work across multiple devices.
 */

/**
 * Creates a deterministic key pair from a seed phrase
 * @param {string} seed - The seed phrase to derive the key from
 * @returns {Object} The generated key pair with publicKey and privateKey
 */
function deriveKeyPairFromSeed(seed) {
  // Create a deterministic hash from the seed
  const hash = crypto.createHash("sha256").update(seed).digest();

  // Use the hash to generate a key pair
  // In a real implementation, we would use a proper key derivation function
  // This is a simplified version for demonstration
  const keyPair = crypto.generateKeyPairSync("ed25519", {
    privateKey: hash,
  });

  return {
    publicKey: keyPair.publicKey.export({ type: "spki", format: "der" }),
    privateKey: keyPair.privateKey.export({ type: "pkcs8", format: "der" }),
  };
}

/**
 * Signs data with a private key
 * @param {Buffer} data - The data to sign
 * @param {Buffer} privateKey - The private key to sign with
 * @returns {Buffer} The signature
 */
function sign(data, privateKey) {
  const key = crypto.createPrivateKey({
    key: privateKey,
    format: "der",
    type: "pkcs8",
  });

  const signature = crypto.sign(null, data, key);
  return signature;
}

/**
 * Verifies a signature
 * @param {Buffer} data - The data that was signed
 * @param {Buffer} signature - The signature to verify
 * @param {Buffer} publicKey - The public key to verify with
 * @returns {boolean} True if the signature is valid
 */
function verify(data, signature, publicKey) {
  const key = crypto.createPublicKey({
    key: publicKey,
    format: "der",
    type: "spki",
  });

  return crypto.verify(null, data, key, signature);
}

/**
 * Creates a device key for the current device
 * @returns {Object} The device key pair
 */
function generateDeviceKey() {
  const keyPair = crypto.generateKeyPairSync("ed25519");

  return {
    publicKey: keyPair.publicKey.export({ type: "spki", format: "der" }),
    privateKey: keyPair.privateKey.export({ type: "pkcs8", format: "der" }),
  };
}

/**
 * Creates a user identity from a seed phrase
 * @param {string} seed - The seed phrase
 * @returns {Object} The user identity object
 */
function createIdentity(seed) {
  const masterKeyPair = deriveKeyPairFromSeed(seed);
  const deviceKeyPair = generateDeviceKey();

  // Create an authorization signature for the device key
  // This proves the device key is authorized by the master key
  const devicePublicKeyBuffer = b4a.from(deviceKeyPair.publicKey);
  const authSignature = sign(devicePublicKeyBuffer, masterKeyPair.privateKey);

  return {
    // The public identity that others will see
    publicIdentity: {
      publicKey: masterKeyPair.publicKey,
      displayName: null, // Can be set later
    },

    // Private keys that should never be shared
    privateIdentity: {
      masterPrivateKey: masterKeyPair.privateKey,
      deviceKeyPair,
      authSignature,
    },

    // Utility functions on the identity
    setDisplayName(name) {
      this.publicIdentity.displayName = name;
      return this;
    },

    // Sign data with the identity
    sign(data) {
      return sign(b4a.from(data), this.privateIdentity.masterPrivateKey);
    },

    // Sign data with the device key
    signWithDevice(data) {
      return sign(
        b4a.from(data),
        this.privateIdentity.deviceKeyPair.privateKey
      );
    },

    // Get the authorization proof for this device
    getDeviceAuthorizationProof() {
      return {
        masterPublicKey: this.publicIdentity.publicKey,
        devicePublicKey: this.privateIdentity.deviceKeyPair.publicKey,
        authSignature: this.privateIdentity.authSignature,
      };
    },
  };
}

/**
 * Creates an identity registry for managing device keys
 * @param {Object} autobase - The autobase instance
 * @returns {Object} The identity registry
 */
function createIdentityRegistry(autobase) {
  // Store the actual registry in memory
  // This map will be updated from Autobase operations
  const authorizedDevices = new Map();

  // Flag to track if the registry is initialized from Autobase
  let isInitialized = false;

  /**
   * Initialize the registry by processing existing operations in Autobase
   * @returns {Promise<void>}
   */
  async function initialize() {
    if (isInitialized || !autobase) return;

    try {
      console.log("Initializing identity registry from Autobase...");

      // Trigger Autobase update to process existing operations
      if (typeof autobase.update === "function") {
        await autobase.update();
      }

      isInitialized = true;
      console.log("Identity registry initialized");
    } catch (error) {
      console.error("Failed to initialize identity registry:", error);
    }
  }

  /**
   * Function to write a device registration to autobase
   * @param {string|Buffer} masterPublicKey - The master public key
   * @param {string|Buffer} devicePublicKey - The device public key
   * @param {string|Buffer} authSignature - The authorization signature
   * @returns {Promise<boolean>} Success status
   */
  async function writeDeviceRegistration(
    masterPublicKey,
    devicePublicKey,
    authSignature
  ) {
    try {
      // Convert all inputs to hex strings if they're buffers
      const masterKeyHex = Buffer.isBuffer(masterPublicKey)
        ? masterPublicKey.toString("hex")
        : masterPublicKey;

      const deviceKeyHex = Buffer.isBuffer(devicePublicKey)
        ? devicePublicKey.toString("hex")
        : devicePublicKey;

      const authSigHex = Buffer.isBuffer(authSignature)
        ? authSignature.toString("hex")
        : authSignature;

      // Create the operation object
      const operation = {
        system: "identity",
        data: {
          type: "REGISTER_DEVICE",
          masterPublicKey: masterKeyHex,
          devicePublicKey: deviceKeyHex,
          authSignature: authSigHex,
        },
        timestamp: Date.now(),
      };

      // Append to autobase if it's available
      if (autobase) {
        if (typeof autobase.append === "function") {
          await autobase.append(operation);
          console.log("Device registration written to Autobase");
          return true;
        } else {
          console.warn("Autobase does not have an append method");
          return false;
        }
      } else {
        console.warn("No autobase instance provided");
        return false;
      }
    } catch (error) {
      console.error("Error registering device:", error);
      return false;
    }
  }

  // Initialize the registry if autobase is provided
  if (autobase) {
    // Schedule initialization after current execution context
    setTimeout(() => {
      initialize().catch((err) => console.error("Initialization error:", err));
    }, 0);
  }

  return {
    /**
     * Register a device key
     * @param {Buffer|string} masterPublicKey - The master public key
     * @param {Buffer|string} devicePublicKey - The device public key to register
     * @param {Buffer|string} authSignature - The authorization signature
     * @returns {boolean} Success status
     */
    registerDevice(masterPublicKey, devicePublicKey, authSignature) {
      try {
        // Convert buffers to hex strings for storage
        const masterKeyHex = Buffer.isBuffer(masterPublicKey)
          ? masterPublicKey.toString("hex")
          : masterPublicKey;

        const deviceKeyHex = Buffer.isBuffer(devicePublicKey)
          ? devicePublicKey.toString("hex")
          : devicePublicKey;

        // Verify the device key is authorized by the master key if both are buffers
        if (
          Buffer.isBuffer(masterPublicKey) &&
          Buffer.isBuffer(devicePublicKey) &&
          Buffer.isBuffer(authSignature)
        ) {
          if (!verify(devicePublicKey, authSignature, masterPublicKey)) {
            throw new Error("Invalid device authorization");
          }
        }

        // Add to in-memory registry
        if (!authorizedDevices.has(masterKeyHex)) {
          authorizedDevices.set(masterKeyHex, new Set());
        }

        authorizedDevices.get(masterKeyHex).add(deviceKeyHex);
        console.log(
          `Device ${deviceKeyHex.slice(
            0,
            10
          )}... registered for ${masterKeyHex.slice(0, 10)}...`
        );

        // Write to autobase if available (async, but we don't wait for it)
        if (autobase) {
          writeDeviceRegistration(
            masterKeyHex,
            deviceKeyHex,
            Buffer.isBuffer(authSignature)
              ? authSignature.toString("hex")
              : authSignature
          ).catch((err) => {
            console.error(
              "Failed to write device registration to autobase:",
              err
            );
          });
        }

        return true;
      } catch (error) {
        console.error("Error in registerDevice:", error);
        return false;
      }
    },

    /**
     * Check if a device is authorized for a master key
     * @param {Buffer|string} masterPublicKey - The master public key
     * @param {Buffer|string} devicePublicKey - The device public key to check
     * @returns {boolean} True if the device is authorized
     */
    isAuthorizedDevice(masterPublicKey, devicePublicKey) {
      try {
        const masterKeyHex = Buffer.isBuffer(masterPublicKey)
          ? masterPublicKey.toString("hex")
          : masterPublicKey;

        const deviceKeyHex = Buffer.isBuffer(devicePublicKey)
          ? devicePublicKey.toString("hex")
          : devicePublicKey;

        const devices = authorizedDevices.get(masterKeyHex);
        return Boolean(devices && devices.has(deviceKeyHex));
      } catch (error) {
        console.error("Error in isAuthorizedDevice:", error);
        return false;
      }
    },

    /**
     * Get all device public keys for an identity
     * @param {Buffer|string} masterPublicKey - The master public key
     * @returns {Array<string>} Array of device public keys
     */
    getDevicesForIdentity(masterPublicKey) {
      try {
        const masterKeyHex = Buffer.isBuffer(masterPublicKey)
          ? masterPublicKey.toString("hex")
          : masterPublicKey;

        return Array.from(authorizedDevices.get(masterKeyHex) || []);
      } catch (error) {
        console.error("Error in getDevicesForIdentity:", error);
        return [];
      }
    },

    /**
     * Update the registry from an autobase operation
     * @param {Object} operation - The operation from autobase
     * @returns {boolean} Success status
     */
    updateFromOperation(operation) {
      try {
        if (
          operation.system === "identity" &&
          operation.data &&
          operation.data.type === "REGISTER_DEVICE"
        ) {
          const { masterPublicKey, devicePublicKey } = operation.data;

          // Ensure master key entry exists
          if (!authorizedDevices.has(masterPublicKey)) {
            authorizedDevices.set(masterPublicKey, new Set());
          }

          // Add device to authorized set
          authorizedDevices.get(masterPublicKey).add(devicePublicKey);
          console.log(
            `Applied operation: registered device ${devicePublicKey.slice(
              0,
              10
            )}... for identity ${masterPublicKey.slice(0, 10)}...`
          );

          return true;
        }
        return false;
      } catch (error) {
        console.error("Error applying operation:", error);
        return false;
      }
    },

    /**
     * Force initialization of the registry
     * @returns {Promise<void>}
     */
    async forceInitialize() {
      return initialize();
    },
  };
}

module.exports = {
  createIdentity,
  createIdentityRegistry,
  sign,
  verify,
  deriveKeyPairFromSeed,
  generateDeviceKey,
};
