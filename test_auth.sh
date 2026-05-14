#!/bin/bash

echo "🔐 Testing Authentication Flow..."
echo ""

# Test 1: Send OTP
echo "1️⃣ Testing Send OTP..."
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}')
echo "Response: $RESPONSE"
echo ""

# Test 2: Check if OTP was printed in backend logs
echo "2️⃣ Check backend terminal for OTP code"
echo "   (Look for: 'OTP for +919876543210: XXXX')"
echo ""

# Test 3: Verify OTP (you'll need to replace XXXX with actual OTP)
echo "3️⃣ To test OTP verification, run:"
echo "   curl -s -X POST http://localhost:8000/api/v1/auth/verify-otp \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"phone\": \"+919876543210\", \"otp\": \"XXXX\"}' \\"
echo "     -c cookies.txt"
echo ""

# Test 4: Test /users/me with cookies
echo "4️⃣ After getting cookies, test /users/me:"
echo "   curl -s http://localhost:8000/api/v1/users/me \\"
echo "     -b cookies.txt \\"
echo "     -H 'X-CSRF-Token: YOUR_TOKEN_HERE'"
echo ""

echo "✅ Manual testing steps above"
echo ""
echo "💡 Tips:"
echo "   - Make sure backend is running on port 8000"
echo "   - Check backend terminal for OTP code"
echo "   - Use the OTP code in step 3"
echo "   - Save cookies and use them in step 4"
