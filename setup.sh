#!/bin/bash

# DataUniverse LMS - Quick Setup Script
# =====================================

set -e

echo "🎓 DataUniverse LMS Setup"
echo "========================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Check MySQL
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  MySQL CLI not found. Make sure MySQL is installed and running${NC}"
else
    echo -e "${GREEN}✅ MySQL found${NC}"
fi

echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
npm install

echo ""
echo "📦 Installing Frontend Dependencies..."
cd ..
npm install

echo ""
echo "🔧 Setting up environment files..."

# Backend .env
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${YELLOW}⚠️  Created backend/.env from example. Please edit with your values!${NC}"
    else
        echo -e "${RED}❌ backend/.env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Frontend .env
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Created .env from example. Please edit with your values!${NC}"
    else
        echo -e "${RED}❌ .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✅ .env already exists${NC}"
fi

echo ""
echo "📝 Next Steps:"
echo "=============="
echo ""
echo "1. Create MySQL database:"
echo "   mysql -u root -p -e 'CREATE DATABASE DataUniverse;'"
echo ""
echo "2. Edit backend/.env with your database credentials"
echo ""
echo "3. Push database schema:"
echo "   cd backend && npx prisma db push"
echo ""
echo "4. Seed the database:"
echo "   cd backend && npx prisma db seed"
echo ""
echo "5. Start the servers:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: npm run dev"
echo ""
echo "6. Open http://localhost:8080"
echo ""
echo "Default Login:"
echo "  Admin: admin@datauniverse.com / Admin123!"
echo "  Student: student@datauniverse.com / Student123!"
echo ""
echo -e "${GREEN}✅ Setup preparation complete!${NC}"
