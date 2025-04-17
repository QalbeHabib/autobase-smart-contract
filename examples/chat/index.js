/**
 * Chat Example
 *
 * This example demonstrates how to use the smart contract system
 * to implement a chat application with role-based permissions
 * and token-gated access.
 */

const Corestore = require("corestore");
const { createIdentity } = require("../../src/identity");
const { createSmartContractSystem } = require("../../src/contracts");

// Simple in-memory message store
// In a real implementation, these would be stored in the autobase
const messages = new Map();

/**
 * Run the example
 */
async function runExample() {
  console.log("Starting Chat Example");
  console.log("=====================\n");

  // Create the storage
  const store = new Corestore("./data-storage/examples/chat");
  await store.ready();

  // Create admin identity
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

  // Set up channel permissions
  const generalChannel = "general";
  const vipChannel = "vip-discussion";

  await system.setPermission(
    generalChannel,
    admin.publicIdentity.publicKey,
    "ADMIN"
  );
  console.log("General channel created with ID:", generalChannel);
  console.log("VIP channel created with ID:", vipChannel);

  // Create user identities
  const alice = createIdentity("user1 seed").setDisplayName("Alice");
  const bob = createIdentity("user2 seed").setDisplayName("Bob");
  const charlie = createIdentity("user3 seed").setDisplayName("Charlie");
  console.log("User identities created");

  // Add users as writers
  await system.addWriter(alice.publicIdentity.publicKey);
  await system.addWriter(bob.publicIdentity.publicKey);
  await system.addWriter(charlie.publicIdentity.publicKey);
  console.log("Users added as writers");

  // Add users to the channels with different roles
  await system.setPermission(
    generalChannel,
    alice.publicIdentity.publicKey,
    "MODERATOR"
  );
  await system.setPermission(
    generalChannel,
    bob.publicIdentity.publicKey,
    "MEMBER"
  );
  await system.setPermission(
    generalChannel,
    charlie.publicIdentity.publicKey,
    "MEMBER"
  );
  console.log("Users added to the general channel");
  console.log("Alice promoted to moderator");

  // Create Web3 accounts for token verification
  const aliceWallet = "0x1234567890123456789012345678901234567890"; // Alice's wallet
  const bobWallet = "0x2345678901234567890123456789012345678901"; // Bob's wallet
  const charlieWallet = "0x3456789012345678901234567890123456789012"; // Charlie's wallet

  // Set up token-gated access for VIP channel
  const tokenContract = "0xabcdef1234567890abcdef1234567890abcdef12";
  await system.setTokenGate(vipChannel, tokenContract, 1, "ERC20");

  // Simulate token verification (in a real application, this would check blockchain)
  // Let's say Alice and Charlie have tokens, but Bob doesn't
  console.log("Simulating token verification for VIP access");
  // We won't actually call verifyTokenAccess as it would require external blockchain access
  // Instead we'll track this manually in this example
  const tokenHolders = new Set([aliceWallet, charlieWallet]);

  console.log("Alice and Charlie verified for VIP access");
  console.log("Bob does not have VIP access");

  // Check verified wallets
  console.log("\nVerified wallets:");
  console.log("Alice:", tokenHolders.has(aliceWallet));
  console.log("Bob:", tokenHolders.has(bobWallet));
  console.log("Charlie:", tokenHolders.has(charlieWallet));

  // Simulate sending messages to the general channel
  console.log("\nSimulating chat in the general channel:");

  sendMessage(generalChannel, admin, "Welcome to the chat!");
  sendMessage(generalChannel, alice, "Hello everyone!");
  sendMessage(generalChannel, bob, "Hi Alice!");

  // Print general channel messages
  console.log("\nGeneral channel messages:");
  printChannelMessages(generalChannel);

  // Simulate sending messages to the VIP channel
  console.log("\nSimulating chat in the VIP channel:");

  // Only Alice and Charlie have access (they have verified tokens)
  // Bob's message will be rejected
  sendMessageWithTokenCheck(
    vipChannel,
    alice,
    "Hello VIPs!",
    aliceWallet,
    tokenHolders
  );
  sendMessageWithTokenCheck(
    vipChannel,
    bob,
    "Can I join the VIP chat?",
    bobWallet,
    tokenHolders
  );
  sendMessageWithTokenCheck(
    vipChannel,
    charlie,
    "Hey Alice, glad to be here!",
    charlieWallet,
    tokenHolders
  );

  // Print VIP channel messages
  console.log("\nVIP channel messages:");
  printChannelMessages(vipChannel);

  // Simulate moderation action
  console.log("\nSimulating moderation:");

  // Check if user has moderation permission
  const aliceRole = await system.getPermission(
    generalChannel,
    alice.publicIdentity.publicKey
  );
  const bobRole = await system.getPermission(
    generalChannel,
    bob.publicIdentity.publicKey
  );

  // Alice is a moderator, so she can delete messages
  if (aliceRole === "MODERATOR" || aliceRole === "ADMIN") {
    deleteMessage(generalChannel, alice, 2); // Delete Bob's message
    console.log("Alice (moderator) deleted a message");
  }

  // Bob is a regular member, so he can't delete messages
  if (bobRole === "MODERATOR" || bobRole === "ADMIN") {
    deleteMessage(generalChannel, bob, 0); // Try to delete Alice's message
    console.log("Bob deleted a message");
  } else {
    console.log(
      "Bob (member) tried to delete a message but failed (insufficient permissions)"
    );
  }

  // Print general channel messages after moderation
  console.log("\nGeneral channel messages after moderation:");
  printChannelMessages(generalChannel);

  console.log("\nExample completed successfully");
}

/**
 * Helper function to send a message
 */
function sendMessage(channelId, sender, content) {
  const messageId = `${channelId}:${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 9)}`;

  const message = {
    id: messageId,
    channelId,
    sender: sender.publicIdentity.publicKey.toString("hex"),
    senderName: sender.publicIdentity.displayName,
    content,
    timestamp: Date.now(),
    deleted: false,
  };

  if (!messages.has(channelId)) {
    messages.set(channelId, []);
  }

  messages.get(channelId).push(message);

  console.log(`${sender.publicIdentity.displayName}: ${content}`);
}

/**
 * Helper function to send a message with token check
 */
function sendMessageWithTokenCheck(
  channelId,
  sender,
  content,
  walletAddress,
  tokenHolders
) {
  if (tokenHolders.has(walletAddress)) {
    sendMessage(channelId, sender, content);
  } else {
    console.log(
      `${sender.publicIdentity.displayName} tried to send a message but doesn't have access`
    );
  }
}

/**
 * Helper function to delete a message
 */
function deleteMessage(channelId, moderator, messageIndex) {
  const channelMessages = messages.get(channelId);

  if (channelMessages && channelMessages[messageIndex]) {
    channelMessages[messageIndex].deleted = true;
    channelMessages[messageIndex].content = "[Message deleted by moderator]";
    channelMessages[messageIndex].deletedBy =
      moderator.publicIdentity.publicKey.toString("hex");
    channelMessages[messageIndex].deletedAt = Date.now();
    return true;
  }

  return false;
}

/**
 * Helper function to print channel messages
 */
function printChannelMessages(channelId) {
  const channelMessages = messages.get(channelId) || [];

  if (channelMessages.length === 0) {
    console.log("No messages in this channel");
    return;
  }

  channelMessages.forEach((message) => {
    console.log(`${message.senderName}: ${message.content}`);
  });
}

// Run the example
runExample().catch((error) => {
  console.error("Error running example:", error);
});

module.exports = { runExample };
