/**
 * Test Script for Identity Registry with Autobase 7.5.0
 */

const Corestore = require("corestore");
const Autobase = require("autobase");
const identity = require("./src/identity");

async function runTest() {
  console.log("Starting Identity Registry Test");
  console.log("===============================\n");

  // Create the storage
  const store = new Corestore("./test-data");
  await store.ready();
  console.log("Corestore is ready");

  // Create Autobase instance
  const autobase = new Autobase(store, null, {
    open: (store) => store.get("identity-registry"),
    apply: async (nodes, view, host) => {
      for (const node of nodes) {
        if (!node || !node.value) continue;

        const operation = node.value;
        if (!operation || !operation.system) continue;

        // Only handle identity operations
        if (operation.system === "identity") {
          console.log(`Processing identity operation: ${operation.data.type}`);

          if (operation.data.type === "REGISTER_DEVICE") {
            const { masterPublicKey, devicePublicKey } = operation.data;
            console.log(
              `Registering device ${devicePublicKey.slice(
                0,
                10
              )}... for identity ${masterPublicKey.slice(0, 10)}...`
            );

            // Update our registry with this operation
            if (typeof registry !== "undefined") {
              registry.updateFromOperation(operation);
            }
          }
        }

        // Store the JSON serialized operation
        await view.append(JSON.stringify(operation));
      }
    },
    valueEncoding: "json",
  });

  await autobase.ready();
  console.log("Autobase is ready");

  // Create test identities
  const alice = identity.createIdentity("alice seed").setDisplayName("Alice");
  const bob = identity.createIdentity("bob seed").setDisplayName("Bob");

  console.log(
    `Created identity for ${
      alice.publicIdentity.displayName
    } with public key: ${alice.publicIdentity.publicKey
      .toString("hex")
      .slice(0, 10)}...`
  );
  console.log(
    `Created identity for ${
      bob.publicIdentity.displayName
    } with public key: ${bob.publicIdentity.publicKey
      .toString("hex")
      .slice(0, 10)}...`
  );

  // Create identity registry
  const registry = identity.createIdentityRegistry(autobase);
  console.log("Created identity registry");

  // Register Alice's device
  console.log("\nRegistering Alice's device...");
  const aliceResult = registry.registerDevice(
    alice.publicIdentity.publicKey,
    alice.privateIdentity.deviceKeyPair.publicKey,
    alice.privateIdentity.authSignature
  );
  console.log(`Registration result: ${aliceResult}`);

  // Wait a bit for the Autobase append to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Register Bob's device
  console.log("\nRegistering Bob's device...");
  const bobResult = registry.registerDevice(
    bob.publicIdentity.publicKey,
    bob.privateIdentity.deviceKeyPair.publicKey,
    bob.privateIdentity.authSignature
  );
  console.log(`Registration result: ${bobResult}`);

  // Wait a bit for the Autobase append to complete
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Check device authorization
  console.log("\nChecking authorization status...");

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

  // Get devices for Alice's identity
  console.log("\nGetting devices for Alice's identity...");
  const aliceDevices = registry.getDevicesForIdentity(
    alice.publicIdentity.publicKey
  );
  console.log(`Number of devices: ${aliceDevices.length}`);

  // Update autobase to process all operations
  console.log("\nUpdating autobase to process all events...");
  try {
    await autobase.update();
    console.log("Autobase updated successfully");
  } catch (error) {
    console.error("Error updating autobase:", error.message);
  }

  console.log("\nIdentity Registry Test Completed");
}

// Run the test
runTest().catch((error) => {
  console.error("Error running test:", error);
});
