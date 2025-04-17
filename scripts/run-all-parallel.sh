#!/bin/bash

# Script to run all examples and tests in parallel
# Requires GNU Parallel: sudo apt-get install parallel (Ubuntu/Debian) or brew install parallel (macOS)

# Display header
echo "========================================"
echo "Running Autobase All Tests & Examples in Parallel"
echo "========================================"
echo

# First, ensure we have clean data directories
echo "Cleaning data directories..."
npm run cleanup:data

# Check if GNU Parallel is installed
if ! command -v parallel &> /dev/null; then
  echo "GNU Parallel is not installed. Please install it first:"
  echo "  - Ubuntu/Debian: sudo apt-get install parallel"
  echo "  - macOS: brew install parallel"
  exit 1
fi

# Create temp directory for logs
mkdir -p .tmp_logs

echo -e "\n\nStarting all examples and tests in parallel..."

# Run all tests and examples in parallel with output properly labeled
parallel -u --tag --line-buffer :::: <<EOF
npm run start:chat > .tmp_logs/chat.log
npm run start:game > .tmp_logs/game.log
node tests/persistence-test.js > .tmp_logs/identity-test.log
node tests/game-currency-persistence-test.js > .tmp_logs/game-test.log
EOF

echo -e "\n\n=========================================="
echo "All processes completed!"
echo "=========================================="

# Check data storage
echo -e "\nChecking data storage directories..."

# Check example data
if [ -d "data-storage/examples/chat/db" ] && [ -d "data-storage/examples/game-currency/db" ]; then
  echo "✅ Success: Example data directories created successfully!"
else
  echo "❌ Warning: Example data directories may not be created properly"
fi

# Check test data
if [ -d "data-storage/examples/persistence/db" ]; then
  echo "✅ Success: Identity persistence test data created successfully!"
fi

if [ -d "data-storage/examples/game-currency/persistence/db" ] || [ -d "data-storage/examples/game-currency/db/persistence" ]; then
  echo "✅ Success: Game currency persistence test data created successfully!"
else
  echo "❌ Warning: Game currency persistence test data may not be created properly"
fi

echo -e "\nListing all data directories:"
ls -la data-storage/examples/

echo -e "\n\nAll tests and examples completed! Logs available in .tmp_logs directory" 