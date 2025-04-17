// Simplified in-memory implementation
const { createIdentity } = require("../src/identity");
const admin = createIdentity("admin seed").setDisplayName("Admin");
const player1 = createIdentity("player1 seed").setDisplayName("Player 1");
const player2 = createIdentity("player2 seed").setDisplayName("Player 2");

// In-memory state to simulate Autobase
const state = {
  currency: { balances: new Map() },
  resources: { inventory: new Map() },
};

// Simple currency operations
function mintCurrency(currencyId, userPublicKey, amount) {
  const key = `${currencyId}_${userPublicKey}`;
  const current = state.currency.balances.get(key) || 0;
  state.currency.balances.set(key, current + amount);
  return state.currency.balances.get(key);
}

function transferCurrency(currencyId, fromPublicKey, toPublicKey, amount) {
  const fromKey = `${currencyId}_${fromPublicKey}`;
  const toKey = `${currencyId}_${toPublicKey}`;
  const fromBalance = state.currency.balances.get(fromKey) || 0;
  const toBalance = state.currency.balances.get(toKey) || 0;

  if (fromBalance >= amount) {
    state.currency.balances.set(fromKey, fromBalance - amount);
    state.currency.balances.set(toKey, toBalance + amount);
    return true;
  }
  return false;
}

function getCurrencyBalance(currencyId, userPublicKey) {
  const key = `${currencyId}_${userPublicKey}`;
  return state.currency.balances.get(key) || 0;
}

// Resource operations
function addResource(userPublicKey, resourceId, quantity) {
  if (!state.resources.inventory.has(userPublicKey)) {
    state.resources.inventory.set(userPublicKey, new Map());
  }
  const inventory = state.resources.inventory.get(userPublicKey);
  const current = inventory.get(resourceId) || 0;
  inventory.set(resourceId, current + quantity);
  return inventory.get(resourceId);
}

function getResourceQuantity(userPublicKey, resourceId) {
  const inventory = state.resources.inventory.get(userPublicKey);
  if (!inventory) return 0;
  return inventory.get(resourceId) || 0;
}

// Example usage
const adminKey = admin.publicIdentity.publicKey.toString("hex");
const player1Key = player1.publicIdentity.publicKey.toString("hex");
const player2Key = player2.publicIdentity.publicKey.toString("hex");

console.log("Running simplified example...");

// Mint currency
mintCurrency("gold", player1Key, 100);
mintCurrency("gold", player2Key, 100);
console.log("Player 1 balance:", getCurrencyBalance("gold", player1Key));
console.log("Player 2 balance:", getCurrencyBalance("gold", player2Key));

// Add resources
addResource(player1Key, "wood", 10);
addResource(player1Key, "stone", 5);
addResource(player2Key, "wood", 5);
addResource(player2Key, "iron", 2);

console.log("Player 1 resources:");
console.log("  Wood:", getResourceQuantity(player1Key, "wood"));
console.log("  Stone:", getResourceQuantity(player1Key, "stone"));

console.log("Player 2 resources:");
console.log("  Wood:", getResourceQuantity(player2Key, "wood"));
console.log("  Iron:", getResourceQuantity(player2Key, "iron"));

// Trade: Player 1 gives 2 stone to Player 2 for 20 gold
console.log("\nSimulating trade...");
addResource(player1Key, "stone", -2);
addResource(player2Key, "stone", 2);
transferCurrency("gold", player2Key, player1Key, 20);

console.log("After trade:");
console.log("Player 1 balance:", getCurrencyBalance("gold", player1Key));
console.log("Player 2 balance:", getCurrencyBalance("gold", player2Key));
console.log("Player 1 stone:", getResourceQuantity(player1Key, "stone"));
console.log("Player 2 stone:", getResourceQuantity(player2Key, "stone"));

console.log("\nExample completed successfully!");
