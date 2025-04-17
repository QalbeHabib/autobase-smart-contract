# P2P Smart Contracts with Autobase

This repository provides a solution for implementing smart contract-like functionality in peer-to-peer applications using Holepunch's Autobase.

## Overview

This implementation addresses several key challenges when building decentralized applications with Autobase:

1. **Multi-Device Identity** - A seed-based identity system allowing users to use the same identity across multiple devices
2. **Permission System** - Role-based access control for rooms and channels
3. **Smart Contract Functionality** - Deterministic execution of rules for currency and resources
4. **Web3 Integration** - Bridge for connecting with blockchain ecosystems

## Core Concepts

### Seed-Based Identity

The traditional approach in Hypercore assigns each device a unique keypair, creating problems for multi-device users. Our solution:

- Uses a master seed to derive consistent identity keys
- Registers device keys signed by the master identity
- Maintains a registry of authorized devices

### Apply Function as Smart Contract

Autobase's apply function serves as our smart contract executor:

- Deterministically orders operations from all writers
- Validates operations according to defined rules
- Maintains consistent state across all peers

### Permission System

Role-based access control is implemented through:

- Special entries in the Autobase defining roles and permissions
- Validation in the apply function to enforce access rules
- Admin capabilities for permission management

## File Structure

```
/src
  /identity       - Seed-based identity management
  /permissions    - Role and permission system
  /contracts      - Contract implementations
  /currency       - Currency and resource system
  /web3           - Web3 integration bridge
/examples
  /chat           - Example chat application
  /game-currency  - Example game with currency
/tests            - Test suite
```

## Installation

```bash
npm install
```

## Basic Usage

### Initialize the Smart Contract System

```javascript
const Corestore = require("corestore");
const {
  createSmartContractSystem,
  createIdentity,
} = require("./src/contracts");

// Create a user identity from a seed phrase
const userIdentity = createIdentity("your secret seed phrase");

// Initialize storage and the contract system
const store = new Corestore("./data");
await store.ready();

const contractSystem = await createSmartContractSystem(store, {
  localIdentity: userIdentity,
  writers: [], // Initial writers
});

// Now you can use the contract system!
```

### Using Permissions

```javascript
// Create a room with permissions
const channelId = "general-chat";
await contractSystem.setPermission(
  channelId,
  userIdentity.publicIdentity.publicKey,
  "ADMIN"
);

// Check permissions
const role = await contractSystem.getPermission(
  channelId,
  userIdentity.publicIdentity.publicKey
);
console.log(`User has role: ${role}`);
```

### Managing Currency

```javascript
// Create and manage currency
const currencyId = "gold-coins";
await contractSystem.mintCurrency(
  currencyId,
  userIdentity.publicIdentity.publicKey,
  100
);

// Transfer currency
const friendPublicKey = friendIdentity.publicIdentity.publicKey;
await contractSystem.transferCurrency(
  currencyId,
  userIdentity.publicIdentity.publicKey,
  friendPublicKey,
  25
);

// Check balances
const balance = contractSystem.getCurrencyBalance(
  currencyId,
  userIdentity.publicIdentity.publicKey
);
console.log(`User balance: ${balance}`);
```

### Working with Resources

```javascript
// Add resources
const resourceId = "wood";
await contractSystem.addResource(
  userIdentity.publicIdentity.publicKey,
  resourceId,
  10
);

// Check resources
const woodAmount = contractSystem.getResourceQuantity(
  userIdentity.publicIdentity.publicKey,
  resourceId
);
console.log(`User has ${woodAmount} wood`);
```

### Token-Gated Access

```javascript
// Create token-gated access for a channel
const tokenContract = "0x1234567890123456789012345678901234567890";
await contractSystem.setTokenGate("vip-channel", tokenContract, 5, "ERC20");

// Verify token access
const hasAccess = await contractSystem.verifyTokenAccess(
  "vip-channel",
  userWalletAddress
);
console.log(`User has access: ${hasAccess}`);
```

## Running the Examples

```bash
# Run the chat example
npm run start:chat

# Run the game currency example
npm run start:game
```

## Core Challenges Solved

### 1. Multi-Device Synchronization

Our implementation maintains consistent identity across devices by:

- Using cryptographic signatures to authorize new devices
- Registering device keys in a shared registry
- Validating operations from authorized devices

### 2. Permission Management

The role-based permission system:

- Defines granular permissions for different actions
- Enforces permissions in the apply function
- Provides admin capabilities for permission management

### 3. Smart Contract Functionality

The smart contract system provides:

- Deterministic execution of rules
- Currency and resource management
- Transaction validation and history

### 4. Web3 Integration

The Web3 bridge:

- Provides compatibility with blockchain ecosystems
- Implements cryptographic primitives for verification
- Enables token-gated access control

## Use Cases

- **Decentralized Chat Applications**: With role-based access control
- **P2P Games**: With in-game currency and resource management
- **Token-Gated Communities**: Using Web3 verification
- **NFT-Like Digital Assets**: For in-game items and collectibles

## Technical Details

### Autobase Implementation

Our system leverages Autobase's powerful features:

- Uses the `open` and `apply` functions to maintain state consistency
- Appends operations as structured data to the event log
- Processes operations in a consistent order across all peers

The identity system allows for:

- Creation of devices from a master seed
- Registration of devices with cryptographic authorization
- Verification of device signatures against master identities

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
