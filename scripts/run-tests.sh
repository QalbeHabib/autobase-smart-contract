#!/bin/bash

# Script to run all tests in the Autobase Smart Contract System

# Display header
echo "========================================"
echo "Running Autobase Smart Contract Tests"
echo "========================================"
echo

# First, ensure we have clean data directories
echo "Cleaning data directories..."
npm run cleanup:data

# Run the persistence test
echo -e "\n\n=========================================="
echo "Running Identity Persistence Test"
echo "=========================================="
node tests/persistence-test.js

# Run the game-currency persistence test
echo -e "\n\n=========================================="
echo "Running Game Currency Persistence Test"
echo "=========================================="
node tests/game-currency-persistence-test.js

# Check data storage
echo -e "\n\n=========================================="
echo "Checking data storage directories"
echo "=========================================="
if [ -d "data-storage/examples/persistence/db" ]; then
  echo "✅ Success: Identity persistence test data created successfully!"
  ls -la data-storage/examples/persistence
fi

if [ -d "data-storage/examples/game-currency/persistence/db" ] || [ -d "data-storage/examples/game-currency/db/persistence" ]; then
  echo "✅ Success: Game currency persistence test data created successfully!"
  
  # Check both possible locations
  if [ -d "data-storage/examples/game-currency/persistence/db" ]; then
    ls -la data-storage/examples/game-currency/persistence
  fi
  
  if [ -d "data-storage/examples/game-currency/db/persistence" ]; then
    ls -la data-storage/examples/game-currency/db/persistence
  fi
else
  echo "❌ Warning: Game currency persistence test data may not be created properly"
fi

echo -e "\n\nAll tests completed!" 