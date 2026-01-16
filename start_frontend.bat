@echo off
chcp 65001 >nul 2>&1
cls

:: 1. 切换到脚本所在目录
cd /d "%~dp0"

:: 2. 检查Node.js是否安装
node -v >nul 2>&1 || (
    echo 错误：未检测到Node.js，请先安装！
    pause
    exit /b 1
)

:: 3. 安装依赖（仅当node_modules不存在时）
if not exist "node_modules" (
    echo 正在安装依赖...
    npm install
)

:: 4. 延迟5秒打开浏览器（后台执行，不弹新窗口）+ 启动Next.js
echo 启动Next.js服务（端口3000）...
start /b "" cmd /c "ping -n 6 127.0.0.1 >nul && start http://localhost:3000"
npm run start

:: 防闪退
pause
