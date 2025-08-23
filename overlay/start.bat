@echo off
set HUD_ID=%1
if "%HUD_ID%"=="" set HUD_ID=BCL_2025

cd /d %~dp0
:: Проверяем наличие node_modules
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

:: Запускаем через npx
start /b "" npx electron . --hud=%HUD_ID%