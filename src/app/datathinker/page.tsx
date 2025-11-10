"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    Link,
    Wifi,
    WifiOff
} from 'lucide-react';

import FuturesTrendForecast from '@/components/FuturesTrendForecast';

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
import StockIndex from "@/components/StockIndex";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import FactorMiningComponent from "@/components/FactorMiningComponent";
// 固定种子的随机数生成器（保留）
const createRandomGenerator = (seed: number) => {
    return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
};
const seed = 12345;
const random = createRandomGenerator(seed);

// -------------------------- 数据类型定义（不变） --------------------------
interface WebSocketFuturesData {
    instrument_id: string;
    product_name?: string;
    exchange?: string;
    expiry_date?: string;
    last_price: number;
    price_change_rate: number;
    price_increase: number;
    volume: number;
    open_interest: number;
    contract_multiplier?: number;
    pre_settlement_price: number;
    bid_price: number;
    ask_price: number;
    bid_volume: number;
    ask_volume: number;
    upper_limit_price: number;
    lower_limit_price: number;
    timestamp: string;
}

interface FuturesContractData {
    instrumentId: string;
    // productName: string;
    // exchange: string;
    // expiryDate: string;
    lastPrice: number;
    changeRate: number;
    volume: number;
    openInterest: number;
    // contractMultiplier: number;
    // preSettlementPrice: number;
    bidPrice: number;
    askPrice: number;
    bidVolume: number;
    askVolume: number;
    upperLimitPrice: number;
    lowerLimitPrice: number;
    timestamp: string;
}

interface FuturesAnalysisMetric {
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
interface FuturesCorrelationData {
    contract1: string;
    contract2: string;
    correlation: number;
}
interface FuturesClusterData {
    cluster: number;
    contracts: string[];
    characteristics: Record<string, number>;
}

// -------------------------- 更新：现货数据类型（匹配实际返回格式） --------------------------
interface SpotDataItem {
    date: string;
    symbol: string;
    spot_price: number;
    near_contract: string;
    near_contract_price: number;
    dominant_contract: string;
    dominant_contract_price: number;
    near_month: number;
    dominant_month: number;
    near_basis: number;
    dom_basis: number;
    near_basis_rate: number;
    dom_basis_rate: number;
}

interface SpotDataResponse {
    symbol: string;
    start_date: string;
    end_date: string;
    data: SpotDataItem[];
    message: string;
    error?: string;
}


// 期货分析指标虚拟数据（不变）
const mockFuturesMetrics: FuturesAnalysisMetric[] = [
    { id: 'm1', name: '持仓量变化率', value: 5.67, change: 1.23, unit: '%', importance: 'high' },
    { id: 'm2', name: '成交量持仓比', value: 0.38, change: -0.05, unit: '', importance: 'high' },
    { id: 'm3', name: '基差（现货-期货）', value: -28.6, change: -5.2, unit: '点', importance: 'medium' },
    { id: 'm4', name: '年化波动率', value: 18.7, change: 2.1, unit: '%', importance: 'high' },
    { id: 'm5', name: '主力合约切换信号', value: 0.23, change: 0.11, unit: '', importance: 'medium' },
    { id: 'm6', name: '持仓集中度', value: 35.8, change: -3.2, unit: '%', importance: 'low' }
];

// -------------------------- 辅助数据生成函数（不变） --------------------------
const generateFuturesTimeSeriesData = (contracts: string[], days: number = 30): TimeSeriesData[] => {
    const data: TimeSeriesData[] = [];
    const startDate = new Date();
    const tsRandom = createRandomGenerator(seed + 1);

    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(startDate.getDate() - i);
        const timestamp = date.toISOString().split('T')[0];

        const entry: TimeSeriesData = { timestamp };
        contracts.forEach(contract => {
            const isFinancial = contract.startsWith('IF') || contract.startsWith('IH') || contract.startsWith('IC');
            const basePrice = isFinancial ? 2000 + tsRandom() * 4000 : 1000 + tsRandom() * 100000;
            const trendFactor = (days - i) * 0.015;
            const randomFactor = (tsRandom() - 0.5) * (isFinancial ? 100 : 5000);
            entry[contract] = parseFloat((basePrice + trendFactor * basePrice + randomFactor).toFixed(isFinancial ? 1 : 0));
        });

        data.push(entry);
    }
    return data;
};

const generateFuturesCorrelationData = (contracts: string[]): FuturesCorrelationData[] => {
    const data: FuturesCorrelationData[] = [];
    const corrRandom = createRandomGenerator(seed + 2);

    for (let i = 0; i < contracts.length; i++) {
        for (let j = i + 1; j < contracts.length; j++) {
            const contract1 = contracts[i];
            const contract2 = contracts[j];
            let correlation = parseFloat((corrRandom() * 2 - 1).toFixed(2));
            const isSameType1 = contract1.startsWith('IF') || contract1.startsWith('IH') || contract1.startsWith('IC');
            const isSameType2 = contract2.startsWith('IF') || contract2.startsWith('IH') || contract2.startsWith('IC');
            if (isSameType1 && isSameType2) {
                correlation = parseFloat((Math.abs(correlation) * 0.6 + 0.3).toFixed(2));
            }

            data.push({ contract1, contract2, correlation });
        }
    }
    return data;
};

const generateFuturesClusterData = (contracts: string[]): FuturesClusterData[] => {
    const clusters: FuturesClusterData[] = [];
    const clusterRandom = createRandomGenerator(seed + 3);

    const financialContracts = contracts.filter(c => c.startsWith('IF') || c.startsWith('IH') || c.startsWith('IC'));
    const energyContracts = contracts.filter(c => c.startsWith('SC'));
    const metalContracts = contracts.filter(c => c.startsWith('CU'));
    const chemicalContracts = contracts.filter(c => c.startsWith('MA'));

    const clusterList = [
        { name: '金融期货', contracts: financialContracts },
        { name: '能源及化工期货', contracts: [...energyContracts, ...chemicalContracts] },
        { name: '金属期货', contracts: metalContracts }
    ].filter(cluster => cluster.contracts.length > 0);

    clusterList.forEach((cluster, index) => {
        clusters.push({
            cluster: index + 1,
            contracts: cluster.contracts,
            characteristics: {
                '平均持仓量（万手）': parseFloat((clusterRandom() * 20 + 10).toFixed(1)),
                '平均波动率（%）': parseFloat((clusterRandom() * 10 + 8).toFixed(1)),
                '平均成交量（万手）': parseFloat((clusterRandom() * 30 + 15).toFixed(1))
            }
        });
    });

    return clusters;
};

/**
 * 进阶JSON数据清洗：覆盖语法错误、数据错误、结构错误全场景
 * @param rawData 后端原始WebSocket数据
 * @returns 清洗后可尝试解析的JSON字符串
 */
const advancedCleanJsonData = (rawData: string): string => {
    if (!rawData || typeof rawData !== 'string') return '{}';
    let cleaned = rawData.trim();
    // --------------------------
    // 1. 先尝试直接解析，若合法则不做修改（核心优化）
    // --------------------------
    try {
        JSON.parse(cleaned);
        return cleaned; // 原始数据合法，直接返回
    } catch (e) {
        // 原始数据无效，才进行修复
        console.warn("【前端】原始数据不合法，进行修复", e);
    }
    // --------------------------
    // 2. 仅修复明确的错误（最小化干预）
    // --------------------------
    // 2.1 修复首尾结构（仅补全缺失的括号）
    if (!cleaned.startsWith('{')) {
        const firstBrace = cleaned.indexOf('{');
        cleaned = firstBrace !== -1 ? cleaned.slice(firstBrace) : '{}';
    }
    if (!cleaned.endsWith('}')) {
        cleaned += '}';
    }
    // 2.2 修复属性名缺失引号（仅处理明显的无引号属性名）
    cleaned = cleaned.replace(/([^":\s]+\s*):/g, '"$1":'); // 如 key: → "key":
    // 2.3 修复字符串未闭合（仅补全缺失的结尾引号）
    const quoteCount = (cleaned.match(/"/g) || []).length;
    if (quoteCount % 2 !== 0) {
        cleaned += '"';
    }
    // 2.4 修复属性间缺少逗号（仅在明确的属性值后补逗号）
    cleaned = cleaned.replace(/([}\]])(\s*"[^"]+":)/g, '$1,$2'); // 如 }"key": → },"key":
    cleaned = cleaned.replace(/(\d)(\s*"[^"]+":)/g, '$1,$2'); // 如 123"key": → 123,"key":
    // 2.5 移除多余的逗号（仅末尾逗号）
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    // 2.6 修复数值中的错误（仅恢复明显的小数点丢失）
    cleaned = cleaned.replace(/(\d+)([eE][+-]?\d+)/g, '$1.$2'); // 如 1797e308 → 1.797e308（针对科学计数法）
    cleaned = cleaned.replace(/(\d)([^\d.]{1,2}\d)/g, '$1.$2'); // 如 72400 → 7240.0（针对明显的小数）
    // --------------------------
    // 3. 最终校验
    // --------------------------
    try {
        JSON.parse(cleaned);
        return cleaned;
    } catch (finalErr) {
        console.error("【前端】修复后仍无效", finalErr, "修复后数据:", cleaned);
        return '{}';
    }
};


export default function FuturesAnalysisPage() {
    const { status } = useSession();
    const router = useRouter();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedContract, setSelectedContract] = useState('all');
    const [dateRange, setDateRange] = useState('30d');
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const [reconnectTimer, setReconnectTimer] = useState(null);
    const [futuresData, setFuturesData] = useState<FuturesContractData[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [lastUpdateTime, setLastUpdateTime] = useState('');
    const socketRef = useRef<WebSocket | null>(null); // 替换 useState 存储 socket
    // -------------------------- 现货数据状态 --------------------------
    const [spotPrice, setSpotPrice] = useState<number | null>(null); // 现货价格
    const [spotLoading, setSpotLoading] = useState(false); // 现货加载状态
    const [prevBasis, setPrevBasis] = useState<number>(-28.5); // 上一次基差（用于计算change）
    const [spotError, setSpotError] = useState<string | null>(null); // 现货数据错误信息

    // 初始化客户端标识（不变）
    useEffect(() => {
        setIsClient(true);
    }, []);

    // -------------------------- 修复2：WebSocket 连接逻辑（移除 socket 依赖，用 ref 操作实例） --------------------------
    const initWebSocket = useCallback(() => {
        // 关闭现有连接（从 ref 获取实例）
        if (socketRef.current) {
            socketRef.current.close(1000, '重新连接');
        }

        setConnectionStatus('connecting');
        const newSocket = new WebSocket("ws://127.0.0.1:8001/depth_md/all");

        // 连接成功
        newSocket.onopen = () => {
            console.log("【前端】WebSocket 连接成功！");
            setConnectionStatus('connected');
            socketRef.current = newSocket; // 存到 ref 中
            if (reconnectTimer) clearTimeout(reconnectTimer);
        };

        // 接收消息（核心：更新期货数据）
        newSocket.onmessage = (event) => {
            //console.log("【前端】收到原始数据：", event.data);
            try {
                const cleanedData = advancedCleanJsonData(event.data);
                //console.log("clean之后的数据：", cleanedData);
                const wsData: WebSocketFuturesData = JSON.parse(cleanedData);
                //const staticInfo = contractStaticInfo[wsData.instrument_id] || {};
                if (wsData && wsData.instrument_id) {
                    const formattedData: FuturesContractData = {
                        instrumentId: wsData.instrument_id,
                        // productName: staticInfo.productName || wsData.product_name || '未知品种',
                        // exchange: staticInfo.exchange || wsData.exchange || '未知交易所',
                        // expiryDate: staticInfo.expiryDate || wsData.expiry_date || '未知到期日',
                        lastPrice: wsData.last_price,
                        changeRate: wsData.price_change_rate,
                        volume: wsData.volume,
                        openInterest: wsData.open_interest,
                        // contractMultiplier: staticInfo.contractMultiplier || wsData.contract_multiplier || 1,
                        // preSettlementPrice: staticInfo.preSettlementPrice || wsData.pre_settlement_price,
                        bidPrice: wsData.bid_price,
                        askPrice: wsData.ask_price,
                        bidVolume: wsData.bid_volume,
                        askVolume: wsData.ask_volume,
                        upperLimitPrice: wsData.upper_limit_price,
                        lowerLimitPrice: wsData.lower_limit_price,
                        timestamp: wsData.timestamp
                    };

                    // 更新数据列表（函数式更新，确保拿到最新状态）
                    setFuturesData(prev => {
                        const existsIndex = prev.findIndex(item => item.instrumentId === wsData.instrument_id);
                        if (existsIndex > -1) {
                            const newList = [...prev];
                            newList[existsIndex] = formattedData;
                            return newList;
                        } else {
                            return [...prev, formattedData];
                        }
                    });
                    setLastUpdateTime(new Date().toLocaleTimeString());
                }


            } catch (e) {
                console.error("【前端】JSON解析失败！错误：", e);
            }
        };

        // 连接关闭（自动重连）
        newSocket.onclose = (event) => {
            console.log("【前端】WebSocket 连接关闭，原因：", event);
            setConnectionStatus('disconnected');
            socketRef.current = null; // 清空 ref
            //setTimeout(initWebSocket, 3000);
            console.log('WebSocket已断开，需手动重连');
        };

        // 错误处理
        newSocket.onerror = (error) => {
            console.error("【前端】WebSocket 错误：", error);
            setConnectionStatus('disconnected');
            socketRef.current = null;
        };

        // 初始赋值（避免连接成功前的空值）
        socketRef.current = newSocket;
        return newSocket;
    }, []); // 移除 socket 依赖，解决循环问题

    // 初始化 WebSocket 连接（不变）
    useEffect(() => {
        if (!isClient) return;
        const ws = initWebSocket();
        return () => ws.close();
    }, [isClient, initWebSocket]);

    // -------------------------- 动态计算基差并更新m3 --------------------------
    // -------------------------- 核心修改3：基差计算匹配选中的合约 --------------------------
    const dynamicMetrics = useMemo(() => {
        const metrics: FuturesAnalysisMetric[] = [
            { id: 'm1', name: '持仓量变化率', value: 5.67, change: 1.23, unit: '%', importance: 'high' },
            { id: 'm2', name: '成交量持仓比', value: 0.38, change: -0.05, unit: '', importance: 'high' },
            { id: 'm3', name: '基差（现货-期货）', value: -28.5, change: -5.2, unit: '点', importance: 'medium' },
            { id: 'm4', name: '年化波动率', value: 18.7, change: 2.1, unit: '%', importance: 'high' },
            { id: 'm5', name: '主力合约切换信号', value: 0.23, change: 0.11, unit: '', importance: 'medium' },
            { id: 'm6', name: '持仓集中度', value: 35.8, change: -3.2, unit: '%', importance: 'low' }
        ];

        // 计算基差：匹配下拉框选中的合约价格
        if (spotPrice !== null && futuresData.length > 0) {
            // 找到选中的合约数据
            const targetContract = selectedContract !== 'all'
                ? futuresData.find(item => item.instrumentId === selectedContract)
                : futuresData[0]; // 所有合约时取第一个

            // 兜底：避免合约数据不存在的情况
            const futuresPrice = targetContract?.lastPrice ?? 0;
            const currentBasis = parseFloat((spotPrice - futuresPrice).toFixed(2));
            const basisChange = parseFloat((currentBasis - prevBasis).toFixed(2));

            // 更新m3指标
            metrics[2] = {
                ...metrics[2],
                value: currentBasis,
                change: basisChange
            };
            setPrevBasis(currentBasis);
        }

        return metrics;
    }, [spotPrice, futuresData, prevBasis, selectedContract]); // 新增 selectedContract 依赖

    // -------------------------- 修复3：精简分析加载的 useEffect 依赖（移除 futuresData） --------------------------
    useEffect(() => {
        if (!isClient || connectionStatus !== 'connected' || analysisLoading) return; // 加 analysisLoading 判断，避免重复触发

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
    }, [selectedContract, dateRange, isClient, connectionStatus]); // 移除 futuresData 依赖

    // -------------------------- 修复4：记忆化 exportReport 函数（避免重复创建） --------------------------
    const exportReport = useCallback((format: 'pdf' | 'excel') => {
        if (analysisLoading) return; // 防止重复导出
        setAnalysisLoading(true);
        setProgress(0);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setAnalysisLoading(false);
                    alert(`期货分析报告已成功导出为${format.toUpperCase()}格式`);
                    return 100;
                }
                return prev + 10;
            });
        }, 200);
    }, [analysisLoading]); // 依赖 analysisLoading，避免并发导出

    // 工具函数（不变）
    const getChangeIndicator = (value: number) => {
        if (value > 0) {
            return (
                <span className="flex items-center text-green-500">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    {value.toFixed(2)}%（涨）
                </span>
            );
        } else if (value < 0) {
            return (
                <span className="flex items-center text-red-500">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    {Math.abs(value).toFixed(2)}%（跌）
                </span>
            );
        } else {
            return <span>{value.toFixed(2)}%（平）</span>;
        }
    };

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

    // 连接状态显示组件（不变）
    const getConnectionBadge = () => {
        switch (connectionStatus) {
            case 'connected':
                return <Badge className="bg-green-500 flex items-center gap-1"><Wifi className="h-3 w-3" /> 已连接</Badge>;
            case 'connecting':
                return <Badge className="bg-amber-500 flex items-center gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> 连接中</Badge>;
            case 'disconnected':
                return <Badge className="bg-red-500 flex items-center gap-1"><WifiOff className="h-3 w-3" /> 断开（重连中）</Badge>;
        }
    };

    // -------------------------- 修复5：记忆化辅助数据（避免每次渲染生成新引用） --------------------------
    const contractIds = useMemo(() => futuresData.map(item => item.instrumentId), [futuresData]);
    const futuresTimeSeriesData = useMemo(() => generateFuturesTimeSeriesData(contractIds), [contractIds]);
    const futuresCorrelationData = useMemo(() => generateFuturesCorrelationData(contractIds), [contractIds]);
    const futuresClusterData = useMemo(() => generateFuturesClusterData(contractIds), [contractIds]);

    if (!isClient) {
        return <div className="min-h-screen"></div>;
    }
    if (status === 'unauthenticated') {
        router.push('/login');
        return null;
    }
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* 顶部导航栏（不变） */}
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
                            <h1 className="text-xl font-bold">FuturesDataThinker（期货数据分析）</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            {getConnectionBadge()}
                            {connectionStatus === 'connected' && (
                                <span className="text-sm text-gray-500">最后更新：{lastUpdateTime}</span>
                            )}
                        </div>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Bell className="h-5 w-5" />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>期货行情通知</p>
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
                            <DropdownMenuContent align="end" className="bg-white">
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>个人资料</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>期货分析设置</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 侧边栏（不变） */}
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
                            期货分析概览
                        </Button>
                        <Button
                            variant={activeTab === 'statistics' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('statistics')}
                        >
                            <BarChart className="mr-2 h-4 w-4" />
                            期货基础统计
                        </Button>
                        <Button
                            variant={activeTab === 'trend' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('trend')}
                        >
                            <TrendingUp className="mr-2 h-4 w-4" />
                            期货趋势预测
                        </Button>
                        <Button
                            variant={activeTab === 'correlation' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('correlation')}
                        >
                            <Link className="mr-2 h-4 w-4" />
                            合约相关性分析
                        </Button>
                        <Button
                            variant={activeTab === 'cluster' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('cluster')}
                        >
                            <PieChart className="mr-2 h-4 w-4" />
                            期货品种聚类
                        </Button>
                        <Button
                            variant={activeTab === 'factors' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('factors')}
                        >
                            <Zap className="mr-2 h-4 w-4" />
                            期货因子挖掘
                        </Button>
                        <Button
                            variant={activeTab === 'reports' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('reports')}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            期货分析报告
                        </Button>
                        <Button
                            variant={activeTab === 'stock_index' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveTab('stock_index')}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            股指基差表
                        </Button>
                    </nav>

                    <div className="absolute bottom-4 left-0 right-0 px-4">
                        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4">
                            <h3 className="font-medium mb-2">期货分析引擎状态</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {connectionStatus === 'connected'
                                    ? `实时连接中（${futuresData.length}个合约）`
                                    : '等待连接...'}
                            </p>
                            <Progress value={connectionStatus === 'connected' ? 100 : 0} className="h-2" />
                        </Card>
                    </div>
                </aside>

                {/* 主内容区（不变，数据源已修复） */}
                <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${
                    mobileMenuOpen ? 'md:ml-0 ml-16' : 'md:ml-16 ml-0'
                }`}>
                    {analysisLoading ? (
                        <div className="flex flex-col items-center justify-center h-full py-12">
                            <div className="text-center mb-8">
                                <h2 className="text-xl font-semibold mb-4">正在进行期货数据分析</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    正在处理期货合约数据，生成深度分析结果（包含持仓量/成交量等维度）
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
                                            <h4 className="font-medium">期货趋势计算</h4>
                                            <p className="text-sm text-gray-500">分析合约价格走势</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                                            <Link className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">合约相关性分析</h4>
                                            <p className="text-sm text-gray-500">计算期货间关联度</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                                            <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">品种聚类处理</h4>
                                            <p className="text-sm text-gray-500">识别相似期货模式</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 期货分析概览（不变） */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold">期货交易数据分析概览</h1>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                多维度分析期货合约级别数据（价格/持仓量/成交量），挖掘市场洞察
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            <Select value={selectedContract} onValueChange={setSelectedContract}>
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue placeholder="选择期货合约" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="all">所有合约</SelectItem>
                                                    {futuresData.map(contract => (
                                                        <SelectItem key={contract.instrumentId} value={contract.instrumentId}>
                                                            {contract.instrumentId}
                                                            {/*{contract.instrumentId} - {contract.productName}*/}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Select value={dateRange} onValueChange={setDateRange}>
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue placeholder="时间范围" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white">
                                                    <SelectItem value="7d">近7天</SelectItem>
                                                    <SelectItem value="30d">近30天</SelectItem>
                                                    <SelectItem value="90d">近90天</SelectItem>
                                                    <SelectItem value="1y">近1年</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button onClick={() => {
                                                if (analysisLoading) return;
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
                                                刷新分析
                                            </Button>
                                            {/* 现货数据刷新按钮 */}
                                            {/*<Button variant="secondary" onClick={} disabled={spotLoading}>*/}
                                            {/*    <RefreshCw className={`mr-2 h-4 w-4 ${spotLoading ? 'animate-spin' : ''}`} />*/}
                                            {/*    {spotLoading ? '刷新现货中' : '刷新现货'}*/}
                                            {/*</Button>*/}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        导出报告
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="bg-white">
                                                    <DropdownMenuItem onClick={() => exportReport('pdf')}>
                                                        PDF格式（期货分析）
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => exportReport('excel')}>
                                                        Excel格式（含原始合约数据）
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* 显示现货数据错误信息 */}
                                    {spotError && (
                                        <Card className="bg-red-50 dark:bg-red-900/20 p-4 border-l-4 border-red-500">
                                            <div className="flex items-start gap-3">
                                                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    现货数据获取失败: {spotError}
                                                </p>
                                            </div>
                                        </Card>
                                    )}

                                    {/* 期货关键指标卡片（不变） */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {mockFuturesMetrics.map(metric => (
                                            <Card key={metric.id} className="p-5 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.name}</h3>
                                                    {getImportanceBadge(metric.importance)}
                                                </div>
                                                <div className="flex items-end justify-between">
                                                    <p className="text-2xl font-bold">
                                                        {/* 基差加载时显示"加载中" */}
                                                        {metric.id === 'm3' && spotLoading
                                                            ? <span className="text-gray-400">加载中...</span>
                                                            : metric.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                        {metric.unit}
                                                    </p>
                                                    <div>
                                                        {getChangeIndicator(metric.change)}
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* 期货合约数据表格（不变） */}
                                    <Card>
                                        <div className="p-5 border-b">
                                            <h2 className="text-lg font-semibold">期货合约交易数据</h2>
                                            {/* 连接状态与重连按钮 */}
                                            <div className="flex items-center gap-2">
                                                  <span className={`text-sm ${
                                                      connectionStatus === 'connected' ? 'text-green-500' :
                                                          connectionStatus === 'connecting' ? 'text-yellow-500' : 'text-red-500'
                                                  }`}>
                                                    {connectionStatus === 'connected' ? '已连接' :
                                                        connectionStatus === 'connecting' ? '连接中...' : '已断开'}
                                                  </span>
                                                {/* 仅在断开状态显示重连按钮 */}
                                                {connectionStatus === 'disconnected' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={initWebSocket}
                                                    >
                                                        手动重连
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            {futuresData.length === 0 ? (
                                                <div className="text-center py-10 text-gray-500">
                                                    {connectionStatus === 'connected'
                                                        ? '等待接收期货数据...'
                                                        : 'WebSocket连接断开，无法获取数据'}
                                                </div>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>合约代码</TableHead>
                                                            {/*<TableHead>品种名称</TableHead>*/}
                                                            {/*<TableHead>交易所</TableHead>*/}
                                                            {/*<TableHead>到期日期</TableHead>*/}
                                                            <TableHead>最新价</TableHead>
                                                            <TableHead>涨跌幅</TableHead>
                                                            <TableHead>买一价</TableHead>
                                                            <TableHead>卖一价</TableHead>
                                                            <TableHead>成交量（手）</TableHead>
                                                            <TableHead>持仓量（手）</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {futuresData.map(contract => (
                                                            <TableRow key={contract.instrumentId}>
                                                                <TableCell className="font-medium">{contract.instrumentId}</TableCell>
                                                                {/*<TableCell>{contract.productName}</TableCell>*/}
                                                                {/*<TableCell>{contract.exchange}</TableCell>*/}
                                                                {/*<TableCell>{contract.expiryDate}</TableCell>*/}
                                                                <TableCell>{contract.lastPrice.toFixed(2)}</TableCell>
                                                                <TableCell>{getChangeIndicator(contract.changeRate)}</TableCell>
                                                                <TableCell>{contract.bidPrice.toFixed(2)}</TableCell>
                                                                <TableCell>{contract.askPrice.toFixed(2)}</TableCell>
                                                                <TableCell>{contract.volume.toLocaleString()}</TableCell>
                                                                <TableCell>{contract.openInterest.toLocaleString()}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </div>
                                    </Card>

                                    {/* 其他分析表格（不变） */}
                                    <Card>
                                        <div className="p-5 border-b">
                                            <h2 className="text-lg font-semibold">期货合约相关性分析</h2>
                                        </div>
                                        <div className="p-5">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>合约对</TableHead>
                                                        <TableHead>相关系数</TableHead>
                                                        <TableHead>相关性强度</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {futuresCorrelationData.map((item, index) => {
                                                        let strength = "弱";
                                                        let color = "bg-gray-100 text-gray-800";
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
                                                                <TableCell>{item.contract1} - {item.contract2}</TableCell>
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

                                    <Card>
                                        <div className="p-5 border-b">
                                            <h2 className="text-lg font-semibold">期货品种聚类分析</h2>
                                        </div>
                                        <div className="p-5">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {futuresClusterData.map(cluster => (
                                                    <Card key={cluster.cluster} className="p-4">
                                                        <h3 className="font-medium mb-3">聚类 {cluster.cluster}（{
                                                            cluster.cluster === 1 ? '金融期货' :
                                                                cluster.cluster === 2 ? '能源及化工期货' : '金属期货'
                                                        }）</h3>
                                                        <div className="space-y-2 mb-4">
                                                            {cluster.contracts.map(contract => (
                                                                <div key={contract} className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                    <span>{contract}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                            <p>平均持仓量：{cluster.characteristics['平均持仓量（万手）']} 万手</p>
                                                            <p>平均波动率：{cluster.characteristics['平均波动率（%）']}%</p>
                                                            <p>平均成交量：{cluster.characteristics['平均成交量（万手）']} 万手</p>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {/* 其他标签页（均不变，数据源已修复） */}
                            {activeTab === 'statistics' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div>
                                            <h1 className="text-2xl font-bold">期货基础统计分析</h1>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                期货合约核心统计指标（价格/持仓量/成交量分布特征）
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Button onClick={() => exportReport('excel')}>
                                                <Download className="mr-2 h-4 w-4" />
                                                导出期货统计数据
                                            </Button>
                                        </div>
                                    </div>

                                    <Card>
                                        <div className="p-5">
                                            {futuresData.length === 0 ? (
                                                <div className="text-center py-10 text-gray-500">无期货数据可显示</div>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>合约代码</TableHead>
                                                            <TableHead>最新价</TableHead>
                                                            <TableHead>涨跌幅</TableHead>
                                                            <TableHead>买一价</TableHead>
                                                            <TableHead>买一量</TableHead>
                                                            <TableHead>卖一价</TableHead>
                                                            <TableHead>卖一量</TableHead>
                                                            <TableHead>涨停价</TableHead>
                                                            <TableHead>跌停价</TableHead>
                                                            <TableHead>成交量（手）</TableHead>
                                                            <TableHead>持仓量（手）</TableHead>
                                                            <TableHead>更新时间</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {futuresData.map(contract => (
                                                            <TableRow key={contract.instrumentId}>
                                                                <TableCell className="font-medium">{contract.instrumentId}</TableCell>
                                                                <TableCell>{contract.lastPrice.toFixed(2)}</TableCell>
                                                                <TableCell>{getChangeIndicator(contract.changeRate)}</TableCell>
                                                                <TableCell>{contract.bidPrice.toFixed(2)}</TableCell>
                                                                <TableCell>{contract.bidVolume.toLocaleString()}</TableCell>
                                                                <TableCell>{contract.askPrice.toFixed(2)}</TableCell>
                                                                <TableCell>{contract.askVolume.toLocaleString()}</TableCell>
                                                                <TableCell>{contract.upperLimitPrice.toFixed(2)}</TableCell>
                                                                <TableCell>{contract.lowerLimitPrice.toFixed(2)}</TableCell>
                                                                <TableCell>{contract.volume.toLocaleString()}</TableCell>
                                                                <TableCell>{contract.openInterest.toLocaleString()}</TableCell>
                                                                <TableCell>{contract.timestamp}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'trend' && (
                                <FuturesTrendForecast />
                            )}
                            {activeTab === 'correlation' && (
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold">期货合约相关性分析</h1>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            分析不同期货合约之间的价格联动关系（如沪深300与上证50、原油与甲醇）
                                        </p>
                                    </div>
                                    <Card>
                                        <div className="p-5">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>期货合约对</TableHead>
                                                        <TableHead>相关系数</TableHead>
                                                        <TableHead>相关性强度</TableHead>
                                                        <TableHead>统计显著性</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {futuresCorrelationData.map((item, index) => {
                                                        let strength = "弱";
                                                        let color = "bg-gray-100 text-gray-800";
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
                                                                <TableCell>{item.contract1} - {item.contract2}</TableCell>
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

                            {activeTab === 'cluster' && (
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold">期货品种聚类分析</h1>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            基于期货合约特征（交易所/持仓量/波动率）自动分组，识别相似交易模式
                                        </p>
                                    </div>
                                    <Card>
                                        <div className="p-5">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {futuresClusterData.map(cluster => (
                                                    <Card key={cluster.cluster} className="p-5 border-l-4 border-blue-500">
                                                        <h3 className="text-lg font-medium mb-3">聚类 {cluster.cluster}（{
                                                            cluster.cluster === 1 ? '金融期货' :
                                                                cluster.cluster === 2 ? '能源及化工期货' : '金属期货'
                                                        }）</h3>
                                                        <div className="space-y-3 mb-4">
                                                            <div>
                                                                <h4 className="text-sm text-gray-500 mb-1">包含合约</h4>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {cluster.contracts.map(contract => (
                                                                        <Badge key={contract} variant="secondary">{contract}</Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="pt-3 border-t">
                                                            <h4 className="text-sm text-gray-500 mb-2">聚类特征（期货专用）</h4>
                                                            <div className="space-y-2 text-sm">
                                                                <div className="flex justify-between">
                                                                    <span>平均波动率</span>
                                                                    <span className={cluster.characteristics['平均波动率（%）'] > 15 ? 'text-red-500' : 'text-green-500'}>
                                                                        {cluster.characteristics['平均波动率（%）']}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>平均持仓量</span>
                                                                    <span>{cluster.characteristics['平均持仓量（万手）']} 万手</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>平均成交量</span>
                                                                    <span>{cluster.characteristics['平均成交量（万手）']} 万手</span>
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
                                <FactorMiningComponent/>
                            )}

                            {activeTab === 'reports' && (
                                <div className="space-y-6">
                                    <div>
                                        <h1 className="text-2xl font-bold">期货分析报告</h1>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            生成和管理期货数据分析报告（含合约价格/持仓量/趋势预测），支持多种导出格式
                                        </p>
                                    </div>
                                    <Card className="p-6">
                                        <div className="flex flex-col items-center justify-center py-8 text-center">
                                            <FileText className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
                                            <h3 className="text-lg font-medium mb-2">生成期货定制化分析报告</h3>
                                            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                                                基于您的期货分析需求，生成包含合约洞察、趋势预测和可视化图表的专业报告
                                            </p>
                                            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                                                <div className="flex-1">
                                                    <Select defaultValue="detailed">
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="期货报告类型" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="summary">期货摘要报告</SelectItem>
                                                            <SelectItem value="detailed">期货详细分析报告</SelectItem>
                                                            <SelectItem value="factors">期货因子分析报告</SelectItem>
                                                            <SelectItem value="prediction">期货趋势预测报告</SelectItem>
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
                                                            <SelectItem value="excel">Excel格式（含期货原始数据）</SelectItem>
                                                            <SelectItem value="ppt">PowerPoint格式（汇报用）</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-4">
                                                <Button onClick={() => exportReport('pdf')}>
                                                    <Download className="mr-2 h-4 w-4" />
                                                    生成期货报告
                                                </Button>
                                                <Button variant="secondary">
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    期货报告历史
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            )}

                            {activeTab === 'stock_index' && (
                                <StockIndex/>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* 页脚（不变） */}
            <footer className="border-t bg-white dark:bg-gray-900 py-4">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        ©FuturesDataThinker. 期货交易数据分析平台（支持CFFEX/SHFE/INE/ZCE合约）
                    </p>
                    <div className="flex gap-4">
                        <Button variant="ghost" size="sm">关于期货分析</Button>
                        <Button variant="ghost" size="sm">期货帮助中心</Button>
                        <Button variant="ghost" size="sm">隐私政策</Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}