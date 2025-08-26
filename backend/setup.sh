#!/bin/bash

echo "🚀 Setting up ParentConnect Backend with Bun + Elysia"

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
    echo "✅ Bun installed successfully"
else
    echo "✅ Bun is already installed"
fi

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "🔧 Creating .env file..."
    cat > .env << EOF
JWT_SECRET=parentconnect-super-secret-key-change-in-production
PORT=3000
EOF
    echo "✅ .env file created"
fi

# Create uploads directory
mkdir -p uploads

echo "🎉 Setup complete!"
echo ""


echo "To start the entire application (recommended):"
echo "  cd .. && ./scripts/parent-connect.sh start"
echo ""
echo "To start only the backend manually:"
echo "  bun run dev"
echo ""
echo "To access the API:"
echo "  http://localhost:3000"
echo ""
echo "To view API documentation:"
echo "  http://localhost:3000/swagger"
