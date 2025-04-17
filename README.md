# Autobase Smart Contract System

A decentralized smart contract-like system built on top of [Autobase](https://docs.pears.com/building-blocks/autobase), providing identity management, permissions, currency, and web3 integration in a peer-to-peer environment.

## Overview

This project implements a distributed system that provides smart contract-like functionality without requiring a blockchain. It uses Autobase to create a linearized, eventually consistent view of operations coming from multiple writers. The system includes:

- **Identity management**: Create and verify seed-based identities across multiple devices
- **Permission system**: Role-based access control for various resources
- **Currency system**: Simple token transfers and balances with persistence
- **Resource system**: Manage in-game resources with minting, transfers, and consumption
- **Web3 integration**: Bridge to Ethereum-compatible blockchains

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd autobase

# Install dependencies
npm install
```

## Core Components

### Identity Module

The identity module (`src/identity/index.js`) provides functionality for creating and managing seed-based identities that work across multiple devices. It includes:

- Creating deterministic key pairs from seed phrases
- Signing and verifying messages
- Managing device keys associated with identities
- Storing device registrations in Autobase

### Permissions Module

The permissions module (`src/permissions/index.js`) implements role-based access control with:

- Predefined roles (MEMBER, MODERATOR, ADMIN)
- Per-room and per-channel permissions
- Permission verification for operations

### Currency Module

The currency module (`src/currency/index.js`) implements a simple token system with:

- Minting, burning, and transferring tokens
- Balance tracking
- Transaction history
- Persistence across restarts using Autobase

### Smart Contract System

The contracts module (`src/contracts/index.js`) ties everything together to provide a unified smart contract-like experience. It:

- Creates an Autobase instance to store operations
- Manages the state for all subsystems (identity, permissions, currency)
- Provides methods for interacting with each subsystem

## Running the System

### Basic Usage

```javascript
const Corestore = require("corestore");
const system = require("./index");

async function main() {
  // Create storage
  const store = new Corestore("./data");
  await store.ready();

  // Create user identity
  const identity = system.createIdentity("my seed phrase");

  // Create smart contract system
  const contract = await system.createSmartContractSystem(store, {
    localIdentity: identity,
  });

  // Use the system
  // ... (examples below)
}

main().catch(console.error);
```

### Example: Chat Application

The repository includes a complete chat example in `examples/chat/index.js`. Run it with:

```bash
node examples/chat/index.js
```

This demonstrates:

- Creating identities
- Setting up channels with permissions
- Token-gated access control
- Message sending with verification

## Testing

### Running the Tests

These tests verify the core functionality and integration with Autobase:

```bash
# Run the basic identity test
node test-identity.js

# Run the simple integration test
node autobase-test.js

# Run the persistence test for identity
node persistence-test.js

# Run the currency system test
node currency-test.js
```

### Test Descriptions

1. **Basic Identity Test** (`test-identity.js`): Tests the basic functionality of the identity registry, including creating identities, registering devices, and verifying authorizations.

2. **Simple Integration Test** (`autobase-test.js`): A streamlined test that demonstrates identity registry working with Autobase.

3. **Persistence Test** (`persistence-test.js`): Tests that device registrations are properly stored in Autobase and can be reconstructed after restarting the application.

4. **Currency Test** (`currency-test.js`): Tests the currency system's ability to mint, transfer, and burn tokens, and verifies that balances persist across application restarts.

## API Reference

### Identity Module

```javascript
// Create a user identity from a seed phrase
const identity = createIdentity("my seed phrase");

// Set a display name
identity.setDisplayName("Alice");

// Create an identity registry with Autobase
const registry = createIdentityRegistry(autobase);

// Register a device
registry.registerDevice(
  identity.publicIdentity.publicKey,
  identity.privateIdentity.deviceKeyPair.publicKey,
  identity.privateIdentity.authSignature
);

// Check device authorization
const isAuthorized = registry.isAuthorizedDevice(
  masterPublicKey,
  devicePublicKey
);

// Get all devices for an identity
const devices = registry.getDevicesForIdentity(masterPublicKey);
```

### Permissions Module

```javascript
// Create a permission system
const permissionSystem = createPermissionSystem(autobase);

// Create a room
const room = permissionSystem.createRoom("General", adminIdentity);

// Add a member
room.addMember(userIdentity, { role: "MEMBER" });

// Update a member's role
room.updateMemberRole(userIdentity, "MODERATOR");

// Create a channel
const channel = room.createChannel("announcements");

// Get all channels
const channels = room.getChannels();
```

### Currency Module

```javascript
// Create the currency system
const currencySystem = createCurrencySystem(autobase, {
  name: "TestCoin",
  symbol: "TCN",
  decimals: 2,
});

// Mint tokens
currencySystem.mint(userPublicKey, 1000, adminIdentity);

// Transfer tokens
currencySystem.transfer(fromPublicKey, toPublicKey, 500);

// Burn tokens
currencySystem.burn(userPublicKey, 100, adminIdentity);

// Get balance
const balance = currencySystem.balanceOf(userPublicKey);

// Get transaction history
const transactions = currencySystem.getTransactions();
```

### Smart Contract System

```javascript
// Create the system
const system = await createSmartContractSystem(store, {
  localIdentity: identity,
});

// Add a writer
await system.addWriter(otherPublicKey);

// Set permissions
await system.setPermission(channelId, userPublicKey, "ADMIN");

// Currency operations
await system.mintCurrency("coin", userPublicKey, 100);
await system.transferCurrency("coin", fromPublicKey, toPublicKey, 50);
const balance = system.getCurrencyBalance("coin", userPublicKey);
```

## Architecture

The system uses [Autobase](https://www.npmjs.com/package/autobase) to manage a distributed, eventually consistent state. Operations are appended to Autobase as JSON objects with the format:

```javascript
{
  system: "identity", // or "permission", "currency", etc.
  data: {
    type: "REGISTER_DEVICE", // or other operation types
    // operation-specific fields
  },
  timestamp: Date.now()
}
```

These operations are applied to the in-memory state and can be replayed when the application restarts, ensuring consistent state across all nodes.

## Version Management

This project follows [Semantic Versioning](https://semver.org/) for all components. Each module is versioned independently while maintaining compatibility with the overall system version.

### Status Indicators

Throughout the version documentation, you'll find the following status indicators:

- ✅ **Completed/Stable**: Feature is implemented and tested
- 🔄 **In Progress**: Feature is currently being developed
- ⏳ **Planned**: Feature is scheduled for future implementation
- ⚠️ **Beta/Known Issue**: Feature works but may have limitations or known issues

### Version Tracking

The codebase includes a comprehensive version tracking system:

1. **VERSIONS.md**: Contains detailed version history, module-specific versioning, implementation details, and planned features with their current status.

2. **VERSION_CATALOG.js**: Programmatic representation of version data that can be imported into other modules. Includes utility functions for version comparisons and compatibility checks.

3. **show-versions.js**: Command-line tool for displaying version information.

### Checking Version Information

To view detailed version information, use these npm scripts:

```bash
# Show overall system version with all modules
npm run version

# Show information for a specific module
npm run version:module currency  # (replace 'currency' with any module name)
```

For more detailed information about versions, implementation status, and planned features, please refer to the [VERSIONS.md](./VERSIONS.md) file.

## License

MIT
