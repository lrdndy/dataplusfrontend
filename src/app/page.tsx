
'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { getHelloMessage, getServerTime, getStockData } from '@/services/api';
import StockChart from '@/components/StockChart';

// 导出股票数据类型，供 StockChart 使用
export interface StockItem {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
}

// 基础 API 响应类型
interface HelloResponse {
  message: string;
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
  const stockRef = useRef<HTMLDivElement>(null);

  // 加载基础数据
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setBaseLoading(true);
        const [helloRes, timeRes] = await Promise.all([
          getHelloMessage(),
          getServerTime(),
        ]);
        setHelloData(helloRes);
        setTimeData(timeRes);
      } catch (err) {
        setBaseError('Failed to fetch base data');
        console.error('Base error:', err);
      } finally {
        setBaseLoading(false);
      }
    };

    fetchBaseData();
  }, []);

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

  // 滚动监听
  useEffect(() => {
    if (stockLoaded) return;

    const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadStockData();
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
    );

    if (stockRef.current) observer.observe(stockRef.current);
    return () => observer.disconnect();
  }, [loadStockData, stockLoaded]);

  // 加载中/错误状态
  if (baseLoading) return <div className="p-8 text-center">Loading basic data...</div>;
  if (baseError) return <div className="p-8 text-center text-red-500">Error: {baseError}</div>;

  // 页面渲染
  return (
      <main className="min-h-screen p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Next.js + Django Stock Demo</h1>

        {/* Hello API 卡片 */}
        <div className="mb-8 p-4 border rounded-lg shadow-sm hover:shadow transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Hello API Response</h2>
          {helloData && <p className="text-gray-700">{helloData.message}</p>}
        </div>

        {/* 服务器时间卡片 */}
        <div className="mb-8 p-4 border rounded-lg shadow-sm hover:shadow transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Server Time</h2>
          {timeData && (
              <div className="text-gray-700">
                <p>{timeData.message}: {timeData.time}</p>
                <p className="text-gray-500 text-sm mt-1">Timestamp: {timeData.timestamp}</p>
              </div>
          )}
        </div>

        {/* 占位引导 */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center mb-8 border">
          <p className="text-gray-400">Scroll down to load stock data...</p>
        </div>

        {/* 股票数据区域 */}
        <div ref={stockRef} className="p-4 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Stock Data & Chart</h2>

          {/* 未加载 */}
          {!stockLoaded && !stockLoading && !stockError && (
              <div className="p-8 text-center text-gray-500 border rounded">
                <p>Stock data will load when you scroll here</p>
                <button
                    onClick={loadStockData}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Load Now
                </button>
              </div>
          )}

          {/* 加载中 */}
          {stockLoading && <div className="p-8 text-center">Loading stock data...</div>}

          {/* 错误 */}
          {stockError && (
              <div className="p-8 text-center text-red-500">
                {stockError}
                <button
                    onClick={loadStockData}
                    className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Retry
                </button>
              </div>
          )}

          {/* 股票数据展示 */}
          {stockData && (
              <div>
                <h3 className="font-medium mb-3 text-gray-800">
                  {stockData.stock_name} ({stockData.stock_code})
                </h3>

                {/* 图表 */}
                <StockChart
                    data={stockData.data}
                    title={`${stockData.stock_name} 近${stockData.data.length}天价格走势`}
                />

                {/* 表格 */}
                <div className="overflow-x-auto mt-6">
                  <table className="min-w-full border-collapse">
                    <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-2 text-left text-gray-700">Date</th>
                      <th className="border p-2 text-right text-gray-700">Open</th>
                      <th className="border p-2 text-right text-gray-700">Close</th>
                      <th className="border p-2 text-right text-gray-700">High</th>
                      <th className="border p-2 text-right text-gray-700">Low</th>
                    </tr>
                    </thead>
                    <tbody>
                    {stockData.data.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border p-2 text-gray-800">{item.date}</td>
                          <td className="border p-2 text-right text-gray-800">{item.open.toFixed(2)}</td>
                          <td className="border p-2 text-right text-gray-800">{item.close.toFixed(2)}</td>
                          <td className="border p-2 text-right text-red-600">{item.high.toFixed(2)}</td>
                          <td className="border p-2 text-right text-green-600">{item.low.toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
          )}
        </div>
      </main>
  );
}
