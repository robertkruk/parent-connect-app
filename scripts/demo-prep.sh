#!/bin/bash

echo "🎯 ParentConnect Demo Preparation Script"
echo "========================================"
echo ""

# Check if app is running
echo "📡 Checking application status..."
./scripts/parent-connect.sh status

echo ""
echo "🧪 Testing Demo Features..."
echo ""

# Test frontend accessibility
echo "🌐 Testing frontend accessibility..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Frontend is accessible at http://localhost:5173"
else
    echo "❌ Frontend is not accessible"
fi

# Test backend API
echo "🔧 Testing backend API..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ Backend API is accessible at http://localhost:3000"
else
    echo "❌ Backend API is not accessible"
fi

echo ""
echo "📋 Demo Account Credentials:"
echo "============================"
echo ""
echo "Primary Demo Account:"
echo "  Email: sarah.johnson@email.com"
echo "  Password: password123"
echo "  Child: Emma Johnson (3rd Grade)"
echo ""
echo "Secondary Demo Account:"
echo "  Email: michael.chen@email.com"
echo "  Password: password123"
echo "  Child: Alex Chen (3rd Grade)"
echo ""
echo "Additional Demo Accounts:"
echo "  Email: emily.rodriguez@email.com"
echo "  Password: password123"
echo "  Child: Sophia Rodriguez (3rd Grade)"
echo ""
echo "  Email: david.thompson@email.com"
echo "  Password: password123"
echo "  Child: James Thompson (4th Grade)"
echo ""
echo "  Email: lisa.wang@email.com"
echo "  Password: password123"
echo "  Child: Mia Wang (3rd Grade)"
echo ""

echo "🎭 Demo Flow Summary:"
echo "===================="
echo "1. Open http://localhost:5173"
echo "2. Login as Sarah Johnson"
echo "3. Show interface and class organization"
echo "4. Open second browser tab"
echo "5. Login as Michael Chen"
echo "6. Demonstrate real-time messaging"
echo "7. Show typing indicators and online status"
echo "8. Highlight safety and organization features"
echo ""

echo "🚨 Quick Demo Tips:"
echo "=================="
echo "• Keep demo under 3 minutes"
echo "• Focus on real-time messaging demo"
echo "• Highlight child-linked identities"
echo "• Show responsive design"
echo "• Have backup screenshots ready"
echo "• Practice timing with a timer"
echo ""

echo "🎯 Demo Success Checklist:"
echo "========================="
echo "□ Test both demo accounts login"
echo "□ Verify WebSocket connections work"
echo "□ Test real-time messaging between accounts"
echo "□ Check responsive design on different screen sizes"
echo "□ Prepare browser tabs for quick switching"
echo "□ Have HACKATHON_DEMO_GUIDE.md ready"
echo "□ Practice the demo script"
echo ""

echo "Good luck with your hackathon demo! 🚀"
