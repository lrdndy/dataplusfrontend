'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getHelloMessage, getServerTime, getStockData } from '@/services/api';
import StockChart from '@/components/StockChart';
import Link from 'next/link';

// 导出股票数据类型，供 StockChart 使用
export interface StockItem {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
}

// 基础 API 响应类型
export interface HelloResponse {
  message_zh: string;      // 简体中文
  message_en: string;      // 英文
  message_zh_tw: string;   // 繁体中文
}

interface TimeResponse {
  message: string;
  time: string;
  timestamp: number;
}

interface StockResponse {
  stock_code: string;
  stock_name: string;
  data: StockItem[];
  message: string;
}

// 加载动画组件（科技感Spinner）
const LoadingSpinner = () => (
    <div className="inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
);

export default function Home() {
  // 基础数据状态
  const [helloData, setHelloData] = useState<HelloResponse | null>(null);
  const [timeData, setTimeData] = useState<TimeResponse | null>(null);
  const [baseLoading, setBaseLoading] = useState(true);
  const [baseError, setBaseError] = useState<string | null>(null);

  // 股票数据懒加载状态
  const [stockData, setStockData] = useState<StockResponse | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [stockLoaded, setStockLoaded] = useState(false);


  // 加载基础数据（仅获取 Hello 信息，时间由定时器单独处理）
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setBaseLoading(true);
        const helloRes = await getHelloMessage(); // 仅获取 Hello 数据
        setHelloData(helloRes);
      } catch (err) {
        setBaseError('Failed to fetch base data');
        console.error('Base error:', err);
      } finally {
        setBaseLoading(false);
      }
    };

    fetchBaseData();
  }, []);

  // 🔥 新增：每秒自动获取服务器时间
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const timeRes = await getServerTime();
        setTimeData(timeRes);
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };

    // 初始加载时立即获取一次
    fetchServerTime();

    // 每秒执行一次（1000 毫秒 = 1 秒）
    const intervalId = setInterval(fetchServerTime, 1000);

    // 组件卸载时清除定时器（防止内存泄漏）
    return () => clearInterval(intervalId);
  }, []);


  const [clickLabel, setClickLabel] = useState("Load Now · 立即加载");
  // 加载股票数据
  const loadStockData = useCallback(async () => {
    if (stockLoaded || stockLoading) return;

    try {
      setStockLoading(true);
      setStockError(null);
      const data = await getStockData();
      setStockData(data);
      setStockLoaded(true);
    } catch (err) {
      setStockError('Failed to load stock data');
      console.error('Stock error:', err);
    } finally {
      setStockLoading(false);
    }
  }, [stockLoaded, stockLoading]);

  //页面初始化时自动加载股票数据（替换滚动触发）
  useEffect(() => {
    loadStockData(); // 页面刷新后立即调用加载
  }, [loadStockData]);

  // 全局加载中（科技感全屏状态）
  if (baseLoading) return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-400 text-lg">Loading core data...</p>
      </div>
  );

  // 全局错误状态
  if (baseError) return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h3 className="text-2xl font-bold text-red-400 mb-4">Data Load Failed</h3>
          <p className="text-gray-400 mb-6">{baseError}</p>
          <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-900/50 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-900/70 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
  );

  // 页面渲染（全局深色主题）
  return (
      <div className="min-h-screen bg-slate-900"> {/* 外层纯色背景，延展到页面边缘 */}
      <main className="min-h-screen bg-slate-900 text-gray-200 p-4 md:p-8 max-w-6xl mx-auto relative overflow-hidden">
        {/* 背景纹理（淡色数据流，增强神秘感，不喧宾夺主） */}
        <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(8px)'
            }}
        />
        {/* 背景网格（科技感细节） */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee11_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee11_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        {/* 标题区域（渐变文字+科技感） */}
        <header className="mb-12 text-center relative z-10">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-3">
            Meta-Saas DataPlus+
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
            Enterprise-grade data analysis platform | 企业级数据分析平台
          </p>
        </header>

        {/* Hello API 卡片（深色科技感卡片） */}
        <div className="mb-8 p-5 bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden group">
          {/* 卡片顶部光效（hover时显示） */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <h2 className="text-xl font-semibold mb-4 text-cyan-300">Introduction · 前言</h2>
          {helloData && (
              <div className="space-y-4 text-gray-300">
                <div className="p-3 bg-slate-700/40 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">简体中文</p>
                  <p>{helloData.message_zh}</p>
                </div>
                <div className="p-3 bg-slate-700/40 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">English</p>
                  <p>{helloData.message_en}</p>
                </div>
                <div className="p-3 bg-slate-700/40 rounded-lg">
                  <p className="text-sm text-gray-400 mb-1">繁體中文</p>
                  <p>{helloData.message_zh_tw}</p>
                </div>
              </div>
          )}
        </div>

        {/* 服务器时间卡片（同风格深色卡片） */}
        <div className="mb-12 p-5 bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg hover:shadow-purple-500/10 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <h2 className="text-xl font-semibold mb-4 text-purple-300">Server Time · 服务器时间</h2>
          {timeData && (
              <div className="space-y-3 text-gray-300">
                <p className="text-lg">
                  <span className="text-gray-400">Status:</span> {timeData.message}
                </p>
                <p className="text-2xl font-mono text-cyan-300">
                  {timeData.time}
                </p>
                <p className="text-sm text-gray-400">
                  Timestamp: <span className="text-gray-300">{timeData.timestamp}</span>
                </p>
              </div>
          )}
        </div>

        {/* 核心功能引导区（升级后神秘科技风） */}
        <div className="h-[320px] md:h-[380px] mb-12 relative bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg flex flex-col items-center justify-center overflow-hidden group">
          {/* 背景动态光效 */}
          <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-700"
               style={{
                 backgroundImage: `url('https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
                 filter: 'brightness(0.7)'
               }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-800/50 to-transparent"></div>

          {/* 前景内容（相对定位） */}
          <div className="relative z-10 text-center px-4">
            <h3 className="text-2xl md:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wider">
              Core Function Matrix · 核心功能矩阵
            </h3>
            <p className="text-gray-400 text-sm md:text-base mb-10 max-w-2xl mx-auto opacity-80 group-hover:opacity-100 transition-opacity">
              Explore end-to-end data tools: cleaning, analysis, factor mining, and thinking modules
            </p>

            {/* 功能按钮组（科技感悬浮样式） */}
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
              <Link
                  href="/dataclean"
                  className="px-5 py-2.5 bg-slate-700/50 border border-cyan-500/30 text-cyan-300 rounded-lg hover:bg-cyan-900/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 hover:-translate-y-0.5"
              >
                数据清洗模块
              </Link>
              <Link
                  href="/datathinker"
                  className="px-5 py-2.5 bg-slate-700/50 border border-emerald-500/30 text-emerald-300 rounded-lg hover:bg-emerald-900/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-0.5"
              >
                数据思维模块
              </Link>
              <Link
                  href="/factorfinder"
                  className="px-5 py-2.5 bg-slate-700/50 border border-purple-500/30 text-purple-300 rounded-lg hover:bg-purple-900/30 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 hover:-translate-y-0.5"
              >
                因子发现模块
              </Link>
              <Link
                  href="/factorthinker"
                  className="px-5 py-2.5 bg-slate-700/50 border border-orange-500/30 text-orange-300 rounded-lg hover:bg-orange-900/30 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 hover:-translate-y-0.5"
              >
                因子思维模块
              </Link>
            </div>
          </div>

          {/* 底部光效条 */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
        </div>

        {/* 股票数据区域（深色主题适配） */}
        <div
            className="p-5 bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
          <h2 className="text-xl font-semibold mb-5 text-orange-300">Data & Chart · 股票数据与图表样例</h2>

          {/* 未加载/加载中：按钮作为掩饰，始终可点击，文字随状态变化 */}
          {!stockData && !stockError && (
              <div className="p-10 text-center bg-slate-700/30 border border-slate-600 rounded-lg">
                <p className="text-gray-400 mb-6">
                  {clickLabel == "正在加载中" ? 'Loading the data' : 'Click to load stock data'}
                  <br />
                  {clickLabel == "正在加载中" ? '正在加载中' : '点击加载股票数据'}
                </p>
                {/* 按钮始终可点击（无disabled），点击后显示loading文字 */}
                <button
                    onClick={()=> {setClickLabel("正在加载中");loadStockData();}}
                    className="px-6 py-2.5 bg-slate-700/50 border border-orange-500/30 text-orange-300 rounded-lg hover:bg-orange-900/30 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300"
                >
                  {clickLabel}
                </button>
              </div>
          )}

          {/* 错误状态 */}
          {stockError && (
              <div className="p-10 text-center bg-red-900/10 border border-red-500/20 rounded-lg">
                <h4 className="text-red-400 font-medium mb-2">Load Failed · 加载失败</h4>
                <p className="text-gray-400 mb-6">{stockError}</p>
                <button
                    onClick={loadStockData}
                    className="px-6 py-2 bg-red-900/50 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-900/70 transition-colors"
                >
                  Retry · 重试
                </button>
              </div>
          )}

          {/* 加载完成：直接展示数据 */}
          {stockData && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg text-gray-200">
                    {stockData.stock_name} ({stockData.stock_code})
                  </h3>
                  <p className="text-sm text-gray-400">
                    {stockData.message} | {stockData.data.length} days of data · {stockData.data.length}天数据
                  </p>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <StockChart
                      data={stockData.data}
                      title={`${stockData.stock_name} 近${stockData.data.length}天价格走势`}
                      theme="dark"
                      textColor="#e2e8f0"
                      gridColor="#334155"
                  />
                </div>

                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="min-w-full bg-slate-800/80">
                    <thead>
                    <tr className="bg-slate-700/60">
                      <th className="border-b border-slate-600 p-3 text-left text-gray-300 font-medium">Date · 日期</th>
                      <th className="border-b border-slate-600 p-3 text-right text-gray-300 font-medium">Open · 开盘</th>
                      <th className="border-b border-slate-600 p-3 text-right text-gray-300 font-medium">Close · 收盘</th>
                      <th className="border-b border-slate-600 p-3 text-right text-gray-300 font-medium">High · 最高</th>
                      <th className="border-b border-slate-600 p-3 text-right text-gray-300 font-medium">Low · 最低</th>
                    </tr>
                    </thead>
                    <tbody>
                    {stockData.data.map((item, index) => (
                        <tr
                            key={index}
                            className={`${index % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-700/30'} hover:bg-slate-600/20 transition-colors`}
                        >
                          <td className="border-b border-slate-700 p-3 text-gray-300">{item.date}</td>
                          <td className="border-b border-slate-700 p-3 text-right text-gray-300">{item.open.toFixed(2)}</td>
                          <td className="border-b border-slate-700 p-3 text-right text-gray-300">{item.close.toFixed(2)}</td>
                          <td className="border-b border-slate-700 p-3 text-right text-red-400">{item.high.toFixed(2)}</td>
                          <td className="border-b border-slate-700 p-3 text-right text-green-400">{item.low.toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
        </div>

        {/* 页脚（增强完整性） */}
        <footer className="mt-16 text-center text-gray-500 text-sm pb-8">
          <p>Meta-Saas DataPlus+ © {new Date().getFullYear()} | Enterprise Data Platform</p>
        </footer>
      </main>
      </div>
  );
}