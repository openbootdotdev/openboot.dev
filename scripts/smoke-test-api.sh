#!/bin/bash
# Post-deployment smoke test for openboot.dev API.
# Tests that critical endpoints return the expected response shape.
#
# Usage:
#   ./scripts/smoke-test-api.sh                    # test production
#   ./scripts/smoke-test-api.sh http://localhost:5173  # test local
#
set -euo pipefail

BASE_URL="${1:-https://openboot.dev}"
PASS=0
FAIL=0

pass() { PASS=$((PASS + 1)); echo "  ✓ $1"; }
fail() { FAIL=$((FAIL + 1)); echo "  ✗ $1: $2"; }

echo "Smoke testing $BASE_URL"
echo ""

# --- Health ---
echo "=== /api/health ==="
HEALTH=$(curl -sf "$BASE_URL/api/health" 2>/dev/null || echo '{}')
if echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('status') in ('healthy','degraded')" 2>/dev/null; then
  pass "health endpoint responds"
else
  fail "health endpoint" "unexpected response"
fi

# --- /api/packages ---
echo ""
echo "=== /api/packages ==="
PKGS=$(curl -sf "$BASE_URL/api/packages" 2>/dev/null || echo '{}')

# Has packages array
if echo "$PKGS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert len(d['packages']) > 50" 2>/dev/null; then
  pass "returns 50+ packages"
else
  fail "package count" "expected 50+ packages"
fi

# Each package has required fields
if echo "$PKGS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
p=d['packages'][0]
for f in ('name','desc','category','type','installer'):
    assert f in p, f'missing {f}'
assert p['installer'] in ('formula','cask','npm'), f'bad installer: {p[\"installer\"]}'
" 2>/dev/null; then
  pass "packages have name, desc, category, type, installer"
else
  fail "package shape" "missing required fields"
fi

# Installer breakdown has all three types
if echo "$PKGS" | python3 -c "
import sys,json
d=json.load(sys.stdin)
types = set(p['installer'] for p in d['packages'])
assert 'formula' in types and 'cask' in types and 'npm' in types
" 2>/dev/null; then
  pass "has formula, cask, and npm installers"
else
  fail "installer types" "missing formula/cask/npm"
fi

# --- /api/homebrew/search ---
echo ""
echo "=== /api/homebrew/search ==="
SEARCH=$(curl -sf "$BASE_URL/api/homebrew/search?q=git" 2>/dev/null || echo '{}')
if echo "$SEARCH" | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert 'formulae' in d or 'results' in d
" 2>/dev/null; then
  pass "homebrew search responds"
else
  fail "homebrew search" "unexpected response shape"
fi

# --- Config endpoint (using a known public config if available) ---
echo ""
echo "=== Config endpoint ==="
# Try the official openboot config first, fall back to any public config.
CONFIG=$(curl -sf "$BASE_URL/openboot/developer/config" 2>/dev/null || echo '')
if [ -z "$CONFIG" ]; then
  # Try fetching public configs list.
  CONFIG=$(curl -sf "$BASE_URL/api/configs/public" 2>/dev/null | python3 -c "
import sys,json
configs=json.load(sys.stdin)
if configs and len(configs)>0:
    c=configs[0]
    print(c.get('username',''),c.get('slug',''))
" 2>/dev/null || echo '')
  if [ -n "$CONFIG" ]; then
    read -r USER SLUG <<< "$CONFIG"
    CONFIG=$(curl -sf "$BASE_URL/$USER/$SLUG/config" 2>/dev/null || echo '')
  fi
fi

if [ -n "$CONFIG" ] && [ "$CONFIG" != "{}" ]; then
  # packages should be objects with name+desc
  if echo "$CONFIG" | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert 'packages' in d
assert 'casks' in d
assert 'taps' in d
assert 'npm' in d
if len(d['packages']) > 0:
    p = d['packages'][0]
    assert isinstance(p, dict), f'expected object, got {type(p).__name__}'
    assert 'name' in p, 'missing name'
    assert 'desc' in p, 'missing desc'
" 2>/dev/null; then
    pass "config returns {name, desc} objects for packages"
  else
    fail "config format" "packages not in expected {name, desc} format"
  fi

  # taps should be plain strings
  if echo "$CONFIG" | python3 -c "
import sys,json
d=json.load(sys.stdin)
if len(d.get('taps',[])) > 0:
    assert isinstance(d['taps'][0], str), 'taps should be strings'
" 2>/dev/null; then
    pass "taps are plain strings"
  else
    fail "taps format" "expected string array"
  fi
else
  echo "  - skipped (no public config found)"
fi

# --- Summary ---
echo ""
TOTAL=$((PASS + FAIL))
echo "Results: $PASS/$TOTAL passed"
if [ "$FAIL" -gt 0 ]; then
  echo "FAILED"
  exit 1
else
  echo "ALL PASSED"
fi
