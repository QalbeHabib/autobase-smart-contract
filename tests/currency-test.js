// Test file for currency persistence with Autobase

const Corestore = require("corestore");
const Autobase = require("autobase");
const { createCurrencySystem } = require("../src/currency");
const { createIdentity } = require("../src/identity");

async function runCurrencyTest() {
  console.log("Starting currency persistence test...");

  // Setup Corestore
  const store = new Corestore("./tests/test-data/currency");
  await store.ready();
  console.log("Corestore ready");

  // Create identities for testing with seed strings
  const alice = createIdentity("alice-test-seed").setDisplayName("Alice");
  const bob = createIdentity("bob-test-seed").setDisplayName("Bob");
  console.log("Created test identities");

  // Store public keys for later lookup
  const alicePublicKey = alice.publicIdentity.publicKey.toString("hex");
  const bobPublicKey = bob.publicIdentity.publicKey.toString("hex");
  console.log(`Alice public key: ${alicePublicKey.substring(0, 10)}...`);
  console.log(`Bob public key: ${bobPublicKey.substring(0, 10)}...`);

  // Define handlers for Autobase
  const applyHandler = async (nodes, view, host) => {
    for (const node of nodes) {
      if (!node || !node.value) continue;

      try {
        // Parse the operation if it's a string
        const operation =
          typeof node.value === "string" ? JSON.parse(node.value) : node.value;

        if (operation.system === "currency" && operation.data) {
          console.log(`Processing ${operation.data.type} currency operation`);
          currencySystem.updateFromOperation(operation);
        }

        // Store operations in the view
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
    return store.get("currency-view");
  };

  // Create Autobase
  const autobase = new Autobase(store, null, {
    apply: applyHandler,
    open: openHandler,
    valueEncoding: "json",
  });

  await autobase.ready();
  console.log("Autobase ready");

  console.log(
    "\n-- First Run: Creating currency and performing transactions --"
  );

  // Create currency system
  const currencySystem = createCurrencySystem(autobase, {
    name: "TestCoin",
    symbol: "TCN",
    decimals: 2,
    maxSupply: 1000000,
  });
  console.log("Currency system created");

  // Wait for initialization
  console.log("Waiting for initialization...");
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Mint coins to Alice
  console.log(`\nMinting 1000 TestCoins to Alice...`);
  const mintSuccess = currencySystem.mint(alicePublicKey, 1000, alice);
  console.log(`Mint result: ${mintSuccess ? "SUCCESS" : "FAILED"}`);

  // Check balance
  let aliceBalance = currencySystem.balanceOf(alicePublicKey);
  console.log(`Alice's balance: ${aliceBalance} TCN`);

  // Transfer coins to Bob
  console.log(`\nTransferring 250 TestCoins from Alice to Bob...`);
  const transferSuccess = currencySystem.transfer(
    alicePublicKey,
    bobPublicKey,
    250
  );
  console.log(`Transfer result: ${transferSuccess ? "SUCCESS" : "FAILED"}`);

  // Check balances
  aliceBalance = currencySystem.balanceOf(alicePublicKey);
  let bobBalance = currencySystem.balanceOf(bobPublicKey);
  console.log(`Alice's balance: ${aliceBalance} TCN`);
  console.log(`Bob's balance: ${bobBalance} TCN`);

  // Burn some coins
  console.log(`\nBurning 50 TestCoins from Bob...`);
  const burnSuccess = currencySystem.burn(bobPublicKey, 50, bob);
  console.log(`Burn result: ${burnSuccess ? "SUCCESS" : "FAILED"}`);

  bobBalance = currencySystem.balanceOf(bobPublicKey);
  console.log(`Bob's balance after burn: ${bobBalance} TCN`);

  // Wait for operations to complete
  console.log("\nWaiting for operations to be processed...");
  if (typeof autobase.update === "function") {
    await autobase.update();
  }
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Close the store
  await store.close();
  console.log("\n-- Simulating restart: Closing and reopening Autobase --");

  // Reopen everything
  const newStore = new Corestore("./tests/test-data/currency");
  await newStore.ready();
  console.log("Corestore reopened");

  // Recreate identities with same seeds for consistency
  const aliceReloaded =
    createIdentity("alice-test-seed").setDisplayName("Alice");
  const bobReloaded = createIdentity("bob-test-seed").setDisplayName("Bob");

  // Create new Autobase with same configuration
  const newApplyHandler = async (nodes, view, host) => {
    for (const node of nodes) {
      if (!node || !node.value) continue;

      try {
        const operation =
          typeof node.value === "string" ? JSON.parse(node.value) : node.value;

        if (operation.system === "currency" && operation.data) {
          console.log(`Processing ${operation.data.type} currency operation`);
          newCurrencySystem.updateFromOperation(operation);
        }

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

  const newOpenHandler = (store) => {
    return store.get("currency-view");
  };

  const newAutobase = new Autobase(newStore, null, {
    apply: newApplyHandler,
    open: newOpenHandler,
    valueEncoding: "json",
  });

  await newAutobase.ready();
  console.log("New Autobase ready");

  // Create a new currency system
  const newCurrencySystem = createCurrencySystem(newAutobase, {
    name: "TestCoin",
    symbol: "TCN",
    decimals: 2,
    maxSupply: 1000000,
  });
  console.log("New currency system created");

  // Force initialization
  console.log("\nForce initializing currency system to load operations...");
  await newCurrencySystem.forceInitialize();

  // Update to process existing operations
  if (typeof newAutobase.update === "function") {
    await newAutobase.update();
  }

  // Wait for loading
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Check if balances were restored
  console.log("\n-- After restart: Checking if balances were restored --");
  const restoredAliceBalance = newCurrencySystem.balanceOf(alicePublicKey);
  const restoredBobBalance = newCurrencySystem.balanceOf(bobPublicKey);

  console.log(`Alice's balance after restart: ${restoredAliceBalance} TCN`);
  console.log(`Bob's balance after restart: ${restoredBobBalance} TCN`);

  // Verify persistence
  console.log("\n-- Persistence verification --");
  if (
    restoredAliceBalance === aliceBalance &&
    restoredBobBalance === bobBalance
  ) {
    console.log(
      "✅ PERSISTENCE TEST PASSED: Balances were correctly restored after restart"
    );
  } else {
    console.log(
      "❌ PERSISTENCE TEST FAILED: Balances did not match after restart"
    );
    console.log(
      `Expected Alice: ${aliceBalance}, got: ${restoredAliceBalance}`
    );
    console.log(`Expected Bob: ${bobBalance}, got: ${restoredBobBalance}`);
  }

  // Show transaction history
  console.log("\nTransaction history after restart:");
  const transactions = newCurrencySystem.getTransactions();
  console.log(`Total transactions: ${transactions.length}`);
  if (transactions.length > 0) {
    // Show only the last 3 transactions if there are many
    const lastTransactions =
      transactions.length > 3
        ? transactions.slice(transactions.length - 3)
        : transactions;

    console.log("Last transactions:");
    lastTransactions.forEach((tx, index) => {
      const actualIndex =
        transactions.length > 3
          ? transactions.length - 3 + index + 1
          : index + 1;
      console.log(
        `Transaction ${actualIndex}: ${tx.type}, Amount: ${tx.amount}, Status: ${tx.status}`
      );
    });
  }

  // Clean up
  await newStore.close();
  console.log("\nCurrency test completed.");
}

// Run the test
runCurrencyTest().catch((err) => console.error("Error in currency test:", err));
