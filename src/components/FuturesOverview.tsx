import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RefreshCw, Download, AlertTriangle } from 'lucide-react';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';
import { useSession } from 'next-auth/react';
import type { User } from 'next-auth'; // 导入User类型
// ECharts Tooltip 参数类型
interface EChartsTooltipParam {
  name: string;
  value: number;
  seriesName: string;
}

// 定义API成功响应（原始中文结构）
interface ApiSuccessResponse {
  status: "success";
  message: string;
  period_stats: RawPeriodStats;
  daily_detail: RawDailyDetail[];
}

// 定义API失败响应
interface ApiErrorResponse {
  status: "error";
  error: string;
}

// 联合类型：API响应可能是成功或失败
type ApiResponse = ApiSuccessResponse | ApiErrorResponse;

// 原始中文数据类型（后端返回）
interface RawDailyDetail {
  日期: string;
  "持仓量(手)": number;
  "持仓量变化(手)": number;
  "持仓量变化率(%)": number;
  "成交量(手)": number;
  成交量持仓比: number;
}

interface RawUserParams {
  instrument_id: string;
  symbol: string;
  "period(天)": number;
  实际过滤周期: string;
  持仓量字段: string;
}

interface RawStats {
  实际交易日数: number;
  "平均持仓量(手)": number;
  "最高持仓量(手)": number;
  "最低持仓量(手)": number;
  "周期总持仓量变化(手)": number;
  "平均持仓量变化率(%)": number;
  "最大单日变化率(%)": number;
  "最小单日变化率(%)": number;
  平均成交量持仓比: number;
}

interface RawApiCompatibility {
  akshare_version_tip: string;
  upgrade_suggestion: string;
}

interface RawPeriodStats {
  用户参数: RawUserParams;
  统计结果: RawStats;
  接口兼容性?: RawApiCompatibility;
}

// 转换后的英文数据类型
interface DailyDetail {
  date: string;
  openInterest: number;
  openInterestChange: number;
  openInterestChangeRate: number;
  volume: number;
  volumeToInterestRatio: number;
}

interface UserParams {
  instrument_id: string;
  actual_date_range: string;
  [key: string]: string | number;
}

interface Stats {
  actual_trading_days: number;
  avg_open_interest: number;
  max_daily_change_rate: number;
  min_daily_change_rate: number;
  avg_volume_to_interest_ratio: number;
  [key: string]: number | string;
}

interface ApiCompatibility {
  akshare_version_tip: string;
  upgrade_suggestion: string;
}

interface PeriodStats {
  user_params: UserParams;
  stats: Stats;
  interface_compatibility?: ApiCompatibility;
}

interface PositionData {
  status: string;
  message: string;
  period_stats: PeriodStats;
  daily_detail: DailyDetail[];
}

interface FuturesContract {
  instrumentId: string;
}

interface FuturesOverviewProps {
  futuresData: FuturesContract[];
}

// 中文键到英文键的映射
const CN_TO_EN_MAPPER = {
  "日期": "date",
  "持仓量(手)": "openInterest",
  "持仓量变化(手)": "openInterestChange",
  "持仓量变化率(%)": "openInterestChangeRate",
  "成交量(手)": "volume",
  "成交量持仓比": "volumeToInterestRatio",
  "用户参数": "user_params",
  "实际过滤周期": "actual_date_range",
  "统计结果": "stats",
  "实际交易日数": "actual_trading_days",
  "平均持仓量(手)": "avg_open_interest",
  "最大单日变化率(%)": "max_daily_change_rate",
  "最小单日变化率(%)": "min_daily_change_rate",
  "平均成交量持仓比": "avg_volume_to_interest_ratio",
};

// 转换后端中文数据为英文结构，并过滤首日数据
const transformData = (rawData: ApiSuccessResponse): PositionData => {
  // 过滤首日数据（从第二天开始展示）
  const filteredDailyDetail = rawData.daily_detail.slice(1); // 去掉第一天的数据

  return {
    status: rawData.status,
    message: rawData.message,
    period_stats: {
      user_params: {
        instrument_id: rawData.period_stats.用户参数.instrument_id,
        actual_date_range: rawData.period_stats.用户参数.实际过滤周期,
      },
      stats: {
        actual_trading_days: filteredDailyDetail.length,
        avg_open_interest: filteredDailyDetail.length > 0
            ? filteredDailyDetail.reduce((sum, item) => sum + item["持仓量(手)"], 0) / filteredDailyDetail.length
            : 0,
        max_daily_change_rate: filteredDailyDetail.length > 0
            ? Math.max(...filteredDailyDetail.map(item => item["持仓量变化率(%)"]))
            : 0,
        min_daily_change_rate: filteredDailyDetail.length > 0
            ? Math.min(...filteredDailyDetail.map(item => item["持仓量变化率(%)"]))
            : 0,
        avg_volume_to_interest_ratio: filteredDailyDetail.length > 0
            ? filteredDailyDetail.reduce((sum, item) => sum + item.成交量持仓比, 0) / filteredDailyDetail.length
            : 0,
      },
      interface_compatibility: rawData.period_stats.接口兼容性
          ? {
            akshare_version_tip: rawData.period_stats.接口兼容性.akshare_version_tip,
            upgrade_suggestion: rawData.period_stats.接口兼容性.upgrade_suggestion,
          }
          : undefined,
    },
    daily_detail: filteredDailyDetail.map((item) => ({
      date: item.日期,
      openInterest: item["持仓量(手)"],
      openInterestChange: item["持仓量变化(手)"],
      openInterestChangeRate: item["持仓量变化率(%)"],
      volume: item["成交量(手)"],
      volumeToInterestRatio: item.成交量持仓比,
    })),
  };
};

// 工具函数：格式化数字
const formatNumber = (num: number | string): string => {
  if (typeof num === 'string') return num;
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
};
// 新增：防抖工具函数（限制resize事件100ms内只执行一次）
const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    wait: number = 100
): ((this: ThisParameterType<T>, ...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;
  // 显式指定this类型为原函数的this类型（ThisParameterType<T>）
  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};
// 转换日期范围为天数
const rangeToDays = (range: string): number => {
  // 为了确保有首日数据可过滤，日期范围需要加1天
  const baseMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '180d': 180,'1y': 365 };
  const baseDays = baseMap[range] || 7;
  return baseDays + 1; // 多请求1天数据用于过滤
};

// 处理变化率样式
const getChangeStyle = (value: number | string) => {
  if (typeof value === 'string' || value === 0) return 'text-gray-500';
  return value > 0 ? 'text-green-500' : 'text-red-500';
};

const FuturesOverview: React.FC<FuturesOverviewProps> = ({ futuresData }) => {
  // 状态管理（英文命名）
  const [selectedContract, setSelectedContract] = useState('IF2512');
  const [dateRange, setDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<ECharts | null>(null);
  const { data: session } = useSession();
  // 断言session.user为“User+privilege”类型，并用可选链兜底
  const userWithPrivilege = session?.user as (User & { privilege?: boolean }) | undefined;
  const hasPrivilege = userWithPrivilege?.privilege ?? false;

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'About 1 Quarter' },
    // 有权限才显示90d及以上选项
    ...(hasPrivilege
        ? [
          { value: '180d', label: 'About half year' },
          { value: '1y', label: 'About 1 year' }
        ]
        : [])
  ];
  useEffect(() => {
    // 定义无权限时的“受限范围”
    const restrictedRanges = ['90d', '180d', '1y'];
    // 若用户无权限，且当前选中的是受限范围，重置为默认7d
    if (!hasPrivilege && restrictedRanges.includes(dateRange)) {
      setDateRange('7d');
    }
  }, [hasPrivilege, dateRange]); // 监听权限和日期变化


  // 数据请求逻辑
  const fetchPositionData = async () => {
    if (selectedContract === "all") {
      setPositionData(null);
      setError("");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      const apiEndpoint = `${process.env.NEXT_PUBLIC_API_URL}/futures_open_interest_by_period/`;
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instrument_id: selectedContract,
          period: rangeToDays(dateRange), // 多请求1天数据
        }),
      });

      const rawData = (await response.json()) as ApiResponse;
      if (response.ok) {
        if (rawData.status === "success") {
          const transformedData = transformData(rawData);
          setPositionData(transformedData);
        } else {
          throw new Error(rawData.error);
        }
      } else {
        throw new Error("Request failed");
      }
    } catch (err) {
      setError((err as Error).message);
      setPositionData(null);
    } finally {
      setIsLoading(false);
    }
  };


  // 合约或日期变化时自动请求
  useEffect(() => {
    const timer = setTimeout(fetchPositionData, 500);
    return () => clearTimeout(timer);
  }, [selectedContract, dateRange]);

  // 初始化图表（英文配置）
  useEffect(() => {
    if (!positionData || !positionData.daily_detail.length || !chartRef.current) return;

    const { daily_detail } = positionData;
    // 1. 过滤无效数据（确保数值有效，避免图表渲染错误）
    const validData = daily_detail.filter(item =>
        typeof item.openInterest === 'number' &&
        typeof item.openInterestChangeRate === 'number' &&
        typeof item.volume === 'number'
    );
    // 2. 基于【过滤后的validData】生成图表数据（原代码用了未过滤的daily_detail，是bug）
    const dates = validData.map((item) => item.date);
    const openInterests = validData.map((item) => item.openInterest); // 无需Number()，已过滤为number
    const changeRates = validData.map((item) => item.openInterestChangeRate); // 同上

    // 3. 初始化图表实例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    // 4. 防抖处理resize事件（避免高频触发导致ECharts主线程冲突）
    const handleResize = debounce(() => {
      // 安全校验：确保实例未被销毁
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    });

    // 5. 添加resize事件监听（用命名函数，便于后续移除）
    window.addEventListener('resize', handleResize);

    // 6. 设置图表配置（优化tooltip安全访问）
    chartInstance.current.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: EChartsTooltipParam[]) => {
          // 安全校验：避免params长度不足或值为undefined
          if (params.length < 2 || !params[0] || !params[1] || params[0].value === undefined) {
            return 'No valid data';
          }
          return `<div>
          <p>Date: ${params[0].name || 'N/A'}</p>
          <p>Open Interest: ${formatNumber(params[0].value)} lots</p>
          <p>Change Rate: <span style="color:${params[1].value > 0 ? '#22c55e' : '#ef4444'}">${formatNumber(params[1].value)}%</span></p>
        </div>`;
        },
      },
      legend: { data: ['Open Interest', 'Change Rate(%)'], top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: dates, axisLabel: { rotate: 30 } },
      yAxis: [
        {
          type: 'value',
          name: 'Open Interest (lots)',
          splitLine: { lineStyle: { color: '#f1f5f9' } },
          // 优化：设置y轴最小值为数据最小值的95%，避免数据贴顶
          min: Math.min(...openInterests) * 0.95,
        },
        {
          type: 'value',
          name: 'Change Rate (%)',
          position: 'right',
          splitLine: { show: false },
          // 优化：根据变化率范围调整y轴，避免正负值不对称
          min: Math.min(...changeRates) * 1.2,
          max: Math.max(...changeRates) * 1.2,
        },
      ],
      series: [
        {
          name: 'Open Interest',
          type: 'line',
          data: openInterests,
          lineStyle: { color: '#3b82f6' },
          symbol: 'circle', // 显示数据点，提升可读性
          symbolSize: 6,
          yAxisIndex: 0,
        },
        {
          name: 'Change Rate(%)',
          type: 'bar',
          data: changeRates,
          barWidth: '40%', // 调整柱子宽度，避免拥挤
          itemStyle: {
            color: (p: { value?: number }) => {
              const value = p?.value ?? 0;
              return value > 0 ? '#22c55e' : '#ef4444';
            }
          },
          yAxisIndex: 1,
        },
      ],
    });

    // 7. 组件卸载时：移除事件监听+销毁图表实例（避免内存泄漏）
    return () => {
      window.removeEventListener('resize', handleResize); // 移除防抖后的命名函数
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [positionData]); // 依赖只传positionData，避免不必要的重渲染

  // CSV特殊字符转义（处理逗号、引号、换行）
  const escapeCsvValue = (value: string | number): string => {
    if (typeof value === 'number') return String(value);
    // 包含逗号、引号或换行符时，用双引号包裹
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // 双引号转义为两个双引号
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  // 导出报告（支持CSV格式）
  const exportReport = (format: string) => {
    if (!positionData) return;

    // 仅处理CSV格式（其他格式可保留原逻辑）
    if (format !== 'csv') {
      alert(`Export ${format} report: ${selectedContract} (${dateRange})`);
      return;
    }

    // 1. 准备CSV内容
    const csvRows: string[] = [];

    // 2. 添加报告标题和元信息（合约、日期范围）
    csvRows.push(`Futures Report,${escapeCsvValue(selectedContract)}`);
    csvRows.push(`Date Range,${escapeCsvValue(dateRange)}`);
    csvRows.push(`Generated At,${new Date().toISOString()}`);
    csvRows.push(''); // 空行分隔

    // 3. 添加统计指标
    csvRows.push('=== Statistics ===');
    const stats = positionData.period_stats.stats;
    csvRows.push(`Actual Trading Days,${stats.actual_trading_days}`);
    csvRows.push(`Average Open Interest (lots),${escapeCsvValue(stats.avg_open_interest)}`);
    csvRows.push(`Max Daily Change Rate (%),${escapeCsvValue(stats.max_daily_change_rate)}`);
    csvRows.push(`Min Daily Change Rate (%),${escapeCsvValue(stats.min_daily_change_rate)}`);
    csvRows.push(`Avg Volume/Interest Ratio,${escapeCsvValue(stats.avg_volume_to_interest_ratio)}`);
    csvRows.push(''); // 空行分隔

    // 4. 添加每日明细数据（表头+内容）
    csvRows.push('=== Daily Details ===');
    // 明细表头
    csvRows.push([
      'Date',
      'Open Interest (lots)',
      'Interest Change (lots)',
      'Change Rate (%)',
      'Volume (lots)',
      'Volume/Interest Ratio'
    ].map(escapeCsvValue).join(','));
    // 明细数据行
    positionData.daily_detail.forEach(item => {
      csvRows.push([
        item.date,
        item.openInterest,
        item.openInterestChange,
        item.openInterestChangeRate,
        item.volume,
        item.volumeToInterestRatio
      ].map(escapeCsvValue).join(','));
    });

    // 5. 转换为CSV文本
    const csvContent = csvRows.join('\n');

    // 6. 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // 文件名格式：合约_日期范围_报告.csv
    const fileName = `${selectedContract}_${dateRange}_report.csv`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click(); // 触发下载

    // 7. 清理临时资源
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };
  // 刷新分析
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      fetchPositionData();
      setIsLoading(false);
    }, 800);
  };

  return (
      <div className="space-y-6">
        {/* 顶部筛选栏（英文） */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Futures Trading Data Analysis Overview</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Multi-dimensional analysis of futures contract data (price/open interest/volume) to explore market insights
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* 合约选择 */}
            <Select value={selectedContract} onValueChange={setSelectedContract}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Select Contract" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-200">
                <SelectItem value="all">All Contracts</SelectItem>
                {futuresData.map((contract) => (
                    <SelectItem key={contract.instrumentId} value={contract.instrumentId}>
                      {contract.instrumentId}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 日期范围 */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-200">
                {dateRangeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 刷新按钮 */}
            <Button onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Analysis
            </Button>

            {/* 导出按钮 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white dark:bg-gray-200">
              {/*  <DropdownMenuItem onClick={() => exportReport('pdf')}>PDF Format</DropdownMenuItem>*/}
                <DropdownMenuItem onClick={() => exportReport('csv')}>Excel Format</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 错误提示（英文） */}
        {error && (
            <Card className="bg-red-50 p-4 border-l-4 border-red-500">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <p className="text-red-600">{error}</p>
              </div>
            </Card>
        )}

        {/* 未选择合约提示 */}
        {selectedContract === 'all' && (
            <Card className="p-6 text-center">
              <p className="text-gray-500">Please select a specific contract to view open interest analysis</p>
            </Card>
        )}

        {/* 加载状态 */}
        {isLoading && selectedContract !== 'all' && (
            <div className="py-10 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500 mb-2"></div>
              <p>Loading {selectedContract} data...</p>
            </div>
        )}

        {/* 持仓分析内容（英文）- 从第二天开始展示 */}
        {!isLoading && !error && selectedContract !== 'all' && positionData && positionData.daily_detail.length > 0 && (
            <>
              {/* 核心指标卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 hover:shadow-md">
                  <p className="text-sm text-gray-500">Average Open Interest</p>
                  <p className="text-2xl font-bold">{formatNumber(positionData.period_stats.stats.avg_open_interest)} lots</p>
                </Card>
                <Card className="p-4 hover:shadow-md">
                  <p className="text-sm text-gray-500">Max Daily Change Rate</p>
                  <p className={`text-2xl font-bold ${getChangeStyle(positionData.period_stats.stats.max_daily_change_rate)}`}>
                    {formatNumber(positionData.period_stats.stats.max_daily_change_rate)}%
                  </p>
                </Card>
                <Card className="p-4 hover:shadow-md">
                  <p className="text-sm text-gray-500">Min Daily Change Rate</p>
                  <p className={`text-2xl font-bold ${getChangeStyle(positionData.period_stats.stats.min_daily_change_rate)}`}>
                    {formatNumber(positionData.period_stats.stats.min_daily_change_rate)}%
                  </p>
                </Card>
                <Card className="p-4 hover:shadow-md">
                  <p className="text-sm text-gray-500">Avg Volume/Interest Ratio</p>
                  <p className="text-2xl font-bold">{formatNumber(positionData.period_stats.stats.avg_volume_to_interest_ratio)}</p>
                </Card>
              </div>

              {/* 图表 */}
              <Card className="p-4">
                <h3 className="text-lg font-medium mb-4">Open Interest Trend & Change Rate {selectedContract}</h3>
                <div ref={chartRef} className="w-full h-[400px]"></div>
              </Card>

              {/* 明细表格（英文表头）- 从第二天开始展示 */}
              <Card>
                <div className="p-4 border-b">
                  <h3 className="font-medium">Open Interest Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Open Interest (lots)</TableHead>
                        <TableHead>Interest Change (lots)</TableHead>
                        <TableHead>Change Rate (%)</TableHead>
                        <TableHead>Volume (lots)</TableHead>
                        <TableHead>Volume/Interest Ratio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positionData.daily_detail.map((item, i) => (
                          <TableRow key={i}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{formatNumber(item.openInterest)}</TableCell>
                            <TableCell className={getChangeStyle(Number(item.openInterestChange))}>
                              {formatNumber(item.openInterestChange)}
                            </TableCell>
                            <TableCell className={getChangeStyle(Number(item.openInterestChangeRate))}>
                              {formatNumber(item.openInterestChangeRate)}%
                            </TableCell>
                            <TableCell>{formatNumber(item.volume)}</TableCell>
                            <TableCell>{formatNumber(item.volumeToInterestRatio)}</TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
        )}
      </div>
  );
};

export default FuturesOverview;