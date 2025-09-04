"use client";

import { useState, useEffect } from 'react';
import {
    Zap,
    Download,
    RefreshCw,
    Settings,
    ChevronDown,
    Info,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    Layers,
    BrainCircuit,
    Filter,
    Star,
    StarOff,
    PlusCircle,
    Trash2, CheckCircle
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';

// 固定种子随机数生成器，确保服务端客户端渲染一致
const createRandomGenerator = (seed: number) => {
    return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
};

const seed = 45678;
const random = createRandomGenerator(seed);

// 定义因子核心类型（聚焦挖掘属性，移除分析相关字段）
interface Factor {
    id: string;
    name: string;
    importance: number; // 0-100（挖掘出的因子重要性）
    description: string;
    impact: 'positive' | 'negative' | 'neutral'; // 因子影响方向
    dataSource: string; // 因子数据来源
    updateFrequency: 'real-time' | 'daily' | 'weekly' | 'monthly'; // 数据更新频率
    historicalTrend: {
        period: string;
        value: number; // 历史重要性趋势
    }[];
    isCollected: boolean; // 是否收藏
}

// 定义因子挖掘参数（简化分析相关参数，聚焦挖掘逻辑）
type MiningAlgorithmType = 'pca' | 'factorAnalysis' | 'randomForest' | 'xgboost';
type FactorCategoryType = 'volume' | 'price' | 'valuation' | 'liquidity' | 'sentiment' | 'macro' | 'industry' | 'technical' | 'fundamental';

interface MiningParameter {
    algorithm: MiningAlgorithmType;
    minImportanceThreshold: number; // 最小因子重要性阈值（0-100）
    factorCategories: FactorCategoryType[]; // 待挖掘因子类别
    dataTimeRange: '1M' | '3M' | '6M' | '1Y' | '2Y'; // 挖掘数据时间范围
    includeNewFactors: boolean; // 是否包含未验证的新因子
    dataSamplingRate: 'high' | 'medium' | 'low'; // 数据采样率（影响挖掘精度和速度）
}

// 因子挖掘结果（仅包含挖掘产出，无分析结论）
interface FactorMiningResult {
    minedFactors: Factor[]; // 挖掘出的因子列表
    miningParameters: MiningParameter;
    miningTime: number; // 挖掘耗时（秒）
    totalScannedFactors: number; // 总扫描因子数量
    validFactorRate: number; // 有效因子率（%）
}

// 因子类别映射（用于展示）
const FactorCategoryMap: Record<FactorCategoryType, string> = {
    'volume': '成交量类因子',
    'price': '价格类因子',
    'valuation': '估值类因子',
    'liquidity': '流动性类因子',
    'sentiment': '情绪类因子',
    'macro': '宏观类因子',
    'industry': '行业类因子',
    'technical': '技术类因子',
    'fundamental': '基本面类因子'
};

// 算法名称映射（用于展示）
const MiningAlgorithmMap: Record<MiningAlgorithmType, string> = {
    'pca': '主成分分析 (PCA)',
    'factorAnalysis': '因子载荷分析',
    'randomForest': '随机森林',
    'xgboost': '极端梯度提升 (XGBoost)'
};

// 数据更新频率映射
const UpdateFrequencyMap: Record<Factor['updateFrequency'], string> = {
    'real-time': '实时',
    'daily': '每日',
    'weekly': '每周',
    'monthly': '每月'
};

// 生成待挖掘因子类别选项
const FactorCategoryOptions = Object.entries(FactorCategoryMap).map(([value, label]) => ({
    value: value as FactorCategoryType,
    label
}));

// 生成示例因子数据（聚焦挖掘属性，简化分析相关内容）
const generateMinedFactors = (params: MiningParameter): Factor[] => {
    // 基础因子库（按类别分类）
    const baseFactorsByCategory: Record<FactorCategoryType, {name: string; description: string; dataSource: string}[]> = {
        'volume': [
            {name: '成交量波动率', description: '反映股票交易活跃度的波动情况，高波动率通常意味着市场关注度高', dataSource: '交易所逐笔数据'},
            {name: '大单成交占比', description: '大单交易量占总交易量的比例，反映机构参与度', dataSource: 'Level-2行情数据'},
            {name: '量价配合度', description: '成交量与价格变动的协同程度，用于判断趋势强度', dataSource: '行情聚合数据'}
        ],
        'price': [
            {name: '价格波动幅度', description: '日内最高价与最低价的差值比例，反映价格波动风险', dataSource: '基础行情数据'},
            {name: '价格趋势斜率', description: '近期价格走势的线性斜率，判断趋势方向和强度', dataSource: '技术分析引擎'},
            {name: '突破信号频率', description: '价格突破关键均线/区间的频率，反映趋势转折可能性', dataSource: '技术指标库'}
        ],
        'valuation': [
            {name: '市盈率变化率', description: '市盈率的周度/月度变化速率，反映市场估值变化趋势', dataSource: '财务数据终端'},
            {name: '市净率分位数', description: '当前市净率在历史区间的分位水平，判断估值高低', dataSource: '财务分析系统'},
            {name: '估值偏离度', description: '当前估值与行业均值的偏离程度，识别估值洼地/泡沫', dataSource: '行业对比数据库'}
        ],
        'liquidity': [
            {name: '买卖价差率', description: '盘口买一卖一价差与股价的比例，反映即时流动性', dataSource: 'Level-1行情数据'},
            {name: '成交深度', description: '盘口各档位挂单量的总和，反映大额订单的冲击成本', dataSource: 'Level-2行情数据'},
            {name: '流动性指数', description: '综合价差、深度、成交速度的流动性评分，0-100分', dataSource: '流动性计算模型'}
        ],
        'sentiment': [
            {name: '市场情绪指数', description: '综合新闻、社交媒体情绪分析得出的投资者情绪指标，-100至100', dataSource: '舆情分析平台'},
            {name: '分析师评级变化', description: '券商分析师近期评级调整的方向和幅度，反映专业机构观点', dataSource: '研究报告数据库'},
            {name: '资金情绪背离度', description: '资金流向与价格走势的背离程度，提示趋势反转风险', dataSource: '资金分析系统'}
        ],
        'macro': [
            {name: '利率敏感度', description: '股票价格对市场利率变动的敏感系数，反映宏观利率风险', dataSource: '宏观因子模型'},
            {name: '通胀关联度', description: '股票收益与通胀数据的相关性，识别抗通胀/通缩标的', dataSource: '宏观经济数据库'},
            {name: '政策影响系数', description: '行业政策对股票价格的影响程度，量化政策风险', dataSource: '政策分析引擎'}
        ],
        'industry': [
            {name: '行业景气度', description: '所属行业的整体景气程度和发展前景评分，0-100分', dataSource: '行业研究数据库'},
            {name: '产业链位置系数', description: '公司在产业链中的位置对业绩的影响程度，反映议价能力', dataSource: '产业链分析模型'},
            {name: '行业轮动适配度', description: '股票与当前行业轮动趋势的匹配程度，判断配置价值', dataSource: '行业轮动模型'}
        ],
        'technical': [
            {name: '技术面综合评分', description: '基于均线、RSI、MACD等指标的综合技术评分，0-100分', dataSource: '技术指标库'},
            {name: '趋势延续概率', description: '当前价格趋势在未来N周期内延续的概率，反映趋势稳定性', dataSource: '趋势预测模型'},
            {name: '支撑阻力强度', description: '关键支撑/阻力位的强度评分，判断突破概率', dataSource: '技术分析引擎'}
        ],
        'fundamental': [
            {name: '盈利增速稳定性', description: '近3-5年净利润增速的波动程度，反映盈利质量', dataSource: '财务数据终端'},
            {name: '现金流健康度', description: '经营现金流与净利润的匹配程度，识别财务风险', dataSource: '财务分析系统'},
            {name: 'ROE趋势斜率', description: '净资产收益率的季度变化趋势，反映盈利能力变化', dataSource: '财务因子库'}
        ]
    };

    const factorRandom = createRandomGenerator(seed + 50);
    const minedFactors: Factor[] = [];

    // 按选择的类别筛选因子
    params.factorCategories.forEach(category => {
        const categoryFactors = baseFactorsByCategory[category];

        // 每个类别随机挖掘1-3个因子
        const factorCount = Math.floor(1 + factorRandom() * 3);
        for (let i = 0; i < factorCount; i++) {
            const baseFactor = categoryFactors[Math.floor(factorRandom() * categoryFactors.length)];
            const importance = Math.floor(params.minImportanceThreshold + factorRandom() * (100 - params.minImportanceThreshold));
            const impact = factorRandom() > 0.3 ? 'positive' : factorRandom() > 0.5 ? 'negative' : 'neutral';
            const updateFrequency = factorRandom() > 0.7 ? 'real-time' : factorRandom() > 0.5 ? 'daily' : factorRandom() > 0.2 ? 'weekly' : 'monthly';

            // 生成历史趋势（6个周期）
            const trend: {period: string; value: number}[] = [];
            const baseValue = importance * (0.8 + factorRandom() * 0.4);
            for (let j = 5; j >= 0; j--) {
                const date = new Date();
                date.setMonth(date.getMonth() - j);
                const month = date.toLocaleString('default', { month: 'short' });
                trend.push({
                    period: month,
                    value: parseFloat((baseValue + (factorRandom() * 15 - 7.5)).toFixed(1))
                });
            }

            // 去重（避免同一因子重复挖掘）
            if (!minedFactors.some(f => f.name === baseFactor.name)) {
                minedFactors.push({
                    id: `factor-${category}-${minedFactors.length + 1}`,
                    name: baseFactor.name,
                    importance,
                    description: baseFactor.description,
                    impact: impact as 'positive' | 'negative' | 'neutral',
                    dataSource: baseFactor.dataSource,
                    updateFrequency: updateFrequency as Factor['updateFrequency'],
                    historicalTrend: trend,
                    isCollected: false
                });
            }
        }
    });

    // 按重要性排序
    return minedFactors.sort((a, b) => b.importance - a.importance);
};

// 生成因子挖掘结果
const generateFactorMiningResult = (params: MiningParameter): FactorMiningResult => {
    const minedFactors = generateMinedFactors(params);
    const totalScannedFactors = params.factorCategories.length * 10; // 每个类别默认扫描10个基础因子
    const validFactorRate = parseFloat(((minedFactors.length / totalScannedFactors) * 100).toFixed(1));

    return {
        minedFactors,
        miningParameters: params,
        miningTime: parseFloat((1.5 + random() * 6).toFixed(1)), // 挖掘耗时1.5-7.5秒
        totalScannedFactors,
        validFactorRate
    };
};

// 因子挖掘模块主组件（聚焦挖掘核心功能）
export default function FactorMiningModule() {
    // 状态管理
    const [isClient, setIsClient] = useState(false);
    const [miningLoading, setMiningLoading] = useState(false);
    const [miningProgress, setMiningProgress] = useState(0);
    const [miningResult, setMiningResult] = useState<FactorMiningResult | null>(null);
    const [activeTab, setActiveTab] = useState<'mining-setting' | 'mining-result' | 'factor-library'>('mining-setting');
    const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null);
    const [showFactorDetail, setShowFactorDetail] = useState(false);
    const [searchFactor, setSearchFactor] = useState(''); // 因子搜索关键词

    // 挖掘参数默认值（聚焦挖掘逻辑）
    const [miningParams, setMiningParams] = useState<MiningParameter>({
        algorithm: 'pca',
        minImportanceThreshold: 30,
        factorCategories: ['volume', 'price', 'technical'], // 默认挖掘成交量、价格、技术类因子
        dataTimeRange: '3M',
        includeNewFactors: false,
        dataSamplingRate: 'medium'
    });

    // 初始化客户端渲染
    useEffect(() => {
        setIsClient(true);
    }, []);

    // 更新挖掘参数
    const updateMiningParam = (
        key: keyof MiningParameter,
        value: MiningParameter[keyof MiningParameter]
    ) => {
        setMiningParams(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // 切换因子收藏状态
    const toggleFactorCollection = (factorId: string) => {
        if (!miningResult) return;

        setMiningResult(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                minedFactors: prev.minedFactors.map(factor =>
                    factor.id === factorId ? { ...factor, isCollected: !factor.isCollected } : factor
                )
            };
        });
    };

    // 运行因子挖掘
    const runFactorMining = () => {
        setMiningLoading(true);
        setMiningProgress(0);

        // 模拟挖掘进度（分3个阶段：数据准备→因子提取→因子验证）
        const progressSteps = [20, 60, 100];
        const stepInterval = setInterval(() => {
            setMiningProgress(prev => {
                const currentStep = progressSteps.findIndex(step => step > prev);
                if (currentStep === -1) {
                    clearInterval(stepInterval);
                    setMiningLoading(false);
                    // 生成挖掘结果
                    const result = generateFactorMiningResult(miningParams);
                    setMiningResult(result);
                    // 自动切换到挖掘结果页
                    setActiveTab('mining-result');
                    return 100;
                }
                return progressSteps[currentStep];
            });
        }, 800);
    };

    // 查看因子详情
    const viewFactorDetail = (factor: Factor) => {
        setSelectedFactor(factor);
        setShowFactorDetail(true);
    };

    // 导出挖掘的因子列表（仅导出因子基础信息，无分析内容）
    const exportMinedFactors = (format: 'excel' | 'csv') => {
        if (!miningResult || miningResult.minedFactors.length === 0) return;

        setMiningLoading(true);
        setMiningProgress(0);

        // 模拟导出进度
        const exportInterval = setInterval(() => {
            setMiningProgress(prev => {
                if (prev >= 100) {
                    clearInterval(exportInterval);
                    setMiningLoading(false);
                    alert(`因子挖掘结果已成功导出为${format.toUpperCase()}格式，包含${miningResult.minedFactors.length}个因子的基础信息`);
                    return 100;
                }
                return prev + 20;
            });
        }, 300);
    };

    // 获取影响方向样式
    const getImpactBadge = (impact: Factor['impact']) => {
        switch (impact) {
            case 'positive':
                return (
                    <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        正向
                    </Badge>
                );
            case 'negative':
                return (
                    <Badge className="bg-red-500 hover:bg-red-600 flex items-center gap-1">
                        <ArrowDownRight className="h-3 w-3" />
                        负向
                    </Badge>
                );
            default:
                return <Badge className="bg-gray-500 hover:bg-gray-600">中性</Badge>;
        }
    };

    // 获取重要性等级样式
    const getImportanceBadge = (importance: number) => {
        if (importance >= 70) {
            return <Badge className="bg-red-500">高重要性</Badge>;
        } else if (importance >= 50) {
            return <Badge className="bg-amber-500">中高重要性</Badge>;
        } else if (importance >= 30) {
            return <Badge className="bg-blue-500">中重要性</Badge>;
        } else {
            return <Badge className="bg-gray-500">低重要性</Badge>;
        }
    };

    // 获取采样率描述
    const getSamplingRateDesc = (rate: MiningParameter['dataSamplingRate']) => {
        const descMap = {
            'high': '高（数据精度高，挖掘耗时较长）',
            'medium': '中（平衡精度与速度，推荐）',
            'low': '低（数据精度较低，挖掘速度快，适合快速预览）'
        };
        return descMap[rate];
    };

    // 筛选因子（搜索+收藏筛选）
    const getFilteredFactors = () => {
        if (!miningResult) return [];

        return miningResult.minedFactors.filter(factor => {
            // 搜索筛选（名称/描述匹配）
            const matchesSearch = searchFactor
                ? factor.name.toLowerCase().includes(searchFactor.toLowerCase())
                || factor.description.toLowerCase().includes(searchFactor.toLowerCase())
                : true;

            return matchesSearch;
        });
    };

    // 确保客户端渲染
    if (!isClient) {
        return <div className="min-h-[600px]"></div>;
    }

    return (
        <div className="space-y-6">
            {/* 页面标题与操作区 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BrainCircuit className="h-6 w-6 text-indigo-600" />
                        股票因子挖掘
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        从多维度因子库中筛选、提取高价值因子，支持自定义挖掘规则
                    </p>
                </div>

                <div className="flex gap-3">
                    {/* 导出按钮（仅挖掘结果存在时显示） */}
                    {miningResult && miningResult.minedFactors.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary" disabled={miningLoading}>
                                    <Download className="mr-2 h-4 w-4" />
                                    导出因子
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => exportMinedFactors('excel')}>
                                    Excel格式（含完整字段）
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportMinedFactors('csv')}>
                                    CSV格式（简化字段）
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* 挖掘按钮 */}
                    <Button
                        onClick={miningLoading ? undefined : runFactorMining}
                        disabled={miningLoading}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        {miningLoading ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                挖掘中...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                开始因子挖掘
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* 挖掘进度提示（仅挖掘中显示） */}
            {miningLoading && (
                <Card className="p-6">
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-medium mb-3">因子挖掘中</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            {miningProgress < 20 ? '正在准备数据源...' :
                                miningProgress < 60 ? '正在提取候选因子...' : '正在验证因子有效性...'}
                        </p>
                        <Progress value={miningProgress} className="h-2.5 w-full max-w-2xl mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">{miningProgress}% 完成</p>
                    </div>

                    {/* 挖掘阶段进度可视化 */}
                    <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto">
                        <Card className={`p-4 ${miningProgress >= 20 ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${miningProgress >= 20 ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                    <Layers className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium">数据准备</h4>
                                    <p className="text-sm text-gray-500">加载目标类别数据</p>
                                </div>
                            </div>
                        </Card>
                        <Card className={`p-4 ${miningProgress >= 60 ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${miningProgress >= 60 ? 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                    <Filter className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium">因子提取</h4>
                                    <p className="text-sm text-gray-500">算法筛选候选因子</p>
                                </div>
                            </div>
                        </Card>
                        <Card className={`p-4 ${miningProgress >= 100 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${miningProgress >= 100 ? 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <h4 className="font-medium">因子验证</h4>
                                    <p className="text-sm text-gray-500">验证因子有效性</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Card>
            )}

            {/* 主体内容：挖掘设置 + 挖掘结果 + 因子库 */}
            {!miningLoading && (
                <Tabs value={activeTab} onValueChange={value => setActiveTab(value as typeof activeTab)} className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="mining-setting">挖掘参数设置</TabsTrigger>
                        <TabsTrigger value="mining-result" disabled={!miningResult || miningResult.minedFactors.length === 0}>
                            挖掘结果
                            {miningResult && miningResult.minedFactors.length > 0 && (
                                <Badge className="ml-2 bg-indigo-500">{miningResult.minedFactors.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="factor-library" disabled={!miningResult}>已挖掘因子库</TabsTrigger>
                    </TabsList>

                    {/* 1. 挖掘参数设置标签页 */}
                    <TabsContent value="mining-setting" className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-medium mb-6">基础挖掘参数</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 左侧：算法与阈值设置 */}
                                <div className="space-y-4">
                                    {/* 挖掘算法选择 */}
                                    <div>
                                        <Label htmlFor="mining-algorithm" className="text-base mb-2 block">
                                            因子挖掘算法
                                        </Label>
                                        <Select
                                            value={miningParams.algorithm}
                                            onValueChange={(value: MiningAlgorithmType) => updateMiningParam('algorithm', value)}
                                        >
                                            <SelectTrigger id="mining-algorithm">
                                                <SelectValue placeholder="选择挖掘算法" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(MiningAlgorithmMap).map(([value, label]) => (
                                                    <SelectItem key={value} value={value as MiningAlgorithmType}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-gray-500 mt-1">
                                            不同算法适用于不同场景：PCA适合降维，随机森林适合非线性因子挖掘
                                        </p>
                                    </div>

                                    {/* 最小重要性阈值 */}
                                    <div>
                                        <Label className="text-base mb-2 block">
                                            最小因子重要性阈值 ({miningParams.minImportanceThreshold}%)
                                        </Label>
                                        <Slider
                                            value={[miningParams.minImportanceThreshold]}
                                            min={10}
                                            max={90}
                                            step={5}
                                            onValueChange={(value: number[]) => updateMiningParam('minImportanceThreshold', value[0])}
                                            className="mb-2"
                                        />
                                        <p className="text-sm text-gray-500">
                                            低于此阈值的因子将被过滤，阈值越高，挖掘结果越精简
                                        </p>
                                    </div>

                                    {/* 数据时间范围 */}
                                    <div>
                                        <Label htmlFor="data-time-range" className="text-base mb-2 block">
                                            挖掘数据时间范围
                                        </Label>
                                        <Select
                                            value={miningParams.dataTimeRange}
                                            onValueChange={(value: MiningParameter['dataTimeRange']) => updateMiningParam('dataTimeRange', value)}
                                        >
                                            <SelectTrigger id="data-time-range">
                                                <SelectValue placeholder="选择时间范围" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1M">最近1个月</SelectItem>
                                                <SelectItem value="3M">最近3个月</SelectItem>
                                                <SelectItem value="6M">最近6个月</SelectItem>
                                                <SelectItem value="1Y">最近1年</SelectItem>
                                                <SelectItem value="2Y">最近2年</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-gray-500 mt-1">
                                            时间范围越长，因子稳定性评估越准确，但挖掘耗时增加
                                        </p>
                                    </div>
                                </div>

                                {/* 右侧：数据与类别设置 */}
                                <div className="space-y-4">
                                    {/* 因子类别选择 */}
                                    <div>
                                        <Label className="text-base mb-2 block">
                                            待挖掘因子类别（{miningParams.factorCategories.length}个已选择）
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2">
                                            {FactorCategoryOptions.map(({ value, label }) => (
                                                <div key={value} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`category-${value}`}
                                                        checked={miningParams.factorCategories.includes(value)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                updateMiningParam('factorCategories', [...miningParams.factorCategories, value]);
                                                            } else {
                                                                updateMiningParam(
                                                                    'factorCategories',
                                                                    miningParams.factorCategories.filter(cat => cat !== value)
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor={`category-${value}`} className="text-sm">
                                                        {label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                            选择需要挖掘的因子类别，建议每次选择3-5个类别以平衡效率
                                        </p>
                                    </div>

                                    {/* 数据采样率 */}
                                    <div>
                                        <Label htmlFor="data-sampling-rate" className="text-base mb-2 block">
                                            数据采样率
                                        </Label>
                                        <Select
                                            value={miningParams.dataSamplingRate}
                                            onValueChange={(value: MiningParameter['dataSamplingRate']) => updateMiningParam('dataSamplingRate', value)}
                                        >
                                            <SelectTrigger id="data-sampling-rate">
                                                <SelectValue placeholder="选择采样率" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high">高采样率</SelectItem>
                                                <SelectItem value="medium">中采样率（推荐）</SelectItem>
                                                <SelectItem value="low">低采样率</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {getSamplingRateDesc(miningParams.dataSamplingRate)}
                                        </p>
                                    </div>

                                    {/* 是否包含新因子 */}
                                    <div className="pt-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <Label htmlFor="include-new-factors" className="text-base">
                                                包含未验证新因子
                                            </Label>
                                            <Switch
                                                id="include-new-factors"
                                                checked={miningParams.includeNewFactors}
                                                onCheckedChange={(checked: boolean) =>
                                                    updateMiningParam('includeNewFactors', checked)
                                                }
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            开启后将包含未经过长期验证的新因子，可能存在较高不确定性
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 挖掘提示 */}
                            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-amber-800 dark:text-amber-300">
                                        提示：挖掘参数建议：① 初次探索时选择中采样率+3个月数据；② 精准挖掘时选择高采样率+1年数据；
                                        ③ 避免同时选择超过5个因子类别，以免影响挖掘效率。
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* 挖掘操作区 */}
                        <Card className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-medium">开始挖掘</h3>
                                    <p className="text-gray-500">
                                        当前配置：{MiningAlgorithmMap[miningParams.algorithm]} |
                                        {miningParams.factorCategories.length}个类别 |
                                        {miningParams.dataTimeRange}数据
                                    </p>
                                </div>
                                <Button
                                    onClick={runFactorMining}
                                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <Zap className="mr-2 h-4 w-4" />
                                    启动因子挖掘
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* 2. 挖掘结果标签页 */}
                    <TabsContent value="mining-result" className="space-y-6">
                        {miningResult && (
                            <>
                                {/* 挖掘结果概览 */}
                                <Card className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                        <Card className="p-4 bg-indigo-50 dark:bg-indigo-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">挖掘出的因子数</h4>
                                            <p className="text-2xl font-bold">{miningResult.minedFactors.length}</p>
                                        </Card>
                                        <Card className="p-4 bg-green-50 dark:bg-green-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">总扫描因子数</h4>
                                            <p className="text-2xl font-bold">{miningResult.totalScannedFactors}</p>
                                        </Card>
                                        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">有效因子率</h4>
                                            <p className="text-2xl font-bold">{miningResult.validFactorRate}%</p>
                                        </Card>
                                        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">挖掘耗时</h4>
                                            <p className="text-2xl font-bold">{miningResult.miningTime}s</p>
                                        </Card>
                                    </div>

                                    <Separator className="my-6" />

                                    {/* 挖掘参数摘要 */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-medium mb-4">本次挖掘参数</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">挖掘算法</span>
                                                <span className="font-medium">{MiningAlgorithmMap[miningResult.miningParameters.algorithm]}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">因子类别</span>
                                                <span className="font-medium">
                                                    {miningResult.miningParameters.factorCategories.map(cat => FactorCategoryMap[cat]).join('、')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">数据时间范围</span>
                                                <span className="font-medium">{miningResult.miningParameters.dataTimeRange}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">最小重要性阈值</span>
                                                <span className="font-medium">{miningResult.miningParameters.minImportanceThreshold}%</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">数据采样率</span>
                                                <span className="font-medium">{miningResult.miningParameters.dataSamplingRate === 'high' ? '高' : miningResult.miningParameters.dataSamplingRate === 'medium' ? '中' : '低'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">包含新因子</span>
                                                <span className="font-medium">{miningResult.miningParameters.includeNewFactors ? '是' : '否'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator className="my-6" />

                                    {/* 因子搜索与筛选 */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <h3 className="text-lg font-medium">挖掘因子列表</h3>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            <Input
                                                placeholder="搜索因子（名称/描述）"
                                                value={searchFactor}
                                                onChange={(e) => setSearchFactor(e.target.value)}
                                                className="w-full sm:w-64"
                                            />
                                        </div>
                                    </div>

                                    {/* 因子列表 */}
                                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                        {getFilteredFactors().length > 0 ? (
                                            getFilteredFactors().map((factor, index) => (
                                                <Card
                                                    key={factor.id}
                                                    className="p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-indigo-500"
                                                    onClick={() => viewFactorDetail(factor)}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        {/* 因子基础信息 */}
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium">
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="font-medium">{factor.name}</h4>
                                                                    {getImportanceBadge(factor.importance)}
                                                                </div>
                                                                <p className="text-sm text-gray-500 line-clamp-1">{factor.description}</p>
                                                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                                    <span>数据源：{factor.dataSource}</span>
                                                                    <span>更新：{UpdateFrequencyMap[factor.updateFrequency]}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* 因子属性 */}
                                                        <div className="flex flex-wrap items-center gap-3">
                                                            {getImpactBadge(factor.impact)}
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-sm font-medium">{factor.importance}%</span>
                                                                <span className="text-xs text-gray-500">重要性</span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleFactorCollection(factor.id);
                                                                }}
                                                            >
                                                                {factor.isCollected ? (
                                                                    <Star className="h-4 w-4 text-amber-500" />
                                                                ) : (
                                                                    <StarOff className="h-4 w-4 text-gray-400" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="text-center py-10">
                                                <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                                    <Filter className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <h4 className="text-lg font-medium mb-2">未找到匹配因子</h4>
                                                <p className="text-gray-500">
                                                    {searchFactor ? '请尝试调整搜索关键词' : '本次挖掘未产出因子，请调整挖掘参数重试'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    {/* 3. 已挖掘因子库标签页（简化版，仅展示已挖掘因子） */}
                    <TabsContent value="factor-library" className="space-y-6">
                        {miningResult && (
                            <Card className="p-6">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                    <h3 className="text-lg font-medium">已挖掘因子库</h3>
                                    <p className="text-gray-500">
                                        累计挖掘：{miningResult.minedFactors.length}个因子 |
                                        已收藏：{miningResult.minedFactors.filter(f => f.isCollected).length}个因子
                                    </p>
                                </div>

                                {/* 因子分类筛选 */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setSearchFactor('')}
                                    >
                                        全部因子
                                    </Button>
                                    {FactorCategoryOptions.map(({ value, label }) => (
                                        <Button
                                            key={value}
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => setSearchFactor(FactorCategoryMap[value])}
                                        >
                                            {label}
                                        </Button>
                                    ))}
                                </div>

                                {/* 因子库列表 */}
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {getFilteredFactors().length > 0 ? (
                                        getFilteredFactors().map((factor, index) => (
                                            <Card
                                                key={factor.id}
                                                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() => viewFactorDetail(factor)}
                                            >
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 mr-2"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFactorCollection(factor.id);
                                                            }}
                                                        >
                                                            {factor.isCollected ? (
                                                                <Star className="h-4 w-4 text-amber-500" />
                                                            ) : (
                                                                <StarOff className="h-4 w-4 text-gray-400" />
                                                            )}
                                                        </Button>
                                                        <div>
                                                            <h4 className="font-medium">{factor.name}</h4>
                                                            <p className="text-sm text-gray-500 line-clamp-1">{factor.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        {getImpactBadge(factor.impact)}
                                                        {getImportanceBadge(factor.importance)}
                                                        <span className="text-xs text-gray-500">更新：{UpdateFrequencyMap[factor.updateFrequency]}</span>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="text-center py-10">
                                            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                                <Layers className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h4 className="text-lg font-medium mb-2">因子库为空</h4>
                                            <p className="text-gray-500">请先进行因子挖掘，挖掘结果将自动存入因子库</p>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            )}

            {/* 因子详情对话框 */}
            <Dialog open={showFactorDetail} onOpenChange={setShowFactorDetail}>
                {selectedFactor && (
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-5 w-5 text-indigo-600" />
                                    因子详情：{selectedFactor.name}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleFactorCollection(selectedFactor.id)}
                                >
                                    {selectedFactor.isCollected ? (
                                        <Star className="h-4 w-4 text-amber-500" />
                                    ) : (
                                        <StarOff className="h-4 w-4 text-gray-400" />
                                    )}
                                </Button>
                            </DialogTitle>
                            <DialogDescription>
                                因子基础属性、数据来源及历史趋势
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 py-2">
                            {/* 1. 因子基础信息 */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">因子描述</h4>
                                <p className="text-base">{selectedFactor.description}</p>
                            </div>

                            {/* 2. 因子核心属性 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Card className="p-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">重要性评分</h4>
                                    <div className="flex items-end justify-between mb-2">
                                        <p className="text-2xl font-bold">{selectedFactor.importance}%</p>
                                        {getImportanceBadge(selectedFactor.importance)}
                                    </div>
                                    <Progress value={selectedFactor.importance} className="h-2" />
                                </Card>

                                <Card className="p-4">
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">影响方向</h4>
                                    <div className="flex items-center gap-2 mb-3">
                                        {getImpactBadge(selectedFactor.impact)}
                                    </div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">数据更新频率</h4>
                                    <p className="text-base">{UpdateFrequencyMap[selectedFactor.updateFrequency]}</p>
                                </Card>
                            </div>

                            {/* 3. 数据来源信息 */}
                            <Card className="p-4">
                                <h4 className="text-sm font-medium text-gray-500 mb-2">数据来源</h4>
                                <p className="text-base mb-3">{selectedFactor.dataSource}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Info className="h-4 w-4" />
                                    <span>数据质量评级：{selectedFactor.importance > 60 ? 'A（高可靠）' : selectedFactor.importance > 40 ? 'B（中可靠）' : 'C（基础可靠）'}</span>
                                </div>
                            </Card>

                            {/* 4. 历史重要性趋势 */}
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-3">重要性历史趋势（近6个月）</h4>
                                <Card className="p-4">
                                    <div className="space-y-3">
                                        {selectedFactor.historicalTrend.map((item, index) => (
                                            <div key={index}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>{item.period}</span>
                                                    <span className="font-medium">{item.value}%</span>
                                                </div>
                                                <Progress value={Math.min(100, Math.max(0, item.value))} className="h-2" />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={() => setShowFactorDetail(false)}>关闭</Button>
                            <Button variant="secondary" onClick={() => exportMinedFactors('excel')}>
                                <Download className="mr-2 h-4 w-4" />
                                导出该因子详情
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}