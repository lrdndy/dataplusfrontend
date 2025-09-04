"use client";

import { useState, useEffect } from 'react';
import {
    BarChart3,
    LineChart,
    PieChart,
    TrendingUp,
    TrendingDown,
    Database,
    Filter,
    Download,
    RefreshCw,
    Settings,
    Save,
    Clock,
    BarChart,
    Layers,
    Zap,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    Menu,
    X,
    Bell,
    User,
    FileText,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Link
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

// 固定种子的随机数生成器，避免服务端客户端渲染不匹配
const createRandomGenerator = (seed: number) => {
    return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
};

// 使用固定种子确保服务端和客户端生成相同的"随机"数据
const seed = 12345;
const random = createRandomGenerator(seed);

// 定义交易数据相关类型
interface TickerData {
    ticker: string;
    name: string;
    sector: string;
    price: number;
    change: number;
    volume: number;
    marketCap: number;
    volatility: number;
}

interface AnalysisMetric {
    id: string;
    name: string;
    value: number;
    change: number;
    unit: string;
    importance: 'high' | 'medium' | 'low';
}

interface TimeSeriesData {
    timestamp: string;
    [key: string]: number | string;
}

interface CorrelationData {
    ticker1: string;
    ticker2: string;
    correlation: number;
}

interface ClusterData {
    cluster: number;
    tickers: string[];
    characteristics: Record<string, number>;
}

// 模拟交易数据
const mockTickerData: TickerData[] = [
    {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        price: 178.23,
        change: 1.24,
        volume: 52487321,
        marketCap: 2856000000000,
        volatility: 1.87
    },
    {
        ticker: 'MSFT',
        name: 'Microsoft Corp',
        sector: 'Technology',
        price: 336.72,
        change: 0.87,
        volume: 24561892,
        marketCap: 2345000000000,
        volatility: 1.53
    },
    {
        ticker: 'GOOGL',
        name: 'Alphabet Inc.',
        sector: 'Technology',
        price: 136.45,
        change: -0.42,
        volume: 18234567,
        marketCap: 1820000000000,
        volatility: 1.65
    },
    {
        ticker: 'AMZN',
        name: 'Amazon.com Inc.',
        sector: 'Consumer Cyclical',
        price: 138.52,
        change: 2.15,
        volume: 42156789,
        marketCap: 1432000000000,
        volatility: 2.34
    },
    {
        ticker: 'TSLA',
        name: 'Tesla Inc.',
        sector: 'Automotive',
        price: 248.37,
        change: -3.21,
        volume: 125478963,
        marketCap: 789000000000,
        volatility: 5.67
    },
    {
        ticker: 'META',
        name: 'Meta Platforms',
        sector: 'Technology',
        price: 312.89,
        change: 1.78,
        volume: 28765431,
        marketCap: 756000000000,
        volatility: 3.21
    }
];

// 模拟分析指标数据
const mockAnalysisMetrics: AnalysisMetric[] = [
    { id: 'm1', name: '平均日收益率', value: 0.87, change: 0.12, unit: '%', importance: 'high' },
    { id: 'm2', name: '波动率指数', value: 2.34, change: -0.23, unit: '', importance: 'high' },
    { id: 'm3', name: '交易量均值', value: 45623789, change: 5.67, unit: '股', importance: 'medium' },
    { id: 'm4', name: '市盈率', value: 28.76, change: 1.32, unit: '', importance: 'medium' },
    { id: 'm5', name: 'Beta系数', value: 1.23, change: 0.05, unit: '', importance: 'high' },
    { id: 'm6', name: '流动性指数', value: 87.65, change: -2.13, unit: '', importance: 'low' }
];

// 生成时间序列数据 - 使用固定种子随机数
const generateTimeSeriesData = (tickers: string[], days: number = 30): TimeSeriesData[] => {
    const data: TimeSeriesData[] = [];
    const startDate = new Date();

    // 为时间序列生成创建独立的随机数生成器
    const tsRandom = createRandomGenerator(seed + 1);

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(startDate.getDate() - i);
        const timestamp = date.toISOString().split('T')[0];

        const entry: TimeSeriesData = { timestamp };

        tickers.forEach(ticker => {
            // 生成随机但有趋势的价格数据
            const basePrice = 100 + tsRandom() * 200;
            const trendFactor = (days - i) * 0.02;
            const randomFactor = (tsRandom() - 0.5) * 5;
            entry[ticker] = parseFloat((basePrice + trendFactor * basePrice + randomFactor).toFixed(2));
        });

        data.push(entry);
    }

    return data;
};

// 生成相关性数据 - 使用固定种子随机数
const generateCorrelationData = (tickers: string[]): CorrelationData[] => {
    const data: CorrelationData[] = [];
    const corrRandom = createRandomGenerator(seed + 2);

    for (let i = 0; i < tickers.length; i++) {
        for (let j = i + 1; j < tickers.length; j++) {
            // 生成-1到1之间的相关系数，使用固定种子
            const correlation = parseFloat((corrRandom() * 2 - 1).toFixed(2));
            data.push({
                ticker1: tickers[i],
                ticker2: tickers[j],
                correlation
            });
        }
    }

    return data;
};

// 生成聚类数据 - 使用固定种子随机数
const generateClusterData = (tickers: string[]): ClusterData[] => {
    const clusters: ClusterData[] = [];
    const clusterCount = 3;
    const clusterRandom = createRandomGenerator(seed + 3);

    // 随机分配股票到聚类 - 使用固定种子确保一致性
    const shuffledTickers = [...tickers].sort(() => 0.5 - clusterRandom());
    const tickersPerCluster = Math.ceil(tickers.length / clusterCount);

    for (let i = 0; i < clusterCount; i++) {
        const start = i * tickersPerCluster;
        const end = start + tickersPerCluster;
        const clusterTickers = shuffledTickers.slice(start, end);

        clusters.push({
            cluster: i + 1,
            tickers: clusterTickers,
            characteristics: {
                '平均波动率': parseFloat((clusterRandom() * 3 + 0.5).toFixed(2)),
                '平均收益率': parseFloat((clusterRandom() * 2 - 0.5).toFixed(2)),
                '市值规模': parseFloat((clusterRandom() * 100 + 50).toFixed(0))
            }
        });
    }

    return clusters;
};

const timeSeriesData = generateTimeSeriesData(mockTickerData.map(t => t.ticker));
const correlationData = generateCorrelationData(mockTickerData.map(t => t.ticker));
const clusterData = generateClusterData(mockTickerData.map(t => t.ticker));

// 主分析页面组件
export default function TradingAnalysisPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTicker, setSelectedTicker] = useState('all');
    const [dateRange, setDateRange] = useState('30d');
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    // 添加客户端渲染标记，避免Hydration不匹配
    const [isClient, setIsClient] = useState(false);

    // 确保在客户端渲染时才执行
    useEffect(() => {
        setIsClient(true);
    }, []);

    // 模拟分析加载
    useEffect(() => {
        if (!isClient) return; // 仅在客户端执行

        // 模拟分析进度
        const timer = setTimeout(() => {
            setAnalysisLoading(true);
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(progressInterval);
                        setAnalysisLoading(false);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 150);

            return () => clearInterval(progressInterval);
        }, 500);

        return () => clearTimeout(timer);
    }, [selectedTicker, dateRange, isClient]);

    // 导出报告
    const exportReport = (format: 'pdf' | 'excel') => {
        setAnalysisLoading(true);
        setProgress(0);

        // 模拟导出进度
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setAnalysisLoading(false);
                    alert(`报告已成功导出为${format.toUpperCase()}格式`);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    };

    // 获取变化趋势的图标和样式
    const getChangeIndicator = (value: number) => {
        if (value > 0) {
            return (
                <span className="flex items-center text-green-500">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    {value.toFixed(2)}%
                </span>
            );
        } else if (value < 0) {
            return (
                <span className="flex items-center text-red-500">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    {Math.abs(value).toFixed(2)}%
                </span>
            );
        } else {
            return <span>{value.toFixed(2)}%</span>;
        }
    };

    // 获取重要性标签样式
    const getImportanceBadge = (importance: string) => {
        switch (importance) {
            case 'high':
                return <Badge className="bg-red-500 hover:bg-red-600">高重要性</Badge>;
            case 'medium':
                return <Badge className="bg-amber-500 hover:bg-amber-600">中重要性</Badge>;
            case 'low':
                return <Badge className="bg-green-500 hover:bg-green-600">低重要性</Badge>;
            default:
                return <Badge>{importance}</Badge>;
        }
    };

    // 确保在客户端渲染完成后再显示内容
    if (!isClient) {
        return <div className="min-h-screen"></div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* 顶部导航栏 */}
            <header className="sticky top-0 z-30 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                        <div className="flex items-center gap-2">
                            <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            <h1 className="text-xl font-bold">DataThinker</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell className="h-5 w-5" />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>通知</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <img src="https://picsum.photos/id/1005/200/200" alt="用户头像" className="object-cover" />
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>个人资料</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>设置</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 侧边栏 */}
                <aside
                    className={`${
                        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    } fixed inset-y-0 left-0 z-20 w-64 border-r bg-white dark:bg-gray-900 p-4 transition-transform md:relative md:translate-x-0 md:translate-y-0`}
                >
                    <nav className="space-y-1">
                        <Button
                            variant={activeTab === 'overview' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('overview')}
                        >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            数据分析概览
                        </Button>
                        <Button
                            variant={activeTab === 'statistics' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('statistics')}
                        >
                            <BarChart className="mr-2 h-4 w-4" />
                            基础统计分析
                        </Button>
                        <Button
                            variant={activeTab === 'trend' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('trend')}
                        >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            趋势预测分析
                        </Button>
                        <Button
                            variant={activeTab === 'correlation' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('correlation')}
                        >
                            <Link className="mr-2 h-4 w-4" />
                            相关性分析
                        </Button>
                        <Button
                            variant={activeTab === 'cluster' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('cluster')}
                        >
                            <PieChart className="mr-2 h-4 w-4" />
                            聚类分析
                        </Button>
                        <Button
                            variant={activeTab === 'factors' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('factors')}
                        >
                            <Zap className="mr-2 h-4 w-4" />
                            因子挖掘
                        </Button>
                        <Button
                            variant={activeTab === 'reports' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('reports')}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            分析报告
                        </Button>
                    </nav>

                    <div className="absolute bottom-4 left-0 right-0 px-4">
                        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4">
                            <h3 className="font-medium mb-2">分析引擎状态</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                实时处理中，性能: 98.7%
                            </p>
                            <Progress value={98.7} className="h-2" />
                        </Card>
                    </div>
                </aside>

                {/* 主内容区 */}
                <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${
                    mobileMenuOpen ? 'md:ml-0 ml-64' : 'md:ml-64 ml-0'
                }`}>
                    {analysisLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12">
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-semibold mb-4">正在进行数据分析</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    我们正在处理您的交易数据，生成深度分析结果
                                </p>
                                <Progress value={progress} className="h-2 w-full max-w-md mx-auto" />
                                <p className="text-sm text-gray-500 mt-2">{progress}% 完成</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                                <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">趋势计算</h4>
                                            <p className="text-sm text-gray-500">正在分析价格走势</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                                            <Link className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">相关性分析</h4>
                                            <p className="text-sm text-gray-500">计算资产间关联度</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                                            <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">聚类处理</h4>
                                            <p className="text-sm text-gray-500">识别相似交易模式</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 数据分析概览 */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold">交易数据分析概览</h1>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                多维度分析ticker级别交易数据，挖掘市场洞察
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <Select value={selectedTicker} onValueChange={setSelectedTicker}>
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue placeholder="选择股票" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">所有股票</SelectItem>
                                                    {mockTickerData.map(ticker => (
                                                        <SelectItem key={ticker.ticker} value={ticker.ticker}>
                                                            {ticker.ticker} - {ticker.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={dateRange} onValueChange={setDateRange}>
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue placeholder="时间范围" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="7d">近7天</SelectItem>
                                                    <SelectItem value="30d">近30天</SelectItem>
                                                    <SelectItem value="90d">近90天</SelectItem>
                                                    <SelectItem value="1y">近1年</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={() => {
                                                setAnalysisLoading(true);
                                                setProgress(0);
                                                const interval = setInterval(() => {
                                                    setProgress(prev => {
                                                        if (prev >= 100) {
                                                            clearInterval(interval);
                                                            setAnalysisLoading(false);
                                                            return 100;
                                                        }
                                                        return prev + 10;
                                                    });
                                                }, 150);
                                            }}>
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                刷新数据
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        导出报告
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => exportReport('pdf')}>
                                                        PDF格式
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => exportReport('excel')}>
                                                        Excel格式
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* 关键指标卡片 */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {mockAnalysisMetrics.map(metric => (
                                            <Card key={metric.id} className="p-5 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.name}</h3>
                                                    {getImportanceBadge(metric.importance)}
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <p className="text-2xl font-bold">
                                                        {metric.value.toLocaleString()}
                                                        {metric.unit}
                                                    </p>
                                                    <div>
                                                        {getChangeIndicator(metric.change)}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* 股票数据表格 */}
                                    <Card>
                                        <div className="p-5 border-b">
                                            <h2 className="text-lg font-semibold">股票交易数据</h2>
                                        </div>
                                        <div className="p-5">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>股票代码</TableHead>
                                                        <TableHead>名称</TableHead>
                                                        <TableHead>行业</TableHead>
                                                        <TableHead>当前价格</TableHead>
                                                        <TableHead>日变化</TableHead>
                                                        <TableHead>交易量</TableHead>
                                                        <TableHead>市值</TableHead>
                                                        <TableHead>波动率</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {mockTickerData.map(ticker => (
                                                        <TableRow key={ticker.ticker}>
                                                            <TableCell className="font-medium">{ticker.ticker}</TableCell>
                                                            <TableCell>{ticker.name}</TableCell>
                                                            <TableCell>{ticker.sector}</TableCell>
                                                            <TableCell>${ticker.price.toFixed(2)}</TableCell>
                                                            <TableCell>{getChangeIndicator(ticker.change)}</TableCell>
                                                            <TableCell>{ticker.volume.toLocaleString()}</TableCell>
                                                            <TableCell>${(ticker.marketCap / 1000000000).toFixed(2)}B</TableCell>
                                                            <TableCell>{ticker.volatility}%</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Card>

                                    {/* 相关性分析表格 */}
                                    <Card>
                                        <div className="p-5 border-b">
                                            <h2 className="text-lg font-semibold">股票相关性分析</h2>
                                        </div>
                                        <div className="p-5">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>股票对</TableHead>
                                                        <TableHead>相关系数</TableHead>
                                                        <TableHead>相关性强度</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {correlationData.map((item, index) => {
                                                        // 确定相关性强度
                                                        let strength = "弱";
                                                        let color = "bg-gray-100 text-gray-800";
                                                        // 使用const替代let，修复ESLint警告
                                                        const significance = random() < 0.05 ? "显著" : "不显著";

                                                        if (Math.abs(item.correlation) > 0.7) {
                                                            strength = "强";
                                                            color = item.correlation > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
                                                        } else if (Math.abs(item.correlation) > 0.3) {
                                                            strength = "中";
                                                            color = item.correlation > 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800";
                                                        }

                                                        return (
                                                            <TableRow key={index}>
                                                                <TableCell>{item.ticker1} - {item.ticker2}</TableCell>
                                                                <TableCell>{item.correlation.toFixed(2)}</TableCell>
                                                                <TableCell>
                                                                    <Badge className={color}>{strength} {item.correlation > 0 ? "正相关" : "负相关"}</Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Card>

                                    {/* 聚类分析结果 */}
                                    <Card>
                                        <div className="p-5 border-b">
                                            <h2 className="text-lg font-semibold">股票聚类分析</h2>
                                        </div>
                                        <div className="p-5">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {clusterData.map(cluster => (
                                                    <Card key={cluster.cluster} className="p-4">
                                                        <h3 className="font-medium mb-3">聚类 {cluster.cluster}</h3>
                                                        <div className="space-y-2 mb-4">
                                                            {cluster.tickers.map(ticker => (
                                                                <div key={ticker} className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                    <span>{ticker}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                            <p>平均波动率: {cluster.characteristics['平均波动率']}%</p>
                                                            <p>平均收益率: {cluster.characteristics['平均收益率']}%</p>
                                                            <p>市值规模: {cluster.characteristics['市值规模']}B</p>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* 基础统计分析 */}
                            {activeTab === 'statistics' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold">基础统计分析</h1>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                股票交易数据的核心统计指标与分布特征
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button onClick={() => exportReport('excel')}>
                                                <Download className="mr-2 h-4 w-4" />
                                                导出数据
                                            </Button>
                                        </div>
                                    </div>

                                    <Card>
                                        <div className="p-5">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>股票代码</TableHead>
                                                        <TableHead>名称</TableHead>
                                                        <TableHead>当前价格</TableHead>
                                                        <TableHead>日变化</TableHead>
                                                        <TableHead>平均价格</TableHead>
                                                        <TableHead>价格方差</TableHead>
                                                        <TableHead>最大价格</TableHead>
                                                        <TableHead>最小价格</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {mockTickerData.map(ticker => {
                                                        // 使用固定种子随机数生成器
                                                        const rowRandom = createRandomGenerator(seed + 10 + mockTickerData.indexOf(ticker));
                                                        return (
                                                            <TableRow key={ticker.ticker}>
                                                                <TableCell className="font-medium">{ticker.ticker}</TableCell>
                                                                <TableCell>{ticker.name}</TableCell>
                                                                <TableCell>${ticker.price.toFixed(2)}</TableCell>
                                                                <TableCell>{getChangeIndicator(ticker.change)}</TableCell>
                                                                <TableCell>${(ticker.price * (0.9 + rowRandom() * 0.2)).toFixed(2)}</TableCell>
                                                                <TableCell>{(ticker.price * 0.05 * rowRandom()).toFixed(2)}</TableCell>
                                                                <TableCell>${(ticker.price * 1.1).toFixed(2)}</TableCell>
                                                                <TableCell>${(ticker.price * 0.9).toFixed(2)}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* 其他分析模块内容结构保持不变 */}
                            {activeTab === 'trend' && (
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold">趋势预测分析</h1>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            基于历史数据预测未来价格走势和市场趋势
                                        </p>
                                    </div>
                                    <Card className="p-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">价格趋势预测</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="font-medium mb-2">预测模型参数</h4>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <Label>预测周期</Label>
                                                            <Select defaultValue="30d">
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="选择周期" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="7d">7天</SelectItem>
                                                                    <SelectItem value="30d">30天</SelectItem>
                                                                    <SelectItem value="90d">90天</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label>预测模型</Label>
                                                            <Select defaultValue="arima">
                                                                <SelectTrigger className="mt-1">
                                                                    <SelectValue placeholder="选择模型" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="arima">ARIMA</SelectItem>
                                                                    <SelectItem value="lstm">LSTM神经网络</SelectItem>
                                                                    <SelectItem value="prophet">Prophet</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <Button className="w-full">生成预测</Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium mb-2">预测结果摘要</h4>
                                                    <Card className="p-4 h-full">
                                                        <p className="text-gray-500 mb-4">选择股票和模型后生成预测结果</p>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between">
                                                                <span>预测准确度</span>
                                                                <Badge>--</Badge>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>趋势方向</span>
                                                                <Badge>--</Badge>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>预期波动范围</span>
                                                                <span>--</span>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'correlation' && (
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold">相关性分析</h1>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            分析不同股票之间的价格联动关系和相关性强度
                                        </p>
                                    </div>
                                    <Card>
                                        <div className="p-5">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>股票对</TableHead>
                                                        <TableHead>相关系数</TableHead>
                                                        <TableHead>相关性强度</TableHead>
                                                        <TableHead>统计显著性</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {correlationData.map((item, index) => {
                                                        // 确定相关性强度
                                                        let strength = "弱";
                                                        let color = "bg-gray-100 text-gray-800";
                                                        // 使用const替代let，修复ESLint警告
                                                        const significance = random() < 0.05 ? "显著" : "不显著";

                                                        if (Math.abs(item.correlation) > 0.7) {
                                                            strength = "强";
                                                            color = item.correlation > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
                                                        } else if (Math.abs(item.correlation) > 0.3) {
                                                            strength = "中";
                                                            color = item.correlation > 0 ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800";
                                                        }

                                                        return (
                                                            <TableRow key={index}>
                                                                <TableCell>{item.ticker1} - {item.ticker2}</TableCell>
                                                                <TableCell>{item.correlation.toFixed(2)}</TableCell>
                                                                <TableCell>
                                                                    <Badge className={color}>{strength} {item.correlation > 0 ? "正相关" : "负相关"}</Badge>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge className={significance === "显著" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                                                                        {significance}
                                                                    </Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* 聚类分析、因子挖掘和报告模块保持不变 */}
                            {activeTab === 'cluster' && (
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold">聚类分析</h1>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            基于交易特征对股票进行自动分组，识别相似模式
                                        </p>
                                    </div>
                                    <Card>
                                        <div className="p-5">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {clusterData.map(cluster => (
                                                    <Card key={cluster.cluster} className="p-5 border-l-4 border-blue-500">
                                                        <h3 className="text-lg font-medium mb-3">聚类 {cluster.cluster}</h3>
                                                        <div className="space-y-3 mb-4">
                                                            <div>
                                                                <h4 className="text-sm text-gray-500 mb-1">包含股票</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {cluster.tickers.map(ticker => (
                                                                        <Badge key={ticker} variant="secondary">{ticker}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="pt-3 border-t">
                                                            <h4 className="text-sm text-gray-500 mb-2">聚类特征</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span>平均波动率</span>
                                                                    <span className={cluster.characteristics['平均波动率'] > 3 ? 'text-red-500' : 'text-green-500'}>
                                                                        {cluster.characteristics['平均波动率']}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>平均收益率</span>
                                                                    <span className={cluster.characteristics['平均收益率'] > 0 ? 'text-green-500' : 'text-red-500'}>
                                                                        {cluster.characteristics['平均收益率']}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>市值规模</span>
                                                                    <span>{cluster.characteristics['市值规模']}B</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'factors' && (
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold">因子挖掘</h1>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            识别影响股票价格变动的关键因子和驱动因素
                                        </p>
                                    </div>
                                    <Card className="p-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium">因子分析设置</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <h4 className="font-medium mb-3">选择分析因子</h4>
                                                    <div className="space-y-2">
                                                        {['成交量', '波动率', '市盈率', '市值', '换手率', '行业指数', '市场情绪'].map(factor => (
                                                            <div key={factor} className="flex items-center space-x-2">
                                                                <Checkbox id={`factor-${factor}`} defaultChecked />
                                                                <Label htmlFor={`factor-${factor}`}>{factor}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Button className="mt-4">运行因子分析</Button>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium mb-3">因子重要性排序</h4>
                                                    <Card className="p-4 h-full">
                                                        <p className="text-gray-500 mb-4">运行分析后显示因子重要性结果</p>
                                                        <div className="space-y-3">
                                                            {[1, 2, 3, 4, 5].map(i => (
                                                                <div key={i}>
                                                                    <div className="flex justify-between text-sm mb-1">
                                                                        <span>因子 {i}</span>
                                                                        <span>--%</span>
                                                                    </div>
                                                                    <Progress value={0} className="h-2" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Card>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'reports' && (
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold">分析报告</h1>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            生成和管理数据分析报告，支持多种导出格式
                                        </p>
                                    </div>
                                    <Card className="p-6">
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                                            <h3 className="text-lg font-medium mb-2">生成定制化分析报告</h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                                                基于您的分析需求，生成包含关键洞察和可视化图表的专业报告
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                                                <div className="flex-1">
                                                    <Select defaultValue="detailed">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="报告类型" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="summary">摘要报告</SelectItem>
                                                            <SelectItem value="detailed">详细分析报告</SelectItem>
                                                            <SelectItem value="factors">因子分析报告</SelectItem>
                                                            <SelectItem value="prediction">预测报告</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex-1">
                                                    <Select defaultValue="pdf">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="导出格式" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pdf">PDF格式</SelectItem>
                                                            <SelectItem value="excel">Excel格式</SelectItem>
                                                            <SelectItem value="ppt">PowerPoint格式</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-4">
                                                <Button onClick={() => exportReport('pdf')}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    生成报告
                                                </Button>
                                                <Button variant="secondary">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    报告历史
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* 页脚 */}
            <footer className="border-t bg-white dark:bg-gray-900 py-4">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        © 2023 DataThinker. 交易数据分析平台
                    </p>
                    <div className="flex gap-4">
                        <Button variant="ghost" size="sm">关于</Button>
                        <Button variant="ghost" size="sm">帮助中心</Button>
                        <Button variant="ghost" size="sm">隐私政策</Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}