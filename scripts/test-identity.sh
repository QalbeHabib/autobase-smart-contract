#!/bin/bash

# Script to run the Identity Persistence Test

# Display header
echo "=========================================="
echo "Running Identity Persistence Test"
echo "=========================================="
echo

# First, ensure we have clean data directories
echo "Cleaning data directories..."
npm run cleanup:data

# Run the persistence test
echo -e "\n\n=========================================="
echo "Running Identity Persistence Test"
echo "=========================================="
node tests/persistence-test.js

# Check data storage
echo -e "\n\n=========================================="
echo "Checking data storage directories"
echo "=========================================="
if [ -d "data-storage/examples/persistence/db" ]; then
  echo "✅ Success: Identity persistence test data created successfully!"
  ls -la data-storage/examples/persistence
else
  echo "❌ Warning: Identity persistence test data may not be created properly"
fi

echo -e "\n\nIdentity Persistence Test completed!" 