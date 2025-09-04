"use client";

import { useState, useEffect } from 'react';
import {
    BarChart3,
    Database,
    FileSpreadsheet,
    Globe,
    Settings,
    Shield,
    RefreshCw,
    Save,
    Play,
    Download,
    Plus,
    Trash2,
    Edit3,
    ChevronDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
    Upload,
    Filter,
    History,
    User,
    Bell,
    Menu,
    X
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

// 定义数据处理相关的类型
interface DataSource {
    id: string;
    name: string;
    type: 'database' | 'excel' | 'api' | 'csv';
    status: 'connected' | 'disconnected' | 'error';
    lastUpdated: string;
    size?: string;
}

interface DataIssue {
    id: string;
    type: 'missing' | 'duplicate' | 'outlier' | 'format';
    count: number;
    severity: 'low' | 'medium' | 'high';
    column: string;
}

interface CleaningRule {
    id: string;
    name: string;
    description: string;
    type: 'missing' | 'duplicate' | 'outlier' | 'format' | 'masking';
    isActive: boolean;
    lastUsed?: string;
}

interface ProcessingStep {
    id: string;
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    startTime?: string;
    endTime?: string;
}

// 交易相关模拟数据
const mockDataSources: DataSource[] = [
    {
        id: 'ds1',
        name: '交易票据数据库',
        type: 'database',
        status: 'connected',
        lastUpdated: '2023-10-15 09:30',
        size: '15.8 MB'
    },
    {
        id: 'ds2',
        name: '每日交易报表',
        type: 'excel',
        status: 'connected',
        lastUpdated: '2023-10-14 16:45',
        size: '6.7 MB'
    },
    {
        id: 'ds3',
        name: '支付网关API数据',
        type: 'api',
        status: 'error',
        lastUpdated: '2023-10-15 11:20'
    },
    {
        id: 'ds4',
        name: '历史交易记录CSV',
        type: 'csv',
        status: 'disconnected',
        lastUpdated: '2023-10-12 14:10',
        size: '92.1 MB'
    }
];

const mockDataIssues: DataIssue[] = [
    { id: 'i1', type: 'missing', count: 187, severity: 'high', column: 'ticket_id' },
    { id: 'i2', type: 'duplicate', count: 42, severity: 'medium', column: 'transaction_ref' },
    { id: 'i3', type: 'outlier', count: 9, severity: 'low', column: 'transaction_amount' },
    { id: 'i4', type: 'format', count: 63, severity: 'medium', column: 'settlement_date' },
    { id: 'i5', type: 'missing', count: 41, severity: 'medium', column: 'fee_amount' }
];

const mockCleaningRules: CleaningRule[] = [
    {
        id: 'r1',
        name: '填充缺失票据ID',
        description: '用默认规则填充缺失的票据ID字段',
        type: 'missing',
        isActive: true,
        lastUsed: '2023-10-14'
    },
    {
        id: 'r2',
        name: '去重交易参考号',
        description: '基于transaction_ref字段去重，保留最新交易记录',
        type: 'duplicate',
        isActive: true,
        lastUsed: '2023-10-15'
    },
    {
        id: 'r3',
        name: '统一结算日期格式',
        description: '将所有结算日期转换为YYYY-MM-DD格式',
        type: 'format',
        isActive: true
    },
    {
        id: 'r4',
        name: '脱敏手续费金额',
        description: '对手续费金额进行部分掩码处理',
        type: 'masking',
        isActive: false,
        lastUsed: '2023-10-10'
    },
    {
        id: 'r5',
        name: '标记异常u交易金额',
        description: '识别超出3个标准差的交易金额并标记',
        type: 'outlier',
        isActive: true
    }
];

const mockProcessingSteps: ProcessingStep[] = [
    { id: 's1', name: '交易数据导入', status: 'completed', progress: 100, startTime: '10:23:15', endTime: '10:23:28' },
    { id: 's2', name: '交易数据验证', status: 'completed', progress: 100, startTime: '10:23:29', endTime: '10:23:45' },
    { id: 's3', name: '缺失票据ID填充', status: 'processing', progress: 65, startTime: '10:23:46' },
    { id: 's4', name: '交易参考号去重', status: 'pending', progress: 0 },
    { id: 's5', name: '结算日期标准化', status: 'pending', progress: 0 },
    { id: 's6', name: '手续费金额脱敏', status: 'pending', progress: 0 },
    { id: 's7', name: '交易数据导出', status: 'pending', progress: 0 }
];

// 主页面组件
export default function DataPreprocessingPage() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeStep, setActiveStep] = useState('overview');
    const [processingProgress, setProcessingProgress] = useState(35);
    const [dataIssues, setDataIssues] = useState(mockDataIssues);
    const [dataSources, setDataSources] = useState(mockDataSources);
    const [cleaningRules, setCleaningRules] = useState(mockCleaningRules);
    const [processingSteps, setProcessingSteps] = useState(mockProcessingSteps);
    const [isProcessing, setIsProcessing] = useState(true);

    // 模拟处理进度更新
    useEffect(() => {
        if (!isProcessing) return;

        const interval = setInterval(() => {
            setProcessingProgress(prev => {
                if (prev >= 100) {
                    setIsProcessing(false);
                    clearInterval(interval);
                    return 100;
                }
                return prev + 1;
            });

            // 更新步骤进度
            setProcessingSteps(steps => {
                return steps.map(step => {
                    if (step.status === 'processing') {
                        const newProgress = step.progress + 1;
                        if (newProgress >= 100) {
                            return { ...step, progress: 100, status: 'completed', endTime: new Date().toTimeString().slice(0, 8) };
                        }
                        return { ...step, progress: newProgress };
                    } else if (step.status === 'pending' && steps.find(s => s.status === 'processing')?.progress === 100) {
                        return { ...step, status: 'processing', startTime: new Date().toTimeString().slice(0, 8) };
                    }
                    return step;
                });
            });
        }, 500);

        return () => clearInterval(interval);
    }, [isProcessing]);

    // 切换规则激活状态
    const toggleRuleStatus = (id: string) => {
        setCleaningRules(rules =>
            rules.map(rule =>
                rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
            )
        );
    };

    // 获取问题类型对应的图标
    const getIssueIcon = (type: DataIssue['type']) => {
        switch (type) {
            case 'missing': return <XCircle className="h-4 w-4 text-orange-500" />;
            case 'duplicate': return <RefreshCw className="h-4 w-4 text-purple-500" />;
            case 'outlier': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
            case 'format': return <Edit3 className="h-4 w-4 text-blue-500" />;
            default: return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    // 获取数据源类型对应的图标
    const getSourceIcon = (type: DataSource['type']) => {
        switch (type) {
            case 'database': return <Database className="h-5 w-5" />;
            case 'excel': return <FileSpreadsheet className="h-5 w-5" />;
            case 'api': return <Globe className="h-5 w-5" />;
            case 'csv': return <FileSpreadsheet className="h-5 w-5" />;
            default: return <Database className="h-5 w-5" />;
        }
    };

    // 获取状态对应的样式
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
            case 'completed':
                return <Badge className="bg-green-500 hover:bg-green-600">已完成</Badge>;
            case 'processing':
                return <Badge className="bg-blue-500 hover:bg-blue-600">处理中</Badge>;
            case 'pending':
                return <Badge className="bg-amber-500 hover:bg-amber-600">待处理</Badge>;
            case 'disconnected':
                return <Badge className="bg-gray-500 hover:bg-gray-600">未连接</Badge>;
            case 'error':
            case 'failed':
                return <Badge className="bg-red-500 hover:bg-red-600">错误</Badge>;
            default:
                return <Badge>{status}</Badge>;
        }
    };

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
                            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            <h1 className="text-xl font-bold">TradeClean Pro</h1>
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
                                    <p>交易系统通知</p>
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
                                    <span>交易设置</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 侧边栏 */}
                <aside
                    className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-20 w-64 border-r bg-white dark:bg-gray-900 p-4 transition-transform md:relative md:translate-x-0 md:translate-y-0`}
                >
                    <nav className="space-y-1">
                        <Button
                            variant={activeStep === 'overview' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveStep('overview')}
                        >
                            <BarChart3 className="mr-2 h-4 w-4" />
                            交易数据概览
                        </Button>
                        <Button
                            variant={activeStep === 'sources' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveStep('sources')}
                        >
                            <Database className="mr-2 h-4 w-4" />
                            交易数据源
                        </Button>
                        <Button
                            variant={activeStep === 'issues' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveStep('issues')}
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            交易数据问题
                        </Button>
                        <Button
                            variant={activeStep === 'rules' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveStep('rules')}
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            交易清洗规则
                        </Button>
                        <Button
                            variant={activeStep === 'processing' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveStep('processing')}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            交易处理流程
                        </Button>
                        <Button
                            variant={activeStep === 'history' ? 'default' : 'ghost'}
                            className="w-full justify-start"
                            onClick={() => setActiveStep('history')}
                        >
                            <History className="mr-2 h-4 w-4" />
                            交易历史记录
                        </Button>
                    </nav>

                    <div className="absolute bottom-4 left-0 right-0 px-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4">
                            <h3 className="font-medium mb-2">交易数据处理效率</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                自动化处理节省了 78% 的交易数据预处理时间
                            </p>
                            <Progress value={78} className="h-2" />
                        </Card>
                    </div>
                </aside>

                {/* 主内容区 */}
                <main className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${mobileMenuOpen ? 'md:ml-0 ml-16' : 'md:ml-16 ml-0'}`}>
                    {/* 交易数据概览 */}
                    {activeStep === 'overview' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">交易数据预处理概览</h1>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        自动化处理交易数据全流程，提升金融数据质量
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={() => setIsProcessing(true)}>
                                        <Play className="mr-2 h-4 w-4" />
                                        开始交易处理
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="secondary">
                                                更多操作
                                                <ChevronDown className="ml-2 h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem>
                                                <Save className="mr-2 h-4 w-4" />
                                                保存交易配置
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Download className="mr-2 h-4 w-4" />
                                                导出交易报告
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* 数据概览卡片 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">交易数据源数量</h3>
                                        <Database className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <p className="text-2xl font-bold">4</p>
                                    <p className="text-xs text-green-500 mt-1">
                    <span className="inline-flex items-center">
                      <Plus className="h-3 w-3 mr-1" />1 个新交易数据源
                    </span>
                                    </p>
                                </Card>

                                <Card className="p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">检测到的交易问题</h3>
                                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <p className="text-2xl font-bold">5</p>
                                    <p className="text-xs text-orange-500 mt-1">
                                        1 个高优先级交易问题需要处理
                                    </p>
                                </Card>

                                <Card className="p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">活跃清洗规则</h3>
                                        <Settings className="h-5 w-5 text-green-500" />
                                    </div>
                                    <p className="text-2xl font-bold">4</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        5 条规则中 4 条已启用
                                    </p>
                                </Card>

                                <Card className="p-5 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">交易处理进度</h3>
                                        <RefreshCw className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <p className="text-2xl font-bold">{processingProgress}%</p>
                                    <Progress value={processingProgress} className="h-1.5 mt-2" />
                                </Card>
                            </div>

                            {/* 处理步骤和数据质量 */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2">
                                    <div className="p-5 border-b">
                                        <h2 className="text-lg font-semibold">交易处理流程状态</h2>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {processingSteps.map((step) => (
                                            <div key={step.id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                            step.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                                step.status === 'processing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    step.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                        }`}>
                                                            {step.status === 'completed' ? (
                                                                <CheckCircle className="h-4 w-4" />
                                                            ) : step.status === 'processing' ? (
                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                            ) : step.status === 'failed' ? (
                                                                <XCircle className="h-4 w-4" />
                                                            ) : (
                                                                <span className="text-xs">{step.progress}%</span>
                                                            )}
                                                        </div>
                                                        <span>{step.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(step.status)}
                                                        {step.startTime && (
                                                            <span className="text-xs text-gray-500">
                                {step.startTime}
                                                                {step.endTime && ` - ${step.endTime}`}
                              </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Progress value={step.progress} className="h-1.5" />
                                            </div>
                                        ))}
                                    </div>
                                </Card>

                                <Card>
                                    <div className="p-5 border-b">
                                        <h2 className="text-lg font-semibold">交易数据质量评分</h2>
                                    </div>
                                    <div className="p-5 flex flex-col items-center justify-center">
                                        <div className="relative w-40 h-40 mb-4">
                                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                                {/* 背景圆环 */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    strokeDasharray="283"
                                                    strokeDashoffset="0"
                                                    className="text-gray-200 dark:text-gray-700"
                                                />
                                                {/* 进度圆环 */}
                                                <circle
                                                    cx="50"
                                                    cy="50"
                                                    r="45"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="10"
                                                    strokeDasharray="283"
                                                    strokeDashoffset={283 - (283 * 68) / 100}
                                                    strokeLinecap="round"
                                                    className="text-blue-500"
                                                    transform="rotate(-90 50 50)"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                <span className="text-3xl font-bold">68</span>
                                                <span className="text-xs text-gray-500">分</span>
                                            </div>
                                        </div>
                                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                                            当前交易数据质量评分，目标：90分以上
                                        </p>
                                        <div className="w-full space-y-2">
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>完整性</span>
                                                    <span>72%</span>
                                                </div>
                                                <Progress value={72} className="h-1.5" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>准确性</span>
                                                    <span>85%</span>
                                                </div>
                                                <Progress value={85} className="h-1.5" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>一致性</span>
                                                    <span>60%</span>
                                                </div>
                                                <Progress value={60} className="h-1.5" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>规范性</span>
                                                    <span>58%</span>
                                                </div>
                                                <Progress value={58} className="h-1.5" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* 交易数据源管理 */}
                    {activeStep === 'sources' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">交易数据源管理</h1>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        管理和配置所有交易数据接入源
                                    </p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            添加交易数据源
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>添加新交易数据源</DialogTitle>
                                            <DialogDescription>
                                                配置新的交易数据接入源，支持数据库、报表、API等多种类型
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="source-name">数据源名称</Label>
                                                <Input id="source-name" placeholder="输入交易数据源名称" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="source-type">数据源类型</Label>
                                                <Select>
                                                    <SelectTrigger id="source-type">
                                                        <SelectValue placeholder="选择交易数据源类型" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="database">交易数据库</SelectItem>
                                                        <SelectItem value="excel">交易报表</SelectItem>
                                                        <SelectItem value="csv">交易记录CSV</SelectItem>
                                                        <SelectItem value="api">支付API</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="source-connection">连接信息</Label>
                                                <Input id="source-connection" placeholder="输入连接字符串或文件路径" />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="source-enable" defaultChecked />
                                                <Label htmlFor="source-enable">启用该交易数据源</Label>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="secondary">取消</Button>
                                            <Button>保存</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Card>
                                <div className="p-5">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>交易数据源名称</TableHead>
                                                <TableHead>类型</TableHead>
                                                <TableHead>状态</TableHead>
                                                <TableHead>最后更新</TableHead>
                                                <TableHead>大小</TableHead>
                                                <TableHead>操作</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dataSources.map((source) => (
                                                <TableRow key={source.id}>
                                                    <TableCell className="font-medium">{source.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getSourceIcon(source.type)}
                                                            <span className="capitalize">
                                {source.type === 'database' ? '交易数据库' :
                                    source.type === 'excel' ? '交易报表' :
                                        source.type === 'api' ? '支付API' : '交易CSV'}
                              </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(source.status)}</TableCell>
                                                    <TableCell>{source.lastUpdated}</TableCell>
                                                    <TableCell>{source.size || '-'}</TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="icon">
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-red-500">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <div className="p-5 border-b">
                                        <h2 className="text-lg font-semibold">交易数据源类型分布</h2>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">交易数据库</span>
                                                    <span className="text-sm">25%</span>
                                                </div>
                                                <Progress value={25} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">交易报表</span>
                                                    <span className="text-sm">25%</span>
                                                </div>
                                                <Progress value={25} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">支付API</span>
                                                    <span className="text-sm">25%</span>
                                                </div>
                                                <Progress value={25} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">交易CSV</span>
                                                    <span className="text-sm">25%</span>
                                                </div>
                                                <Progress value={25} className="h-2" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card>
                                    <div className="p-5 border-b">
                                        <h2 className="text-lg font-semibold">交易数据接入状态</h2>
                                    </div>
                                    <div className="p-5">
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">已连接</span>
                                                    <span className="text-sm">50%</span>
                                                </div>
                                                <Progress value={50} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">未连接</span>
                                                    <span className="text-sm">25%</span>
                                                </div>
                                                <Progress value={25} className="h-2" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm">连接错误</span>
                                                    <span className="text-sm">25%</span>
                                                </div>
                                                <Progress value={25} className="h-2" />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* 交易数据问题检测 */}
                    {activeStep === 'issues' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">交易数据问题检测</h1>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        智能识别并处理交易数据中的异常和问题
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Button>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        重新检测交易问题
                                    </Button>
                                    <Button variant="secondary">
                                        <Filter className="mr-2 h-4 w-4" />
                                        筛选交易问题
                                    </Button>
                                </div>
                            </div>

                            <Card>
                                <div className="p-5">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>问题类型</TableHead>
                                                <TableHead>涉及交易字段</TableHead>
                                                <TableHead>数量</TableHead>
                                                <TableHead>严重程度</TableHead>
                                                <TableHead>处理建议</TableHead>
                                                <TableHead>操作</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dataIssues.map((issue) => (
                                                <TableRow key={issue.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getIssueIcon(issue.type)}
                                                            <span>
                                {issue.type === 'missing' ? '缺失值' :
                                    issue.type === 'duplicate' ? '重复交易' :
                                        issue.type === 'outlier' ? '异常交易' : '格式错误'}
                              </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{issue.column}</TableCell>
                                                    <TableCell>{issue.count}</TableCell>
                                                    <TableCell>
                                                        <Badge className={
                                                            issue.severity === 'high' ? 'bg-red-500 hover:bg-red-600' :
                                                                issue.severity === 'medium' ? 'bg-amber-500 hover:bg-amber-600' :
                                                                    'bg-green-500 hover:bg-green-600'
                                                        }>
                                                            {issue.severity === 'high' ? '高' :
                                                                issue.severity === 'medium' ? '中' : '低'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                                        {issue.type === 'missing' ? '填充默认票据ID或补充交易记录' :
                                                            issue.type === 'duplicate' ? '保留最新交易记录并删除重复项' :
                                                                issue.type === 'outlier' ? '标记或修正异常交易金额' :
                                                                    '标准化交易日期格式'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button size="sm">处理交易问题</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <div className="p-5 border-b">
                                        <h2 className="text-lg font-semibold">交易问题类型分布</h2>
                                    </div>
                                    <div className="p-5">
                                        <div className="h-64">
                                            {/* 这里可以放置一个饼图来展示交易问题类型分布 */}
                                            <div className="h-full flex items-center justify-center text-gray-500">
                                                交易问题类型分布图表
                                            </div>
                                        </div>
                                    </div>
                                </Card>

                                <Card>
                                    <div className="p-5 border-b">
                                        <h2 className="text-lg font-semibold">交易字段问题分布</h2>
                                    </div>
                                    <div className="p-5">
                                        <div className="h-64">
                                            {/* 这里可以放置一个柱状图来展示交易字段问题分布 */}
                                            <div className="h-full flex items-center justify-center text-gray-500">
                                                交易字段问题分布图表
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* 交易清洗规则配置 */}
                    {activeStep === 'rules' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">交易清洗规则配置</h1>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        自定义和管理交易数据清洗规则，支持复用
                                    </p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            添加交易规则
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>创建新交易清洗规则</DialogTitle>
                                            <DialogDescription>
                                                定义交易数据清洗规则，用于自动化处理交易数据问题
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="rule-name">规则名称</Label>
                                                <Input id="rule-name" placeholder="输入交易规则名称" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rule-type">规则类型</Label>
                                                <Select>
                                                    <SelectTrigger id="rule-type">
                                                        <SelectValue placeholder="选择交易规则类型" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="missing">缺失票据ID处理</SelectItem>
                                                        <SelectItem value="duplicate">重复交易去重</SelectItem>
                                                        <SelectItem value="outlier">异常交易处理</SelectItem>
                                                        <SelectItem value="format">交易日期标准化</SelectItem>
                                                        <SelectItem value="masking">交易金额脱敏</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rule-description">规则描述</Label>
                                                <Input id="rule-description" placeholder="描述该交易规则的作用" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rule-configuration">规则配置</Label>
                                                <Input id="rule-configuration" placeholder="配置交易规则参数" />
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="rule-enable" defaultChecked />
                                                <Label htmlFor="rule-enable">启用该交易规则</Label>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="secondary">取消</Button>
                                            <Button>保存交易规则</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Card>
                                <div className="p-5">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>规则名称</TableHead>
                                                <TableHead>类型</TableHead>
                                                <TableHead>状态</TableHead>
                                                <TableHead>最后使用</TableHead>
                                                <TableHead>操作</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cleaningRules.map((rule) => (
                                                <TableRow key={rule.id}>
                                                    <TableCell className="font-medium">{rule.name}</TableCell>
                                                    <TableCell>
                            <span className="capitalize">
                              {rule.type === 'missing' ? '缺失票据ID处理' :
                                  rule.type === 'duplicate' ? '重复交易去重' :
                                      rule.type === 'outlier' ? '异常交易处理' :
                                          rule.type === 'format' ? '交易日期标准化' : '交易金额脱敏'}
                            </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center">
                                                            <Switch
                                                                checked={rule.isActive}
                                                                onCheckedChange={() => toggleRuleStatus(rule.id)}
                                                            />
                                                            <span className="ml-2 text-sm">
                                {rule.isActive ? '启用' : '禁用'}
                              </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {rule.lastUsed || '未使用'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button variant="ghost" size="icon">
                                                                <Edit3 className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="text-red-500">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>

                            <Card>
                                <div className="p-5 border-b">
                                    <h2 className="text-lg font-semibold">交易规则模板库</h2>
                                </div>
                                <div className="p-5">
                                    <Tabs defaultValue="missing">
                                        <TabsList className="mb-4">
                                            <TabsTrigger value="missing">缺失票据ID</TabsTrigger>
                                            <TabsTrigger value="duplicate">重复交易</TabsTrigger>
                                            <TabsTrigger value="format">日期标准化</TabsTrigger>
                                            <TabsTrigger value="masking">金额脱敏</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="missing" className="space-y-4">
                                            <Card className="p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-medium">默认票据ID填充</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            用规则生成唯一票据ID填充缺失值
                                                        </p>
                                                    </div>
                                                    <Button size="sm">应用到交易</Button>
                                                </div>
                                            </Card>
                                            <Card className="p-4 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h3 className="font-medium">票据ID前向填充</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                            使用前一条交易的票据ID模式填充缺失值
                                                        </p>
                                                    </div>
                                                    <Button size="sm">应用到交易</Button>
                                                </div>
                                            </Card>
                                        </TabsContent>
                                        <TabsContent value="duplicate">
                                            <Card className="p-4">
                                                <h3 className="font-medium">交易参考号去重</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    根据transaction_ref字段识别并移除重复交易记录
                                                </p>
                                                <Button size="sm" className="mt-3">应用到交易</Button>
                                            </Card>
                                        </TabsContent>
                                        <TabsContent value="format">
                                            <Card className="p-4">
                                                <h3 className="font-medium">交易日期标准化</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    将所有交易日期字段统一转换为YYYY-MM-DD格式
                                                </p>
                                                <Button size="sm" className="mt-3">应用到交易</Button>
                                            </Card>
                                        </TabsContent>
                                        <TabsContent value="masking">
                                            <Card className="p-4">
                                                <h3 className="font-medium">交易金额脱敏</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    对交易金额进行部分掩码处理，保护敏感金融数据
                                                </p>
                                                <Button size="sm" className="mt-3">应用到交易</Button>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* 交易处理流程 */}
                    {activeStep === 'processing' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">交易处理流程</h1>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        监控和管理交易数据预处理的完整流程
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Button onClick={() => setIsProcessing(true)}>
                                        <Play className="mr-2 h-4 w-4" />
                                        开始交易处理
                                    </Button>
                                    <Button variant="secondary">
                                        <Download className="mr-2 h-4 w-4" />
                                        导出交易结果
                                    </Button>
                                </div>
                            </div>

                            <Card>
                                <div className="p-5 border-b">
                                    <h2 className="text-lg font-semibold">交易处理进度</h2>
                                </div>
                                <div className="p-5">
                                    <div className="mb-6">
                                        <div className="flex justify-between mb-2">
                                            <span>总体交易处理进度</span>
                                            <span>{processingProgress}%</span>
                                        </div>
                                        <Progress value={processingProgress} className="h-2.5" />
                                    </div>

                                    <div className="space-y-6">
                                        {processingSteps.map((step) => (
                                            <div key={step.id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                            step.status === 'completed' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                                                                step.status === 'processing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    step.status === 'failed' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                                                                        'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                        }`}>
                                                            {step.status === 'completed' ? (
                                                                <CheckCircle className="h-4 w-4" />
                                                            ) : step.status === 'processing' ? (
                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                            ) : step.status === 'failed' ? (
                                                                <XCircle className="h-4 w-4" />
                                                            ) : (
                                                                <span className="text-xs">{step.progress}%</span>
                                                            )}
                                                        </div>
                                                        <span>{step.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(step.status)}
                                                        <span className="text-sm">{step.progress}%</span>
                                                    </div>
                                                </div>
                                                <Progress value={step.progress} className="h-2" />
                                                {step.status === 'completed' && (
                                                    <p className="text-xs text-gray-500">
                                                        完成于 {step.endTime}，交易处理耗时 {Math.floor(Math.random() * 30) + 5} 秒
                                                    </p>
                                                )}
                                                {step.status === 'processing' && (
                                                    <p className="text-xs text-blue-500">
                                                        正在处理交易数据...
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            <Card>
                                <div className="p-5 border-b">
                                    <h2 className="text-lg font-semibold">交易处理日志</h2>
                                </div>
                                <ScrollArea className="h-64">
                                    <div className="p-5 space-y-3 text-sm">
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 min-w-[100px]">10:23:15</span>
                                            <span>开始交易数据导入流程</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 min-w-[100px]">10:23:20</span>
                                            <span>成功导入交易票据数据库 (15.8 MB)</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 min-w-[100px]">10:23:28</span>
                                            <span>交易数据导入完成，共导入 12,876 条交易记录</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 min-w-[100px]">10:23:29</span>
                                            <span>开始交易数据验证</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 min-w-[100px]">10:23:35</span>
                                            <span>检测到 187 条记录存在票据ID缺失</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 min-w-[100px]">10:23:40</span>
                                            <span>检测到 42 条重复交易参考号记录</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 min-w-[100px]">10:23:45</span>
                                            <span>交易数据验证完成，共发现 5 类交易数据问题</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 min-w-[100px]">10:23:46</span>
                                            <span>开始缺失票据ID填充</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-gray-500 min-w-[100px]">10:24:10</span>
                                            <span className="text-blue-500">正在处理缺失票据ID，已完成 65%</span>
                                        </div>
                                    </div>
                                </ScrollArea>
                            </Card>
                        </div>
                    )}

                    {/* 交易历史记录 */}
                    {activeStep === 'history' && (
                        <div className="space-y-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">交易历史记录</h1>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        查看和管理过往的交易数据处理记录
                                    </p>
                                </div>
                                <Button variant="secondary">
                                    <Filter className="mr-2 h-4 w-4" />
                                    筛选交易记录
                                </Button>
                            </div>

                            <Card>
                                <div className="p-5">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>交易处理时间</TableHead>
                                                <TableHead>交易数据源</TableHead>
                                                <TableHead>处理结果</TableHead>
                                                <TableHead>耗时</TableHead>
                                                <TableHead>交易记录数</TableHead>
                                                <TableHead>操作</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell>2023-10-14 15:30</TableCell>
                                                <TableCell>交易票据数据库</TableCell>
                                                <TableCell>{getStatusBadge('completed')}</TableCell>
                                                <TableCell>2分35秒</TableCell>
                                                <TableCell>12,548</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon">
                                                            <Info className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>2023-10-13 09:15</TableCell>
                                                <TableCell>每日交易报表</TableCell>
                                                <TableCell>{getStatusBadge('completed')}</TableCell>
                                                <TableCell>1分42秒</TableCell>
                                                <TableCell>8,752</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon">
                                                            <Info className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>2023-10-12 16:40</TableCell>
                                                <TableCell>支付网关API数据</TableCell>
                                                <TableCell>{getStatusBadge('failed')}</TableCell>
                                                <TableCell>3分18秒</TableCell>
                                                <TableCell>-</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon">
                                                            <Info className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" disabled>
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell>2023-10-11 11:25</TableCell>
                                                <TableCell>交易票据数据库</TableCell>
                                                <TableCell>{getStatusBadge('completed')}</TableCell>
                                                <TableCell>2分10秒</TableCell>
                                                <TableCell>12,493</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="icon">
                                                            <Info className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon">
                                                            <RefreshCw className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>

                            <Card>
                                <div className="p-5 border-b">
                                    <h2 className="text-lg font-semibold">交易处理效率分析</h2>
                                </div>
                                <div className="p-5">
                                    <div className="h-64">
                                        {/* 这里可以放置一个折线图来展示交易处理效率趋势 */}
                                        <div className="h-full flex items-center justify-center text-gray-500">
                                            交易处理效率分析图表
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </main>
            </div>

            {/* 页脚 */}
            <footer className="border-t bg-white dark:bg-gray-900 py-4">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        © 2023 TradeClean Pro. 金融交易数据预处理平台
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