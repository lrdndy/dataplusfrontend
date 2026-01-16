// dataplusfrontend/server.js
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 检查.next构建目录是否存在（避免启动失败）
const nextBuildDir = path.join(__dirname, '.next');
if (!fs.existsSync(nextBuildDir)) {
    console.error('❌ 未找到Next.js构建产物！请先执行 npm run build');
    process.exit(1); // 退出进程，提示用户先构建
}

// 启动Next.js生产服务（端口3000，和你项目一致）
console.log('🚀 启动Next.js前端服务（端口3000）...');
const nextStartProcess = spawn(
    // 优先用项目内的next命令，避免全局依赖
    path.join(__dirname, 'node_modules', '.bin', 'next'),
    ['start', '-p', '3000'],
    {
        cwd: __dirname, // 工作目录=前端根目录
        stdio: 'inherit', // 继承控制台输出（能看到启动日志）
        shell: process.platform === 'win32' // Windows下需要shell=true
    }
);

// 监听进程退出/错误
nextStartProcess.on('exit', (code) => {
    console.log(`⚠️ 前端服务已退出，退出码：${code}`);
});

nextStartProcess.on('error', (err) => {
    console.error('❌ 前端服务启动失败：', err.message);
    process.exit(1);
});

// 监听终端关闭（优雅退出）
process.on('SIGINT', () => {
    console.log('\n📤 正在关闭前端服务...');
    nextStartProcess.kill();
    process.exit(0);
});