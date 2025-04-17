/**
 * Simple Integration Test for Identity Registry with Autobase
 */

const Corestore = require("corestore");
const Autobase = require("autobase");
const identity = require("./src/identity");
const b4a = require("b4a");

async function main() {
  // Setup corestore and autobase
  const store = new Corestore("./autobase-test-data");
  await store.ready();
  console.log("Corestore ready");

  // Create our view and handlers for Autobase
  const applyHandler = async (nodes, view, host) => {
    for (const node of nodes) {
      if (!node || !node.value) continue;

      try {
        // Parse the operation if it's a string
        const operation =
          typeof node.value === "string" ? JSON.parse(node.value) : node.value;

        if (operation.system === "identity" && operation.data) {
          console.log(`Processing ${operation.data.type} operation`);

          // Handle device registration
          if (operation.data.type === "REGISTER_DEVICE") {
            const { masterPublicKey, devicePublicKey } = operation.data;
            console.log(
              `Registering device ${devicePublicKey.substring(
                0,
                10
              )}... for identity ${masterPublicKey.substring(0, 10)}...`
            );
          }
        }

        // Store all operations in the view
        await view.append(
          typeof node.value === "string"
            ? node.value
            : JSON.stringify(node.value)
        );
      } catch (error) {
        console.error("Error processing node:", error);
      }
    }
  };

  const openHandler = (store) => {
    return store.get("identity-view");
  };

  // Create a new Autobase instance
  const autobase = new Autobase(store, null, {
    apply: applyHandler,
    open: openHandler,
    valueEncoding: "json",
  });

  await autobase.ready();
  console.log("Autobase ready");

  // Create a test identity
  const user = identity.createIdentity("test seed phrase");
  user.setDisplayName("Test User");
  console.log(`Created identity with name: ${user.publicIdentity.displayName}`);

  // Create our identity registry
  const registry = identity.createIdentityRegistry(autobase);
  console.log("Created identity registry");

  // Register the user's device
  console.log("\nRegistering device...");
  const result = registry.registerDevice(
    user.publicIdentity.publicKey,
    user.privateIdentity.deviceKeyPair.publicKey,
    user.privateIdentity.authSignature
  );
  console.log(`Registration result: ${result}`);

  // Verify registration
  console.log("\nVerifying device authorization...");
  const isAuthorized = registry.isAuthorizedDevice(
    user.publicIdentity.publicKey,
    user.privateIdentity.deviceKeyPair.publicKey
  );
  console.log(`Is device authorized? ${isAuthorized}`);

  // Ensure operation is written to Autobase
  console.log("\nWaiting for Autobase operations to complete...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log("\nExample completed successfully");
}

main().catch((error) => {
  console.error("Error running example:", error);
});
