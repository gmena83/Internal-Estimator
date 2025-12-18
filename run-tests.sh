#!/bin/bash

# ISI Agent Test Suite Runner
# Run all tests and generate coverage report

echo "========================================"
echo "ISI Agent Test Suite"
echo "========================================"
echo ""

# Run all tests
echo "Running all tests..."
npx vitest run --reporter=verbose

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "All tests passed!"
    echo "========================================"
else
    echo ""
    echo "========================================"
    echo "Some tests failed. Check output above."
    echo "========================================"
    exit 1
fi

# Run coverage if requested
if [ "$1" == "--coverage" ]; then
    echo ""
    echo "Generating coverage report..."
    npx vitest run --coverage
fi

echo ""
echo "Test run complete."
