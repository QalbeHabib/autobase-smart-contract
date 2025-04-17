#!/bin/bash

# Script to run the Game Currency Example

# Display header
echo "=========================================="
echo "Running Game Currency Example"
echo "=========================================="
echo

# First, ensure we have clean data directories
echo "Cleaning data directories..."
npm run cleanup:data

# Run the game-currency example
echo -e "\n\n=========================================="
echo "Running Game Currency Example"
echo "=========================================="
npm run start:game

# Check data storage
echo -e "\n\n=========================================="
echo "Checking data storage directories"
echo "=========================================="
if [ -d "data-storage/examples/game-currency/db" ]; then
  echo "✅ Success: Game Currency example data directory created successfully!"
  ls -la data-storage/examples/game-currency
else
  echo "❌ Error: Game Currency example data directory not created properly"
  exit 1
fi

echo -e "\n\nGame Currency Example completed successfully!" 