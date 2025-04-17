/**
 * Persistence Test for Identity Registry with Autobase 7.5.0
 *
 * This test verifies that device registrations are properly stored in Autobase
 * and can be reconstructed after restarting the application.
 */

const Corestore = require("corestore");
const Autobase = require("autobase");
const identity = require("../src/identity");
const b4a = require("b4a");

// Global registry for tracking identities created in this test
const testIdentities = {};

async function simulateFirstRun() {
  console.log("=== FIRST RUN ===");
  console.log("Creating fresh autobase instance and registering devices\n");

  // Create the storage
  const store = new Corestore("./tests/test-data/persistence");
  await store.ready();

  // Create Autobase instance
  const autobase = new Autobase(store, null, {
    open: (store) => store.get("identity-registry"),
    apply: async (nodes, view, host) => {
      for (const node of nodes) {
        if (!node || !node.value) continue;

        // Parse the operation from JSON string if needed
        let operation;
        try {
          operation =
            typeof node.value === "string"
              ? JSON.parse(node.value)
              : node.value;
        } catch (err) {
          continue;
        }

        if (!operation || !operation.system) continue;

        // Only handle identity operations
        if (operation.system === "identity") {
          console.log(`Processing identity operation: ${operation.data.type}`);

          // Update registry
          if (registry && typeof registry.updateFromOperation === "function") {
            registry.updateFromOperation(operation);
          }
        }

        // Store the operation
        if (typeof node.value === "string") {
          await view.append(node.value);
        } else {
          await view.append(JSON.stringify(operation));
        }
      }
    },
    valueEncoding: "json",
  });

  await autobase.ready();
  console.log("Autobase initialized");

  // Create test identities
  const alice = identity
    .createIdentity("alice persistence test")
    .setDisplayName("Alice");
  const bob = identity
    .createIdentity("bob persistence test")
    .setDisplayName("Bob");

  // Save identities for later use
  testIdentities.alice = {
    masterPublicKey: alice.publicIdentity.publicKey.toString("hex"),
    devicePublicKey:
      alice.privateIdentity.deviceKeyPair.publicKey.toString("hex"),
  };

  testIdentities.bob = {
    masterPublicKey: bob.publicIdentity.publicKey.toString("hex"),
    devicePublicKey:
      bob.privateIdentity.deviceKeyPair.publicKey.toString("hex"),
  };

  console.log("Created test identities");

  // Create identity registry
  const registry = identity.createIdentityRegistry(autobase);
  console.log("Identity registry created");

  // Register devices
  console.log("\nRegistering devices:");
  const aliceResult = registry.registerDevice(
    alice.publicIdentity.publicKey,
    alice.privateIdentity.deviceKeyPair.publicKey,
    alice.privateIdentity.authSignature
  );
  console.log(`Alice's device registration result: ${aliceResult}`);

  const bobResult = registry.registerDevice(
    bob.publicIdentity.publicKey,
    bob.privateIdentity.deviceKeyPair.publicKey,
    bob.privateIdentity.authSignature
  );
  console.log(`Bob's device registration result: ${bobResult}`);

  // Check device authorization
  console.log("\nChecking authorization before restart:");
  const aliceAuth = registry.isAuthorizedDevice(
    alice.publicIdentity.publicKey,
    alice.privateIdentity.deviceKeyPair.publicKey
  );
  console.log(`Is Alice's device authorized? ${aliceAuth}`);

  const bobAuth = registry.isAuthorizedDevice(
    bob.publicIdentity.publicKey,
    bob.privateIdentity.deviceKeyPair.publicKey
  );
  console.log(`Is Bob's device authorized? ${bobAuth}`);

  // Make sure updates are processed
  console.log("\nUpdating Autobase...");
  await autobase.update();

  // Allow some time for operations to be processed
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Get all devices for Alice to verify
  const aliceDevices = registry.getDevicesForIdentity(
    alice.publicIdentity.publicKey
  );
  console.log(`Number of devices for Alice: ${aliceDevices.length}`);

  // Clean shutdown
  await store.close();
  console.log("First run complete - autobase closed");
}

async function simulateRestart() {
  console.log("\n=== RESTART ===");
  console.log("Recreating autobase instance and checking persistent data\n");

  // Create the storage again
  const store = new Corestore("./tests/test-data/persistence");
  await store.ready();
  console.log("Reopened corestore");

  // Create a variable to hold our registry instance
  let registry;

  // Create Autobase instance with same configuration
  const autobase = new Autobase(store, null, {
    open: (store) => store.get("identity-registry"),
    apply: async (nodes, view, host) => {
      for (const node of nodes) {
        if (!node || !node.value) continue;

        // Parse the operation from JSON string if needed
        let operation;
        try {
          operation =
            typeof node.value === "string"
              ? JSON.parse(node.value)
              : node.value;
        } catch (err) {
          continue;
        }

        if (!operation || !operation.system) continue;

        // Only handle identity operations
        if (operation.system === "identity") {
          console.log(`Reapplying identity operation: ${operation.data.type}`);

          // Update registry
          if (registry && typeof registry.updateFromOperation === "function") {
            registry.updateFromOperation(operation);
          }
        }

        // Store the operation
        if (typeof node.value === "string") {
          await view.append(node.value);
        } else {
          await view.append(JSON.stringify(operation));
        }
      }
    },
    valueEncoding: "json",
  });

  await autobase.ready();
  console.log("Autobase reinitialized");

  // Create identity registry
  registry = identity.createIdentityRegistry(autobase);
  console.log("Identity registry recreated");

  // Force initialization to load existing operations
  await registry.forceInitialize();

  // Make sure all existing operations are applied
  console.log("Updating autobase to apply existing operations...");
  await autobase.update();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check device authorization using the stored public keys
  console.log("\nChecking persistence of device registrations:");

  // Convert hex strings back to buffers for the checks
  const aliceMasterKey = b4a.from(testIdentities.alice.masterPublicKey, "hex");
  const aliceDeviceKey = b4a.from(testIdentities.alice.devicePublicKey, "hex");
  const bobMasterKey = b4a.from(testIdentities.bob.masterPublicKey, "hex");
  const bobDeviceKey = b4a.from(testIdentities.bob.devicePublicKey, "hex");

  // Check if devices are still authorized after restart
  const aliceAuth = registry.isAuthorizedDevice(aliceMasterKey, aliceDeviceKey);
  console.log(`Is Alice's device still authorized? ${aliceAuth}`);

  const bobAuth = registry.isAuthorizedDevice(bobMasterKey, bobDeviceKey);
  console.log(`Is Bob's device still authorized? ${bobAuth}`);

  // Get all devices for Alice
  const aliceDevices = registry.getDevicesForIdentity(aliceMasterKey);
  console.log(`Number of devices registered for Alice: ${aliceDevices.length}`);

  // Clean shutdown
  await store.close();
  console.log("\nPersistence test complete");
}

// Run both simulations in sequence
async function runPersistenceTest() {
  try {
    await simulateFirstRun();
    await simulateRestart();
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

runPersistenceTest();
