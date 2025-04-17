/**
 * Game Currency Example
 *
 * This example demonstrates how to use the smart contract system
 * to implement a game with in-game currency and resources.
 */

const Corestore = require("corestore");
const {
  createSmartContractSystem,
  createContractIdentity,
} = require("../../src/contracts");
const { createIdentity } = require("../../src/identity");

/**
 * Run the example
 */
async function runExample() {
  console.log("Starting Game Currency Example");
  console.log("==============================\n");

  // Create the storage
  const store = new Corestore("./examples/game-currency/data");
  await store.ready();

  // Create identity for admin
  const adminSeed = "admin secret seed phrase";
  const admin = createIdentity(adminSeed).setDisplayName("Admin");
  console.log(
    "Admin identity created with public key:",
    admin.publicIdentity.publicKey.toString("hex").substring(0, 10) + "..."
  );

  // Create the system with the admin as local identity
  const system = await createSmartContractSystem(store, {
    localIdentity: admin,
    writers: [],
  });

  console.log("Smart Contract System created");

  // Create player identities
  const player1 = createIdentity("player1 seed").setDisplayName("Player 1");
  const player2 = createIdentity("player2 seed").setDisplayName("Player 2");
  console.log("Player identities created");

  // Add players as writers
  await system.addWriter(player1.publicIdentity.publicKey);
  await system.addWriter(player2.publicIdentity.publicKey);
  console.log("Players added as writers");

  // Create game room permissions
  const gameRoom = "game-world";
  await system.setPermission(gameRoom, admin.publicIdentity.publicKey, "ADMIN");
  await system.setPermission(
    gameRoom,
    player1.publicIdentity.publicKey,
    "MEMBER"
  );
  await system.setPermission(
    gameRoom,
    player2.publicIdentity.publicKey,
    "MEMBER"
  );
  console.log("Game room permissions set");

  // Mint initial currency to players
  const currencyId = "gold";
  await system.mintCurrency(currencyId, player1.publicIdentity.publicKey, 100);
  await system.mintCurrency(currencyId, player2.publicIdentity.publicKey, 100);
  console.log("Initial currency minted to players");

  // Check player balances
  console.log(
    "Player 1 balance:",
    system.getCurrencyBalance(currencyId, player1.publicIdentity.publicKey)
  );
  console.log(
    "Player 2 balance:",
    system.getCurrencyBalance(currencyId, player2.publicIdentity.publicKey)
  );

  // Add some resources to players
  await system.addResource(player1.publicIdentity.publicKey, "wood", 10);
  await system.addResource(player1.publicIdentity.publicKey, "stone", 5);
  await system.addResource(player2.publicIdentity.publicKey, "wood", 5);
  await system.addResource(player2.publicIdentity.publicKey, "iron", 2);
  console.log("Resources added to players");

  // Check player resources
  console.log("Player 1 resources:");
  console.log(
    "  Wood:",
    system.getResourceQuantity(player1.publicIdentity.publicKey, "wood")
  );
  console.log(
    "  Stone:",
    system.getResourceQuantity(player1.publicIdentity.publicKey, "stone")
  );
  console.log(
    "  Iron:",
    system.getResourceQuantity(player1.publicIdentity.publicKey, "iron")
  );

  console.log("Player 2 resources:");
  console.log(
    "  Wood:",
    system.getResourceQuantity(player2.publicIdentity.publicKey, "wood")
  );
  console.log(
    "  Stone:",
    system.getResourceQuantity(player2.publicIdentity.publicKey, "stone")
  );
  console.log(
    "  Iron:",
    system.getResourceQuantity(player2.publicIdentity.publicKey, "iron")
  );

  // Simulate a player-to-player trade
  console.log("\nSimulating a player-to-player trade:");
  console.log("Player 1 gives 2 stone to Player 2 for 20 gold");

  // Player 1 gives stone to Player 2
  await system.addResource(player1.publicIdentity.publicKey, "stone", -2);
  await system.addResource(player2.publicIdentity.publicKey, "stone", 2);

  // Player 2 pays Player 1
  await system.transferCurrency(
    currencyId,
    player2.publicIdentity.publicKey,
    player1.publicIdentity.publicKey,
    20
  );

  // Check balances after trade
  console.log("\nAfter trade:");
  console.log(
    "Player 1 balance:",
    system.getCurrencyBalance(currencyId, player1.publicIdentity.publicKey)
  );
  console.log(
    "Player 2 balance:",
    system.getCurrencyBalance(currencyId, player2.publicIdentity.publicKey)
  );

  console.log(
    "Player 1 stone:",
    system.getResourceQuantity(player1.publicIdentity.publicKey, "stone")
  );
  console.log(
    "Player 2 stone:",
    system.getResourceQuantity(player2.publicIdentity.publicKey, "stone")
  );

  // Simulate crafting (consuming resources)
  console.log("\nSimulating crafting:");
  console.log("Player 2 crafts an item using 2 wood and 1 iron");

  await system.addResource(player2.publicIdentity.publicKey, "wood", -2);
  await system.addResource(player2.publicIdentity.publicKey, "iron", -1);
  await system.addResource(player2.publicIdentity.publicKey, "crafted-item", 1);

  // Check resources after crafting
  console.log("\nAfter crafting:");
  console.log(
    "Player 2 wood:",
    system.getResourceQuantity(player2.publicIdentity.publicKey, "wood")
  );
  console.log(
    "Player 2 iron:",
    system.getResourceQuantity(player2.publicIdentity.publicKey, "iron")
  );
  console.log(
    "Player 2 crafted items:",
    system.getResourceQuantity(player2.publicIdentity.publicKey, "crafted-item")
  );

  console.log("\nExample completed successfully");
}

// Run the example
runExample().catch((error) => {
  console.error("Error running example:", error);
});

module.exports = { runExample };
