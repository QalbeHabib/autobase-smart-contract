# Test Scripts for Autobase Smart Contract System

This document explains the various test and example scripts available in this project and how to use them.

## Individual Test Scripts

These scripts run specific tests in isolation:

### Identity Persistence Test

Tests the ability of the identity registry to persist data in Autobase:

```bash
npm run test:identity
```

### Game Currency Persistence Test

Tests the persistence of game currency and resource data:

```bash
npm run test:game-currency
```

## Individual Example Scripts

These scripts run specific examples in isolation:

### Chat Example

Runs the chat application example:

```bash
npm run example:chat
```

### Game Currency Example

Runs the game currency example:

```bash
npm run example:game
```

## Comprehensive Test Scripts

These scripts run multiple tests or examples together:

### All Tests

Runs all test scripts sequentially:

```bash
npm run tests
```

### All Examples

Runs all example scripts sequentially:

```bash
npm run examples
```

### Run All (Parallel)

Runs all tests and examples in parallel using GNU Parallel:

```bash
npm run run:all
```

Note: This requires GNU Parallel to be installed:

- Ubuntu/Debian: `sudo apt-get install parallel`
- macOS: `brew install parallel`

## Data Storage

All tests and examples store their data in the `data-storage/` directory with the following structure:

```
data-storage/
├── examples/
│   ├── chat/                # Chat example data
│   ├── game-currency/       # Game currency example data
│   │   └── persistence/     # Persistence test data for game currency
│   └── persistence/         # General persistence test data
```

## Cleaning Data

If you want to clean all data and start fresh, you can run:

```bash
npm run cleanup:data
```

This will remove all data directories and recreate the empty structure.
