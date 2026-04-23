#!/bin/bash

echo "===================================="
echo "Worms Math Game - Installation"
echo "===================================="
echo ""

echo "[1/2] Installing server dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Server installation failed!"
    exit 1
fi
echo ""

echo "[2/2] Installing client dependencies..."
cd ../client
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Client installation failed!"
    exit 1
fi
echo ""

cd ..
echo "===================================="
echo "Installation Complete!"
echo "===================================="
echo ""
echo "To start the game:"
echo "  1. Open terminal and run: cd server && npm start"
echo "  2. Open another terminal and run: cd client && npm start"
echo ""
echo "See QUICKSTART.md for detailed instructions."
echo ""
