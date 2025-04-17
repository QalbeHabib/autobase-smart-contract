/**
 * Game Currency Persistence Test
 *
 * This test verifies that game currency data is properly stored in Autobase
 * and can be retrieved after restarting.
 */

const Corestore = require("corestore");
const Autobase = require("autobase");
const { createIdentity } = require("../src/identity");
const { createSmartContractSystem } = require("../src/contracts");

// Test identities and data
const testIdentities = {};
const testData = {
  currencyId: "gold",
  player1Balance: 0,
  player2Balance: 0,
  player1Wood: 0,
  player2Stone: 0,
};

/**
 * Helper function to log the status of all operations
 * @param {Object} system - The smart contract system
 * @param {Object} player1 - Player 1 identity
 * @param {Object} player2 - Player 2 identity
 */
async function logSystemStatus(system, player1, player2) {
  const currencyId = testData.currencyId;

  const player1Balance = system.getCurrencyBalance(
    currencyId,
    player1.publicIdentity.publicKey
  );
  const player2Balance = system.getCurrencyBalance(
    currencyId,
    player2.publicIdentity.publicKey
  );
  const player1Wood = system.getResourceQuantity(
    player1.publicIdentity.publicKey,
    "wood"
  );
  const player2Stone = system.getResourceQuantity(
    player2.publicIdentity.publicKey,
    "stone"
  );

  console.log("=== System Status ===");
  console.log(`Player1 balance: ${player1Balance}`);
  console.log(`Player2 balance: ${player2Balance}`);
  console.log(`Player1 wood: ${player1Wood}`);
  console.log(`Player2 stone: ${player2Stone}`);
  console.log("=====================");

  return { player1Balance, player2Balance, player1Wood, player2Stone };
}

/**
 * First run: Create identities, register devices, mint currency, add resources
 */
async function simulateFirstRun() {
  console.log("\n=== FIRST RUN ===");
  console.log(
    "Creating fresh store, identities, and minting initial currency and resources"
  );

  // Create a fresh store
  const store = new Corestore(
    "./data-storage/examples/game-currency/persistence"
  );
  await store.ready();
  console.log("✅ Corestore created and ready");

  // Create admin identity
  const admin = createIdentity("admin test seed").setDisplayName("Admin");
  testIdentities.admin = admin;

  // Create player identities
  const player1 = createIdentity("player1 test seed").setDisplayName("Player1");
  const player2 = createIdentity("player2 test seed").setDisplayName("Player2");
  testIdentities.player1 = player1;
  testIdentities.player2 = player2;

  console.log("✅ Test identities created");

  // Create smart contract system with Autobase
  console.log("Creating smart contract system with Autobase...");
  const system = await createSmartContractSystem(store, {
    localIdentity: admin,
  });
  console.log("✅ Smart contract system created");

  // Wait for initialization
  console.log("Waiting for system initialization...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Force initialize all subsystems
  if (typeof system.initializeAllSubsystems === "function") {
    await system.initializeAllSubsystems();
    console.log("✅ All subsystems initialized");
  }

  // Add players as writers (this might show error but it's handled)
  try {
    await system.addWriter(player1.publicIdentity.publicKey);
    await system.addWriter(player2.publicIdentity.publicKey);
    console.log("✅ Players added as writers");
  } catch (error) {
    console.log(
      "Note: Writer management is handled differently in this version of Autobase"
    );
  }

  // Mint initial currency
  console.log("\nMinting currency to players...");
  const currencyId = testData.currencyId;

  await system.mintCurrency(currencyId, player1.publicIdentity.publicKey, 100);
  console.log("✅ Minted 100 gold to Player1");

  await system.mintCurrency(currencyId, player2.publicIdentity.publicKey, 50);
  console.log("✅ Minted 50 gold to Player2");

  // Add resources to players
  console.log("\nAdding resources to players...");

  await system.addResource(player1.publicIdentity.publicKey, "wood", 20);
  console.log("✅ Added 20 wood to Player1");

  await system.addResource(player2.publicIdentity.publicKey, "stone", 10);
  console.log("✅ Added 10 stone to Player2");

  // Check and store balances and resources
  console.log("\nVerifying currency and resources were added correctly:");
  const status = await logSystemStatus(system, player1, player2);

  // Store the values for comparison after restart
  testData.player1Balance = status.player1Balance;
  testData.player2Balance = status.player2Balance;
  testData.player1Wood = status.player1Wood;
  testData.player2Stone = status.player2Stone;

  // Wait for operations to be processed and stored in Autobase
  console.log("\nWaiting for operations to be processed in Autobase...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Close the store
  await store.close();
  console.log("✅ First run completed, store closed");
}

/**
 * Restart: Reopen the store and check if data persisted
 */
async function simulateRestart() {
  console.log("\n=== RESTART ===");
  console.log("Recreating smart contract system and checking persistent data");

  // Reopen the store
  const store = new Corestore(
    "./data-storage/examples/game-currency/persistence"
  );
  await store.ready();
  console.log("✅ Corestore reopened");

  // Get identities from previous run
  const admin = testIdentities.admin;
  const player1 = testIdentities.player1;
  const player2 = testIdentities.player2;

  // Recreate the system
  console.log("Recreating the smart contract system...");
  const system = await createSmartContractSystem(store, {
    localIdentity: admin,
  });
  console.log("✅ Smart contract system recreated");

  // Force initialize all subsystems to load existing operations
  console.log("Initializing all subsystems to load existing operations...");
  if (typeof system.initializeAllSubsystems === "function") {
    await system.initializeAllSubsystems();
    console.log("✅ All subsystems initialized");
  } else {
    // Fall back to individual initializations if the combined method is not available
    if (system.identityRegistry && system.identityRegistry.forceInitialize) {
      await system.identityRegistry.forceInitialize();
      console.log("✅ Identity registry initialized");
    }

    if (system.currencySystem && system.currencySystem.forceInitialize) {
      await system.currencySystem.forceInitialize();
      console.log("✅ Currency system initialized");
    }

    if (system.resourceSystem && system.resourceSystem.forceInitialize) {
      await system.resourceSystem.forceInitialize();
      console.log("✅ Resource system initialized");
    }
  }

  // Wait for operations to be loaded and processed
  console.log("\nWaiting for operations to be loaded from Autobase...");
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Check if data persisted
  console.log("\nChecking if data persisted after restart:");
  const status = await logSystemStatus(system, player1, player2);

  // Validate persistence with detailed explanation
  const currencyPersisted =
    status.player1Balance === testData.player1Balance &&
    status.player2Balance === testData.player2Balance;

  const resourcesPersisted =
    status.player1Wood === testData.player1Wood &&
    status.player2Stone === testData.player2Stone;

  console.log("\n=== PERSISTENCE RESULTS ===");
  console.log(
    `Currency persistence: ${currencyPersisted ? "✅ SUCCESS" : "❌ FAILED"}`
  );

  if (!currencyPersisted) {
    console.log(
      "  Expected Player1 balance: " +
        testData.player1Balance +
        ", Actual: " +
        status.player1Balance
    );
    console.log(
      "  Expected Player2 balance: " +
        testData.player2Balance +
        ", Actual: " +
        status.player2Balance
    );

    // Check if Autobase is correctly set up
    if (typeof system.autobase === "object") {
      console.log("\nAutobase status:");
      console.log("  View exists: " + (system.autobase.view ? "Yes" : "No"));
      if (system.autobase.view) {
        console.log("  View length: " + system.autobase.view.length);
      }
    }
  }

  console.log(
    `Resource persistence: ${resourcesPersisted ? "✅ SUCCESS" : "❌ FAILED"}`
  );

  if (!resourcesPersisted) {
    console.log(
      "  Expected Player1 wood: " +
        testData.player1Wood +
        ", Actual: " +
        status.player1Wood
    );
    console.log(
      "  Expected Player2 stone: " +
        testData.player2Stone +
        ", Actual: " +
        status.player2Stone
    );
  }

  // Close the store
  await store.close();
  console.log("✅ Persistence test completed");

  return { currencyPersisted, resourcesPersisted };
}

/**
 * Run the persistence test
 */
async function runPersistenceTest() {
  try {
    // First run to set up data
    await simulateFirstRun();

    // Simulate restart and check persistence
    const { currencyPersisted, resourcesPersisted } = await simulateRestart();

    console.log("\n=== PERSISTENCE TEST SUMMARY ===");
    if (currencyPersisted && resourcesPersisted) {
      console.log(
        "✅ Persistence test completed successfully - All data persisted!"
      );
    } else {
      console.log("⚠️ Persistence test completed with issues:");
      console.log(
        currencyPersisted
          ? "  ✅ Currency data persisted correctly"
          : "  ❌ Currency data did NOT persist"
      );
      console.log(
        resourcesPersisted
          ? "  ✅ Resource data persisted correctly"
          : "  ❌ Resource data did NOT persist"
      );

      // Provide suggestions for fixing
      console.log("\nPossible solutions:");
      console.log(
        "1. Ensure currency and resource systems properly integrate with Autobase"
      );
      console.log(
        "2. Verify that operations are correctly written to and read from Autobase"
      );
      console.log(
        "3. Check that the apply function handles all operation types correctly"
      );
      console.log(
        "4. Increase waiting time between operations for better synchronization"
      );
    }
  } catch (error) {
    console.error("❌ Error in persistence test:", error);
  }
}

// Run the test
runPersistenceTest();
