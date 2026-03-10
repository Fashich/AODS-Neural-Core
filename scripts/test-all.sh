#!/bin/bash
# AODS - Comprehensive Testing Script
# Validates all services and components

set -e

echo "=================================="
echo "AODS Testing Suite"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test a service
test_service() {
    local name=$1
    local url=$2
    local endpoint=$3
    
    echo -n "Testing $name... "
    
    if curl -s -f "$url$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
}

# Function to test with JSON response validation
test_service_json() {
    local name=$1
    local url=$2
    local endpoint=$3
    local expected_field=$4
    
    echo -n "Testing $name... "
    
    response=$(curl -s "$url$endpoint" 2>/dev/null)
    
    if echo "$response" | grep -q "$expected_field"; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
}

echo "1. Testing Microservices Health"
echo "--------------------------------"
test_service_json "API Gateway" "${API_GATEWAY_URL:-http://localhost:9000}" "/health" "status"
test_service_json "Python AI" "${AI_SERVICE_URL:-http://localhost:9001}" "/health" "status"
test_service_json "Go Telemetry" "${TELEMETRY_SERVICE_URL:-http://localhost:9002}" "/health" "status"
test_service_json "C++ HPC" "${CPP_HPC_URL:-http://localhost:9003}" "/health" "status"
test_service_json "C# Enterprise" "${CSHARP_ENTERPRISE_URL:-http://localhost:9004}" "/api/health" "status"
test_service_json "Java Bridge" "${JAVA_BRIDGE_URL:-http://localhost:9005}" "/api/health" "status"
test_service_json "PHP Connector" "${PHP_CONNECTOR_URL:-http://localhost:9006}" "/health" "status"
test_service_json "Ruby Automation" "${RUBY_AUTOMATION_URL:-http://localhost:9007}" "/health" "status"

echo ""
echo "2. Testing API Endpoints"
echo "------------------------"

# Test orchestration endpoint
echo -n "Testing Orchestration API... "
if curl -s "${API_GATEWAY_URL:-http://localhost:8000}/api/orchestration" | grep -q "services"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test plans endpoint
echo -n "Testing Subscription Plans... "
if curl -s "${API_GATEWAY_URL:-http://localhost:9000}/api/plans" | grep -q "plans"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test AI prediction
echo -n "Testing AI Prediction... "
response=$(curl -s -X POST "${AI_SERVICE_URL:-http://localhost:9001}/predict/scaling" \
    -H "Content-Type: application/json" \
    -d '{"service_name": "test", "metric_type": "cpu", "historical_data": []}' 2>/dev/null)

if echo "$response" | grep -q "prediction"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((TESTS_FAILED++))
fi

# Test telemetry ingestion
echo -n "Testing Telemetry Ingestion... "
response=$(curl -s -X POST "${TELEMETRY_SERVICE_URL:-http://localhost:8002}/telemetry" \
    -H "Content-Type: application/json" \
    -d '[{"event_type": "test", "data": {}, "timestamp": '$(date +%s000)', "session_id": "test"}]' 2>/dev/null)

if echo "$response" | grep -q "accepted"; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    ((TESTS_FAILED++))
fi

echo ""
echo "3. Testing Database Connection"
echo "------------------------------"
echo -n "Testing Neon.tech Connection... "

if [ -n "$DATABASE_URL" ]; then
    if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ SKIPPED (No DATABASE_URL)${NC}"
fi

echo ""
echo "4. Testing Frontend Build"
echo "-------------------------"
echo -n "Testing Vite Build... "

cd frontend 2>/dev/null || true
if [ -f "package.json" ]; then
    if npm run build > /tmp/build.log 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        cat /tmp/build.log
        ((TESTS_FAILED++))
    fi
else
    echo -e "${YELLOW}⚠ SKIPPED (Frontend not found)${NC}"
fi

cd - > /dev/null 2>&1 || true

echo ""
echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please check the output above.${NC}"
    exit 1
fi
