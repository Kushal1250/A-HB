@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto tryinstalled
node scripts\check-node.mjs >nul 2>nul
if not errorlevel 1 goto checkdeps
:tryinstalled
if not exist "%ProgramFiles%\nodejs\node.exe" goto badnode
"%ProgramFiles%\nodejs\node.exe" scripts\check-node.mjs >nul 2>nul
if errorlevel 1 goto badnode
set "PATH=%ProgramFiles%\nodejs;%PATH%"
echo Using the compatible Node.js installed in Program Files for this window.
:checkdeps
if not exist "client\node_modules\vite\bin\vite.js" goto install
if not exist "server\node_modules\express\package.json" goto install
goto run
:install
call npm.cmd run install:all
if errorlevel 1 (
  echo Installation failed. Please check the error above.
  pause
  exit /b 1
)
:run
set OPEN_BROWSER=1
call npm.cmd start
if errorlevel 1 pause
exit /b
:badnode
echo This project needs Node.js 24 LTS, version 24.15.0 or newer.
echo Install it, then open this launcher again. Your files have not been changed.
pause
exit /b 1
