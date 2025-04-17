#!/bin/bash

# Script to run the Chat Example

# Display header
echo "=========================================="
echo "Running Chat Example"
echo "=========================================="
echo

# First, ensure we have clean data directories
echo "Cleaning data directories..."
npm run cleanup:data

# Run the chat example
echo -e "\n\n=========================================="
echo "Running Chat Example"
echo "=========================================="
npm run start:chat

# Check data storage
echo -e "\n\n=========================================="
echo "Checking data storage directories"
echo "=========================================="
if [ -d "data-storage/examples/chat/db" ]; then
  echo "✅ Success: Chat example data directory created successfully!"
  ls -la data-storage/examples/chat
else
  echo "❌ Error: Chat example data directory not created properly"
  exit 1
fi

echo -e "\n\nChat Example completed successfully!" 