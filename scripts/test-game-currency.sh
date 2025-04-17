#!/bin/bash

# Script to run the Game Currency Persistence Test

# Display header
echo "=========================================="
echo "Running Game Currency Persistence Test"
echo "=========================================="
echo

# First, ensure we have clean data directories
echo "Cleaning data directories..."
npm run cleanup:data

# Run the game-currency persistence test
echo -e "\n\n=========================================="
echo "Running Game Currency Persistence Test"
echo "=========================================="
node tests/game-currency-persistence-test.js

# Check data storage
echo -e "\n\n=========================================="
echo "Checking data storage directories"
echo "=========================================="

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

echo -e "\n\nGame Currency Persistence Test completed!" 