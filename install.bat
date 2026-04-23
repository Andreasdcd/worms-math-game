@echo off
echo ====================================
echo Worms Math Game - Installation
echo ====================================
echo.

echo [1/2] Installing server dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Server installation failed!
    pause
    exit /b 1
)
echo.

echo [2/2] Installing client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Client installation failed!
    pause
    exit /b 1
)
echo.

cd ..
echo ====================================
echo Installation Complete!
echo ====================================
echo.
echo To start the game:
echo   1. Open terminal and run: cd server ^&^& npm start
echo   2. Open another terminal and run: cd client ^&^& npm start
echo.
echo See QUICKSTART.md for detailed instructions.
echo.
pause
