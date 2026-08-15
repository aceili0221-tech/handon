@echo off
chcp 65001 >nul
title 企業內部出勤與工時打卡系統 - 本地啟動程式

cd /d "%~dp0"

echo.
echo =================================================================
echo   🏢 企業內部出勤與工時打卡系統 - 本地啟動程式 (Windows)
echo =================================================================
echo.

:: 1. 檢查 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 錯誤：找不到 Node.js 執行環境！
    echo 👉 請至官方網站下載並安裝 Node.js (推薦 LTS 版本)：
    echo    https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ 已偵測到 Node.js 執行環境。
echo.

:: 2. 檢查並安裝依賴
if not exist "node_modules\" (
    echo 📦 正在為您安裝專案依賴套件（初次啟動約需 10~20 秒，請稍候）...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 安裝依賴套件失敗，請檢查網路連線。
        pause
        exit /b 1
    )
    echo 🎉 依賴套件安裝完成！
    echo.
)

:: 3. 啟動伺服器並開啟瀏覽器
echo 🚀 正在啟動本地打卡系統伺服器...
echo 🌐 系統將自動於桌面瀏覽器開啟：http://localhost:3000
echo 💡 (提示：欲關閉系統請直接關閉此視窗或按 Ctrl + C)
echo.

call npm run start:browser
