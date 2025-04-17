#!/bin/bash

# Script to run all examples in the Autobase Smart Contract System

# Display header
echo "========================================"
echo "Running Autobase Smart Contract Examples"
echo "========================================"
echo

# First, ensure we have clean data directories
echo "Cleaning data directories..."
npm run cleanup:data

# Run the chat example
echo -e "\n\n=========================================="
echo "Running Chat Example"
echo "=========================================="
npm run start:chat

# Run the game-currency example
echo -e "\n\n=========================================="
echo "Running Game Currency Example"
echo "=========================================="
npm run start:game

# Check data storage
echo -e "\n\n=========================================="
echo "Checking data storage directories"
echo "=========================================="
if [ -d "data-storage/examples/chat/db" ] && [ -d "data-storage/examples/game-currency/db" ]; then
  echo "✅ Success: Example data directories created successfully!"
  ls -la data-storage/examples/chat
  ls -la data-storage/examples/game-currency
else
  echo "❌ Error: Data directories not created properly"
  exit 1
fi

echo -e "\n\nAll examples completed successfully!" 