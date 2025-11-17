'use client';
import { useEffect, useState, useCallback } from 'react';
import { getHelloMessage, getServerTime, getStockData } from '@/services/api';
import StockChart from '@/components/StockChart';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// 股票数据类型
export interface StockItem {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
}

// 基础 API 响应类型
export interface HelloResponse {
  message_zh: string;
  message_en: string;
  message_zh_tw: string;
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

// 加载动画组件
const LoadingSpinner: React.FC<{ className?: string }> = ({ className = "" }) => (
    <div
        className={`inline-block w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin ${className}`}
    ></div>
);

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 基础数据状态
  const [helloData, setHelloData] = useState<HelloResponse | null>(null);
  const [timeData, setTimeData] = useState<TimeResponse | null>(null);
  const [baseLoading, setBaseLoading] = useState(true);
  const [baseError, setBaseError] = useState<string | null>(null);

  // 股票数据状态（关键修改：新增 initialLoadDone 控制首次加载）
  const [stockData, setStockData] = useState<StockResponse | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [inputStockCode, setInputStockCode] = useState(""); // 输入框常驻，初始为空
  const [codeWarn, setCodeWarn] = useState("");
  const [initialLoadDone, setInitialLoadDone] = useState(false); // 标记首次加载完成，避免切换后自动加载

  // 未登录跳转
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // 加载基础数据
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setBaseLoading(true);
        const helloRes = await getHelloMessage();
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

  // 每秒获取服务器时间
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const timeRes = await getServerTime();
        setTimeData(timeRes);
      } catch (error) {
        console.error("Failed to fetch server time:", error);
      }
    };
    fetchServerTime();
    const intervalId = setInterval(fetchServerTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // 核心：加载股票数据（仅在点击提交时触发，取消自动加载）
  const loadStockData = useCallback(async () => {
    if (stockLoading) return;

    try {
      // 1. 处理股票代码：未输入则提示，不再默认加载sh600519（避免自动恢复）
      const targetCode = inputStockCode.trim();
      if (!targetCode) {
        setCodeWarn("⚠️ 请输入股票代码（如sh600519）");
        return;
      }

      // 2. 格式校验
      const codeReg = /^(sh|sz)\d{6}$/;
      if (!codeReg.test(targetCode)) {
        setCodeWarn("⚠️ 代码格式错误！需为 sh/sz + 6位数字（如sh600519）");
        return;
      }
      setCodeWarn("");
      setStockError(null);

      // 3. 发起请求
      setStockLoading(true);
      const stockRes = await getStockData(targetCode);

      setStockData(stockRes);
      setInitialLoadDone(true); // 首次加载完成后标记
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load stock data';
      setStockError(errorMsg);
      setStockData(null); // 加载失败时清空数据
      console.error('Stock error:', err);
    } finally {
      setStockLoading(false);
    }
  }, [inputStockCode, stockLoading]); // 仅依赖输入值和加载状态

  // 页面首次加载：默认加载sh600519（仅执行一次）
  useEffect(() => {
    const fetchInitialStockData = async () => {
      if (initialLoadDone) return; // 首次加载完成后不再执行
      setInputStockCode("sh600519"); // 首次加载时给输入框赋值默认代码
      await loadStockData();
      setInitialLoadDone(true); // 标记首次加载完成
    };
    fetchInitialStockData();
  }, [initialLoadDone, loadStockData]); // 仅首次执行

  // 全局加载中状态
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

  return (
      <div className="min-h-screen bg-slate-900">
        <main className="min-h-screen bg-slate-900 text-gray-200 p-4 md:p-8 max-w-6xl mx-auto relative overflow-hidden">
          {/* 背景纹理+网格 */}
          <div
              className="absolute inset-0 opacity-5 pointer-events-none"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(8px)'
              }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#22d3ee11_1px,transparent_1px),linear-gradient(to_bottom,#22d3ee11_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* 标题区域 */}
          <header className="mb-12 text-center relative z-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-3">
              Meta-Saas DataPlus+
            </h1>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
              Enterprise-grade data analysis platform | 企业级数据分析平台
            </p>
          </header>

          {/* Hello API 卡片 */}
          <div className="mb-8 p-5 bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 relative overflow-hidden group">
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

          {/* 服务器时间卡片 */}
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

          {/* 核心功能引导区 */}
          <div className="h-[320px] md:h-[380px] mb-12 relative bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-lg flex flex-col items-center justify-center overflow-hidden group">
            <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-700"
                 style={{
                   backgroundImage: `url('https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
                   filter: 'brightness(0.7)'
                 }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-800/50 to-transparent"></div>

            <div className="relative z-10 text-center px-4">
              <h3 className="text-2xl md:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wider">
                Core Function Matrix · 核心功能矩阵
              </h3>
              <p className="text-gray-400 text-sm md:text-base mb-10 max-w-2xl mx-auto opacity-80 group-hover:opacity-100 transition-opacity">
                Explore end-to-end data tools: cleaning, analysis, factor mining, and thinking modules
              </p>

              <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
                <Link
                    href="/datathinker"
                    className="px-5 py-2.5 bg-slate-700/50 border border-emerald-500/30 text-emerald-300 rounded-lg hover:bg-emerald-900/30 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-0.5"
                >
                  数据思维模块
                </Link>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-50 group-hover:opacity-80 transition-opacity"></div>
          </div>

          {/* 股票数据区域（关键修改：输入框常驻+独立提交按钮） */}
          <div
              className="p-5 bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-lg shadow-lg relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
            <h2 className="text-xl font-semibold mb-5 text-orange-300">Data & Chart · 股票数据与图表样例</h2>

            {/* 关键：输入框常驻（移出条件判断，始终显示）+ 独立提交按钮 */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <input
                  type="text"
                  value={inputStockCode}
                  onChange={(e) => {
                    setInputStockCode(e.target.value);
                    setCodeWarn(""); // 输入时清空警告
                  }}
                  placeholder="请输入股票代码（格式：sh/sz + 6位数字，如sh600519）"
                  className="w-full sm:w-64 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-gray-200 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
              />
              {/* 独立提交按钮（点击才加载，不自动触发） */}
              <button
                  onClick={loadStockData}
                  disabled={stockLoading}
                  className={`px-6 py-2.5 border rounded-lg transition-all duration-300 ${
                      stockLoading
                          ? 'bg-slate-700/30 border-slate-600 text-gray-500 cursor-not-allowed'
                          : 'bg-orange-900/50 border-orange-500/50 text-orange-300 hover:bg-orange-900/70 hover:shadow-lg hover:shadow-orange-500/10'
                  }`}
              >
                {stockLoading ? <><LoadingSpinner className="inline-block mr-2 w-5 h-5" /> 加载中</> : '提交查询 · Submit'}
              </button>
            </div>

            {/* 格式警告（常驻，有错误才显示） */}
            {codeWarn && (
                <div className="text-center mb-6 text-red-400 text-sm">
                  {codeWarn}
                </div>
            )}

            {/* 错误状态（独立显示，不影响输入框） */}
            {stockError && (
                <div className="p-6 text-center bg-red-900/10 border border-red-500/20 rounded-lg mb-6">
                  <h4 className="text-red-400 font-medium mb-2">Load Failed · 加载失败</h4>
                  <p className="text-gray-400">{stockError}</p>
                </div>
            )}

            {/* 加载中状态（仅显示动画，不隐藏输入框） */}
            {stockLoading && !stockData && !stockError && (
                <div className="p-10 text-center bg-slate-700/30 border border-slate-600 rounded-lg mb-6">
                  <LoadingSpinner className="mx-auto mb-4" />
                  <p className="text-gray-400">正在获取股票数据...</p>
                </div>
            )}

            {/* 数据展示区域（加载成功才显示） */}
            {stockData && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="font-medium text-lg text-gray-200">
                      {stockData.stock_name} ({stockData.stock_code})
                    </h3>
                    <p className="text-sm text-gray-400">
                      {stockData.message} | {stockData.data.length} days of data · {stockData.data.length}天数据
                    </p>
                  </div>

                  {/* 股票图表 */}
                  <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <StockChart
                        data={stockData.data}
                        title={`${stockData.stock_name} 近${stockData.data.length}天价格走势`}
                        theme="dark"
                        textColor="#e2e8f0"
                        gridColor="#334155"
                    />
                  </div>

                  {/* 数据表格 */}
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

                  {/* 重置按钮（仅清空数据，不自动加载） */}
                  <div className="text-center mt-2">
                    <button
                        onClick={() => {
                          setStockData(null); // 仅清空数据，不重置输入框
                          setStockError(null);
                        }}
                        className="px-4 py-1.5 bg-slate-700/50 border border-slate-600 text-gray-400 rounded-lg hover:bg-slate-700/80 transition-colors text-sm"
                    >
                      清空数据 · Clear Data
                    </button>
                  </div>
                </div>
            )}

            {/* 无数据且无错误（首次加载前/清空后） */}
            {!stockData && !stockError && !stockLoading && (
                <div className="p-10 text-center bg-slate-700/30 border border-slate-600 rounded-lg">
                  <p className="text-gray-400">请输入股票代码并点击「提交查询」获取数据</p>
                </div>
            )}
          </div>

          {/* 页脚 */}
          <footer className="mt-16 text-center text-gray-500 text-sm pb-8">
            <p>Meta-Saas DataPlus+ © {new Date().getFullYear()} | Enterprise Data Platform</p>
          </footer>
        </main>
      </div>
  );
}