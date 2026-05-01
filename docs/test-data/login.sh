#!/usr/bin/env bash
# Usage: source login.sh; T=$(login +919999900001); echo "$T"
# Returns access token for the given phone (dev-mode OTP bypass).
login() {
  local phone="$1"
  /usr/bin/curl -s -X POST http://localhost:4000/v1/auth/send-otp \
    -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$phone\"}" >/dev/null
  /usr/bin/curl -s -X POST http://localhost:4000/v1/auth/verify-otp \
    -H 'Content-Type: application/json' \
    -d "{\"phone\":\"$phone\",\"otp\":\"123456\"}" \
    | /usr/bin/python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])"
}
