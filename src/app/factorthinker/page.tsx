"use client";

import { useState, useEffect, useRef } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Cell,
    Tooltip as RechartsTooltip,
    ScatterChart as RechartsScatterChart,
    Scatter as RechartsScatter,
    LabelProps
} from "recharts";
import {
    Zap,
    Download,
    RefreshCw,
    Settings,
    Save,
    ChevronDown,
    Info,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
    CheckCircle,
    BarChart3,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon,
    TrendingUp,
    Filter,
    FileText,
    HelpCircle,
    Plus,
    Minus,
    RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider as UISlider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {PieLabelProps} from "recharts/types/polar/Pie";

// 固定种子随机数生成器，确保一致性
const createRandomGenerator = (seed: number) => {
    return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
};

const seed = 78945;
const random = createRandomGenerator(seed);

// 定义核心类型
type RegressionType = "linear" | "logistic" | "ridge" | "lasso";
type SignificanceLevel = 90 | 95 | 99;
type TargetMetric = "priceChange" | "volatility" | "returnRate" | "tradingVolume";

interface Factor {
    id: string;
    name: string;
    description: string;
    isSelected: boolean;
    weight: number; // 因子权重
    pValue: number; // 显著性P值
    contribution: number; // 贡献度
    impactDirection: "positive" | "negative";
    historicalData: {
        date: string;
        value: number;
        targetValue: number;
    }[];
}

interface AnalysisParameters {
    targetMetric: TargetMetric;
    regressionType: RegressionType;
    significanceLevel: SignificanceLevel;
    includeInteractionTerms: boolean;
    timePeriod: {
        start: string;
        end: string;
    };
    selectedFactors: string[];
}

interface ModelPerformance {
    rSquared: number;
    adjustedRSquared: number;
    rmse: number;
    mae: number;
    pValue: number;
}

interface SensitivityItem {
    factorId: string;
    factorName: string;
    sensitivity: number; // 敏感度值
}

interface PredictionAccuracy {
    period: string;
    actual: number;
    predicted: number;
}

interface AnalysisResult {
    parameters: AnalysisParameters;
    factors: Factor[];
    modelPerformance: ModelPerformance;
    sensitivityAnalysis: SensitivityItem[];
    predictionAccuracy: PredictionAccuracy[];
    processingTime: number;
}

// 生成示例因子数据
const generateFactorData = (): Factor[] => {
    const factorNames = [
        "成交量波动率",
        "市场情绪指数",
        "市盈率变化率",
        "行业景气度",
        "宏观经济指标",
        "资金流向",
        "技术面指标",
        "流动性指标",
        "市值规模",
        "历史收益率",
    ];

    const descriptions = [
        "反映股票交易活跃度的波动情况，高波动率通常意味着市场关注度高",
        "综合市场新闻、社交媒体情绪分析得出的投资者情绪指标",
        "市盈率的变化速率，反映市场估值变化趋势",
        "所属行业的整体景气程度和发展前景",
        "包括利率、通胀率等宏观经济因素对股票的影响",
        "大单资金流入流出情况，反映机构投资者行为",
        "基于移动平均线、RSI等技术指标的综合评分",
        "衡量股票买卖价差和成交速度的指标",
        "公司市值规模与市场表现的相关性",
        "过去一段时间内的收益率表现对当前价格的影响",
    ];

    const factors: Factor[] = [];
    const factorRandom = createRandomGenerator(seed + 100);

    factorNames.forEach((name, index) => {
        // 生成权重 (-1到1之间)
        const weight = parseFloat((factorRandom() * 2 - 1).toFixed(3));
        // 生成P值 (0到1之间)
        const pValue = parseFloat((factorRandom() * 0.2).toFixed(4));
        // 生成贡献度 (0到100之间)
        const contribution = parseFloat((Math.abs(weight) * 50 + factorRandom() * 20).toFixed(1));

        // 生成历史数据 (最近12个月)
        const historicalData: { date: string; value: number; targetValue: number }[] = [];
        const baseValue = weight > 0 ? 50 + weight * 30 : 50 + weight * -30;
        const targetBase = 100;

        for (let i = 11; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthYear = `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;

            // 因子值带有一定趋势
            const trend = (11 - i) * (weight > 0 ? 0.5 : -0.5);
            const factorValue = parseFloat((baseValue + trend + (factorRandom() * 10 - 5)).toFixed(2));

            // 目标值与因子值有相关性
            const targetValue = parseFloat(
                (targetBase + (factorValue - baseValue) * (weight * 5) + (factorRandom() * 10 - 5)).toFixed(2)
            );

            historicalData.push({
                date: monthYear,
                value: factorValue,
                targetValue: targetValue,
            });
        }

        factors.push({
            id: `factor-${index + 1}`,
            name,
            description: descriptions[index],
            isSelected: index < 6, // 默认选中前6个因子
            weight,
            pValue,
            contribution,
            impactDirection: weight >= 0 ? "positive" : "negative",
            historicalData,
        });
    });

    return factors;
};

// 生成模型性能数据
const generateModelPerformance = (): ModelPerformance => {
    const perfRandom = createRandomGenerator(seed + 200);
    return {
        rSquared: parseFloat((0.5 + perfRandom() * 0.4).toFixed(3)),
        adjustedRSquared: parseFloat((0.45 + perfRandom() * 0.35).toFixed(3)),
        rmse: parseFloat((2 + perfRandom() * 5).toFixed(2)),
        mae: parseFloat((1 + perfRandom() * 3).toFixed(2)),
        pValue: parseFloat((perfRandom() * 0.05).toFixed(4)),
    };
};

// 生成敏感度分析数据
const generateSensitivityAnalysis = (factors: Factor[]): SensitivityItem[] => {
    const sensRandom = createRandomGenerator(seed + 300);
    return factors
        .filter((f) => f.isSelected)
        .map((factor) => ({
            factorId: factor.id,
            factorName: factor.name,
            sensitivity: parseFloat((Math.abs(factor.weight) * 0.5 + sensRandom() * 0.5).toFixed(3)),
        }))
        .sort((a, b) => b.sensitivity - a.sensitivity);
};

// 生成预测准确性数据
const generatePredictionAccuracy = (): PredictionAccuracy[] => {
    const predRandom = createRandomGenerator(seed + 400);
    const data: PredictionAccuracy[] = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;

        const actual = 50 + predRandom() * 50;
        // 预测值与实际值有一定偏差
        const predicted = parseFloat((actual + (predRandom() * 10 - 5)).toFixed(2));

        data.push({ period: monthYear, actual, predicted });
    }

    return data;
};

// 生成分析结果
const generateAnalysisResult = (params: AnalysisParameters, factors: Factor[]): AnalysisResult => {
    // 根据选择的因子过滤
    const selectedFactors = factors.filter((f) => params.selectedFactors.includes(f.id));

    return {
        parameters: params,
        factors: selectedFactors,
        modelPerformance: generateModelPerformance(),
        sensitivityAnalysis: generateSensitivityAnalysis(selectedFactors),
        predictionAccuracy: generatePredictionAccuracy(),
        processingTime: parseFloat((3 + random() * 7).toFixed(1)),
    };
};

// 因子分析模块主组件
export default function FactorAnalysisModule() {
    // 状态管理
    const [isClient, setIsClient] = useState(false);
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [activeTab, setActiveTab] = useState<string>("modelSetup");
    const [factors, setFactors] = useState<Factor[]>([]);
    const [customModelName, setCustomModelName] = useState("我的因子模型");

    // 图表悬停提示框引用
    const tooltipRef = useRef<HTMLDivElement>(null);

    // 分析参数状态
    const [analysisParams, setAnalysisParams] = useState<AnalysisParameters>({
        targetMetric: "priceChange",
        regressionType: "linear",
        significanceLevel: 95,
        includeInteractionTerms: false,
        timePeriod: {
            start: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
                .toISOString()
                .split("T")[0],
            end: new Date().toISOString().split("T")[0],
        },
        selectedFactors: [],
    });

    // 初始化数据
    useEffect(() => {
        setIsClient(true);
        const initialFactors = generateFactorData();
        setFactors(initialFactors);
        // 设置默认选中的因子
        setAnalysisParams((prev) => ({
            ...prev,
            selectedFactors: initialFactors.filter((f) => f.isSelected).map((f) => f.id),
        }));
    }, []);

    // 切换因子选择状态
    const toggleFactorSelection = (factorId: string) => {
        setFactors((prevFactors) =>
            prevFactors.map((factor) =>
                factor.id === factorId ? { ...factor, isSelected: !factor.isSelected } : factor
            )
        );

        setAnalysisParams((prevParams) => {
            const isSelected = prevParams.selectedFactors.includes(factorId);
            return {
                ...prevParams,
                selectedFactors: isSelected
                    ? prevParams.selectedFactors.filter((id) => id !== factorId)
                    : [...prevParams.selectedFactors, factorId],
            };
        });
    };

    // 更新分析参数（显式类型声明，避免implicit any）
    const updateAnalysisParam = <K extends keyof AnalysisParameters>(
        key: K,
        value: AnalysisParameters[K]
    ) => {
        setAnalysisParams((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    // 运行因子分析
    const runFactorAnalysis = () => {
        if (analysisParams.selectedFactors.length === 0) {
            alert("请至少选择一个因子进行分析");
            return;
        }

        setAnalysisLoading(true);
        setProgress(0);

        // 模拟分析进度
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setAnalysisLoading(false);
                    // 生成并设置分析结果
                    const result = generateAnalysisResult(analysisParams, factors);
                    setAnalysisResult(result);
                    // 自动切换到结果标签页
                    setActiveTab("factorWeights");
                    return 100;
                }
                return prev + 5;
            });
        }, 150);
    };

    // 导出分析报告
    const exportReport = (format: "pdf" | "excel" | "ppt") => {
        if (!analysisResult) return;

        setAnalysisLoading(true);
        setProgress(0);

        // 模拟导出进度
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setAnalysisLoading(false);
                    alert(`因子分析报告已成功导出为${format.toUpperCase()}格式`);
                    return 100;
                }
                return prev + 10;
            });
        }, 150);
    };

    // 保存当前模型
    const saveCurrentModel = () => {
        if (!customModelName.trim()) {
            alert("请输入模型名称");
            return;
        }

        alert(`模型"${customModelName}"已保存`);
    };

    // 获取目标指标名称
    const getTargetMetricName = (metric: TargetMetric) => {
        const names: Record<TargetMetric, string> = {
            priceChange: "价格变动",
            volatility: "波动率",
            returnRate: "收益率",
            tradingVolume: "交易量",
        };
        return names[metric];
    };

    // 获取回归分析方法名称
    const getRegressionTypeName = (type: RegressionType) => {
        const names: Record<RegressionType, string> = {
            linear: "线性回归",
            logistic: "逻辑回归",
            ridge: "岭回归",
            lasso: "Lasso回归",
        };
        return names[type];
    };

    // 获取因子影响的样式
    const getImpactBadge = (impact: string) => {
        switch (impact) {
            case "positive":
                return <Badge className="bg-green-500 hover:bg-green-600">正向影响</Badge>;
            case "negative":
                return <Badge className="bg-red-500 hover:bg-red-600">负向影响</Badge>;
            default:
                return <Badge className="bg-gray-500 hover:bg-gray-600">中性影响</Badge>;
        }
    };

    // 获取显著性水平对应的临界值
    const getSignificanceThreshold = () => {
        switch (analysisParams.significanceLevel) {
            case 90:
                return 0.10;
            case 95:
                return 0.05;
            case 99:
                return 0.01;
            default:
                return 0.05;
        }
    };

    // 判断因子是否显著
    const isFactorSignificant = (pValue: number) => {
        return pValue < getSignificanceThreshold();
    };

    // 获取饼图颜色
    const getPieColors = () => {
        return ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#ec4899", "#14b8a6"];
    };

    // 确保客户端渲染
    if (!isClient) {
        return <div className="min-h-[800px]"></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-emerald-600" />
                        因子分析模块
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        量化评估因子对目标指标的影响程度，支持自定义因子组合与模型验证
                    </p>
                </div>

                <div className="flex gap-3">
                    {analysisResult && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="secondary">
                                    <Download className="mr-2 h-4 w-4" />
                                    导出报告
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => exportReport("pdf")}>PDF格式</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportReport("excel")}>Excel格式</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => exportReport("ppt")}>PowerPoint格式</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {analysisResult && (
                        <Button variant="secondary" onClick={() => setActiveTab("modelSetup")}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            调整模型
                        </Button>
                    )}

                    <Button onClick={analysisLoading ? undefined : runFactorAnalysis} disabled={analysisLoading}>
                        {analysisLoading ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                分析中...
                            </>
                        ) : (
                            <>
                                <Zap className="mr-2 h-4 w-4" />
                                运行因子分析
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* 分析进度 */}
            {analysisLoading && (
                <Card className="p-6">
                    <div className="text-center mb-6">
                        <h3 className="text-lg font-medium mb-3">正在进行因子分析</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">
                            正在计算因子权重与贡献度，生成分析结果...
                        </p>
                        <Progress value={progress} className="h-2.5 w-full max-w-2xl mx-auto" />
                        <p className="text-sm text-gray-500 mt-2">{progress}% 完成</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-800 flex items-center justify-center">
                                    <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium">模型计算</h4>
                                    <p className="text-sm text-gray-500">运行{getRegressionTypeName(analysisParams.regressionType)}</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium">因子权重计算</h4>
                                    <p className="text-sm text-gray-500">评估各因子影响程度</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                                    <LineChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="font-medium">可视化生成</h4>
                                    <p className="text-sm text-gray-500">创建趋势与分析图表</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Card>
            )}

            {!analysisLoading && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-6 flex flex-wrap">
                        <TabsTrigger value="modelSetup">模型设置</TabsTrigger>
                        <TabsTrigger value="factorWeights" disabled={!analysisResult}>
                            因子权重
                        </TabsTrigger>
                        <TabsTrigger value="trendAnalysis" disabled={!analysisResult}>
                            趋势分析
                        </TabsTrigger>
                        <TabsTrigger value="sensitivity" disabled={!analysisResult}>
                            敏感度分析
                        </TabsTrigger>
                        <TabsTrigger value="validation" disabled={!analysisResult}>
                            模型验证
                        </TabsTrigger>
                        <TabsTrigger value="report" disabled={!analysisResult}>
                            分析报告
                        </TabsTrigger>
                    </TabsList>

                    {/* 模型设置标签页 */}
                    <TabsContent value="modelSetup" className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-medium mb-6">模型参数设置</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-5">
                                    <div>
                                        <Label htmlFor="targetMetric" className="text-base mb-2 block">
                                            目标指标
                                        </Label>
                                        <Select
                                            value={analysisParams.targetMetric}
                                            onValueChange={(value: TargetMetric) =>
                                                updateAnalysisParam("targetMetric", value)
                                            }
                                        >
                                            <SelectTrigger id="targetMetric">
                                                <SelectValue placeholder="选择目标指标" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="priceChange">价格变动</SelectItem>
                                                <SelectItem value="volatility">波动率</SelectItem>
                                                <SelectItem value="returnRate">收益率</SelectItem>
                                                <SelectItem value="tradingVolume">交易量</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-gray-500 mt-1">
                                            选择需要分析的目标业务指标
                                        </p>
                                    </div>

                                    <div>
                                        <Label htmlFor="regressionType" className="text-base mb-2 block">
                                            回归分析方法
                                        </Label>
                                        <Select
                                            value={analysisParams.regressionType}
                                            onValueChange={(value: RegressionType) =>
                                                updateAnalysisParam("regressionType", value)
                                            }
                                        >
                                            <SelectTrigger id="regressionType">
                                                <SelectValue placeholder="选择回归方法" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="linear">线性回归</SelectItem>
                                                <SelectItem value="logistic">逻辑回归</SelectItem>
                                                <SelectItem value="ridge">岭回归 (Ridge)</SelectItem>
                                                <SelectItem value="lasso">Lasso回归</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-gray-500 mt-1">
                                            选择用于计算因子影响的回归分析方法
                                        </p>
                                    </div>

                                    <div>
                                        <Label className="text-base mb-2 block">显著性水平</Label>
                                        <RadioGroup
                                            value={analysisParams.significanceLevel.toString()}
                                            onValueChange={(value) =>
                                                updateAnalysisParam(
                                                    "significanceLevel",
                                                    parseInt(value) as SignificanceLevel
                                                )
                                            }
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="90" id="sig-90" />
                                                <Label htmlFor="sig-90">90%</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="95" id="sig-95" />
                                                <Label htmlFor="sig-95">95% (推荐)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="99" id="sig-99" />
                                                <Label htmlFor="sig-99">99%</Label>
                                            </div>
                                        </RadioGroup>
                                        <p className="text-sm text-gray-500 mt-1">
                                            设定因子显著性检验的置信水平
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label htmlFor="interactionTerms" className="text-base">
                                                包含交互项
                                            </Label>
                                            <Switch
                                                id="interactionTerms"
                                                checked={analysisParams.includeInteractionTerms}
                                                onCheckedChange={(checked) =>
                                                    updateAnalysisParam("includeInteractionTerms", checked)
                                                }
                                            />
                                        </div>
                                        <p className="text-sm text-gray-500">
                                            分析因子之间的交互效应，会增加计算复杂度但可能提高精度
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div>
                                        <Label className="text-base mb-2 block">分析时间范围</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="startDate" className="text-sm mb-1 block">
                                                    开始日期
                                                </Label>
                                                <Input
                                                    id="startDate"
                                                    type="date"
                                                    value={analysisParams.timePeriod.start}
                                                    onChange={(e) =>
                                                        updateAnalysisParam("timePeriod", {
                                                            ...analysisParams.timePeriod,
                                                            start: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="endDate" className="text-sm mb-1 block">
                                                    结束日期
                                                </Label>
                                                <Input
                                                    id="endDate"
                                                    type="date"
                                                    value={analysisParams.timePeriod.end}
                                                    onChange={(e) =>
                                                        updateAnalysisParam("timePeriod", {
                                                            ...analysisParams.timePeriod,
                                                            end: e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-base mb-2 block">模型名称</Label>
                                        <Input
                                            value={customModelName}
                                            onChange={(e) => setCustomModelName(e.target.value)}
                                            placeholder="输入模型名称以便保存"
                                        />
                                    </div>

                                    <div className="pt-6">
                                        <Card className="bg-amber-50 dark:bg-amber-900/20 p-4">
                                            <div className="flex items-start gap-3">
                                                <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                                <p className="text-sm text-amber-800 dark:text-amber-300">
                                                    提示：对于高维因子分析，建议使用岭回归或Lasso回归以避免过拟合。包含交互项可以捕捉因子间的协同效应，但会增加模型复杂度。
                                                </p>
                                            </div>
                                        </Card>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <Button onClick={saveCurrentModel} variant="secondary">
                                            <Save className="mr-2 h-4 w-4" />
                                            保存模型设置
                                        </Button>
                                        <Button onClick={runFactorAnalysis} className="flex-1">
                                            <Zap className="mr-2 h-4 w-4" />
                                            运行因子分析
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium">因子选择</h3>
                                <div className="flex gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            const allIds = factors.map((f) => f.id);
                                            setFactors(factors.map((f) => ({ ...f, isSelected: true })));
                                            setAnalysisParams((prev) => ({
                                                ...prev,
                                                selectedFactors: allIds,
                                            }));
                                        }}
                                    >
                                        <Plus className="mr-1 h-3 w-3" />
                                        全选
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => {
                                            setFactors(factors.map((f) => ({ ...f, isSelected: false })));
                                            setAnalysisParams((prev) => ({
                                                ...prev,
                                                selectedFactors: [],
                                            }));
                                        }}
                                    >
                                        <Minus className="mr-1 h-3 w-3" />
                                        全不选
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="h-[400px] rounded-md border p-4">
                                <div className="space-y-4">
                                    {factors.map((factor) => (
                                        <Card
                                            key={factor.id}
                                            className={`p-4 ${
                                                factor.isSelected ? "ring-2 ring-emerald-500 dark:ring-emerald-400" : ""
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 mr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium">{factor.name}</h4>
                                                    </div>
                                                    <p className="text-sm text-gray-500 mb-2">{factor.description}</p>
                                                </div>
                                                <Checkbox
                                                    checked={factor.isSelected}
                                                    onCheckedChange={() => toggleFactorSelection(factor.id)}
                                                    className="mt-1"
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </ScrollArea>

                            <div className="mt-6">
                                <p className="text-sm text-gray-500 mb-4">
                                    已选择 <span className="font-medium">{analysisParams.selectedFactors.length}</span> 个因子
                                </p>
                                <Button onClick={runFactorAnalysis} className="w-full sm:w-auto">
                                    <Zap className="mr-2 h-4 w-4" />
                                    基于所选因子运行分析
                                </Button>
                            </div>
                        </Card>
                    </TabsContent>

                    {/* 因子权重标签页 */}
                    <TabsContent value="factorWeights" className="space-y-6">
                        {analysisResult && (
                            <>
                                <Card className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">模型解释力 (R²)</h4>
                                            <p className="text-2xl font-bold">
                                                {(analysisResult.modelPerformance.rSquared * 100).toFixed(1)}%
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {analysisResult.modelPerformance.rSquared > 0.7
                                                    ? "高解释力"
                                                    : analysisResult.modelPerformance.rSquared > 0.4
                                                        ? "中等解释力"
                                                        : "低解释力"}
                                            </p>
                                        </Card>
                                        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">调整后R²</h4>
                                            <p className="text-2xl font-bold">
                                                {(analysisResult.modelPerformance.adjustedRSquared * 100).toFixed(1)}%
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">修正自由度后的解释力</p>
                                        </Card>
                                        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">均方根误差 (RMSE)</h4>
                                            <p className="text-2xl font-bold">
                                                {analysisResult.modelPerformance.rmse.toFixed(2)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">预测值与实际值的偏差</p>
                                        </Card>
                                        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">模型显著性</h4>
                                            <p className="text-2xl font-bold">
                                                {analysisResult.modelPerformance.pValue < getSignificanceThreshold() ? (
                                                    <span className="text-green-600">显著</span>
                                                ) : (
                                                    <span className="text-red-600">不显著</span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                p值: {analysisResult.modelPerformance.pValue.toFixed(4)}
                                            </p>
                                        </Card>
                                    </div>

                                    <h3 className="text-lg font-medium mb-6">因子权重与贡献度分析</h3>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div>
                                            <h4 className="font-medium mb-4">因子权重与显著性</h4>
                                            <Card className="p-4">
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>因子名称</TableHead>
                                                                <TableHead>权重</TableHead>
                                                                <TableHead>影响方向</TableHead>
                                                                <TableHead>显著性 (p值)</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {analysisResult.factors
                                                                .sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
                                                                .map((factor) => (
                                                                    <TableRow key={factor.id}>
                                                                        <TableCell className="font-medium">{factor.name}</TableCell>
                                                                        <TableCell>{factor.weight.toFixed(3)}</TableCell>
                                                                        <TableCell>{getImpactBadge(factor.impactDirection)}</TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center gap-2">
                                                                                <span>{factor.pValue.toFixed(4)}</span>
                                                                                {isFactorSignificant(factor.pValue) ? (
                                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                                ) : (
                                                                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                                                )}
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </Card>

                                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
                                                <p className="flex items-center gap-2">
                                                    <Info className="h-4 w-4 text-blue-600" />
                                                    <span>
                            因子权重表示该因子对{getTargetMetricName(analysisResult.parameters.targetMetric)}的边际影响，
                            p值小于{getSignificanceThreshold()}表示该因子在统计上显著。
                          </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-medium mb-4">因子贡献度分布</h4>
                                            <Card className="p-4 h-[320px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={analysisResult.factors.map((f) => ({
                                                                name: f.name,
                                                                value: f.contribution,
                                                            }))}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={60}
                                                            outerRadius={90}
                                                            paddingAngle={2}
                                                            dataKey="value"
                                                            // 修复PieLabel类型错误
                                                            label={(props: PieLabelProps) => {
                                                                const { name, percent } = props;
                                                                return percent !== undefined
                                                                    ? `${name}: ${(percent * 100).toFixed(0)}%`
                                                                    : `${name}`;
                                                            }}
                                                            labelLine={false}
                                                        >
                                                            {analysisResult.factors.map((_, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={getPieColors()[index % getPieColors().length]}
                                                                />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip
                                                            // 修复toFixed调用错误
                                                            formatter={(value) => {
                                                                const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                                                                return [`${numValue.toFixed(1)}%`, "贡献度"];
                                                            }}
                                                            contentStyle={{
                                                                borderRadius: "6px",
                                                                border: "none",
                                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Card>
                                            <p className="text-sm text-gray-500 mt-3 text-center">
                                                各因子对{getTargetMetricName(analysisResult.parameters.targetMetric)}的相对贡献度占比
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    {/* 趋势分析标签页 */}
                    <TabsContent value="trendAnalysis" className="space-y-6">
                        {analysisResult && (
                            <>
                                <Card className="p-6">
                                    <h3 className="text-lg font-medium mb-6">因子影响趋势分析</h3>

                                    <div className="mb-6">
                                        <Label htmlFor="factorTrendSelect" className="text-base mb-2 block">
                                            选择因子查看趋势
                                        </Label>
                                        <Select defaultValue={analysisResult.factors[0].id}>
                                            <SelectTrigger id="factorTrendSelect">
                                                <SelectValue placeholder="选择因子" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {analysisResult.factors.map((factor) => (
                                                    <SelectItem key={factor.id} value={factor.id}>
                                                        {factor.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Card className="p-4 mb-8">
                                        <div className="h-[400px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart
                                                    data={analysisResult.factors[0].historicalData}
                                                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="date"
                                                        tick={{ fontSize: 12 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        yAxisId="left"
                                                        tick={{ fontSize: 12 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        yAxisId="right"
                                                        orientation="right"
                                                        tick={{ fontSize: 12 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <RechartsTooltip
                                                        contentStyle={{
                                                            borderRadius: "6px",
                                                            border: "none",
                                                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                        }}
                                                        labelStyle={{ fontWeight: "bold" }}
                                                        formatter={(value) => {
                                                            const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                                                            return [numValue.toFixed(2), '值'];
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Line
                                                        yAxisId="left"
                                                        type="monotone"
                                                        dataKey="value"
                                                        stroke="#0ea5e9"
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                        name={analysisResult.factors[0].name}
                                                    />
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="targetValue"
                                                        stroke="#8b5cf6"
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                        name={getTargetMetricName(analysisResult.parameters.targetMetric)}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Card className="p-4">
                                            <h4 className="font-medium mb-4">因子与目标指标相关性</h4>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RechartsScatterChart
                                                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis
                                                            type="number"
                                                            dataKey="value"
                                                            name={analysisResult.factors[0].name}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            type="number"
                                                            dataKey="targetValue"
                                                            name={getTargetMetricName(analysisResult.parameters.targetMetric)}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <RechartsTooltip
                                                            cursor={{ strokeDasharray: "3 3" }}
                                                            contentStyle={{
                                                                borderRadius: "6px",
                                                                border: "none",
                                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                            }}
                                                            formatter={(value) => {
                                                                const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                                                                return [numValue.toFixed(2), '值'];
                                                            }}
                                                        />
                                                        <RechartsScatter
                                                            name="相关性"
                                                            data={analysisResult.factors[0].historicalData.map((d) => ({
                                                                value: d.value,
                                                                targetValue: d.targetValue,
                                                                date: d.date,
                                                            }))}
                                                            fill="#10b981"
                                                            line={{ stroke: "#10b981", strokeWidth: 2 }}
                                                        >
                                                            {analysisResult.factors[0].historicalData.map((_, index) => (
                                                                <Cell key={`cell-${index}`} fill="#10b981" />
                                                            ))}
                                                        </RechartsScatter>
                                                    </RechartsScatterChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-3 text-center">
                                                散点图显示因子值与目标指标之间的相关性分布
                                            </p>
                                        </Card>

                                        <Card className="p-4">
                                            <h4 className="font-medium mb-4">因子累积贡献度趋势</h4>
                                            <div className="h-[300px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart
                                                        data={analysisResult.factors[0].historicalData}
                                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tick={{ fontSize: 12 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            tick={{ fontSize: 12 }}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <RechartsTooltip
                                                            contentStyle={{
                                                                borderRadius: "6px",
                                                                border: "none",
                                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                            }}
                                                            formatter={(value) => {
                                                                const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                                                                return [numValue.toFixed(2), '值'];
                                                            }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="value"
                                                            stackId="1"
                                                            stroke="#ec4899"
                                                            fill="#ec4899"
                                                            fillOpacity={0.3}
                                                            name="累积贡献度"
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-3 text-center">
                                                因子对目标指标的累积贡献度变化趋势
                                            </p>
                                        </Card>
                                    </div>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    {/* 敏感度分析标签页 */}
                    <TabsContent value="sensitivity" className="space-y-6">
                        {analysisResult && (
                            <>
                                <Card className="p-6">
                                    <h3 className="text-lg font-medium mb-6">因子敏感度分析</h3>
                                    <p className="text-gray-500 mb-6">
                                        敏感度分析衡量因子变化对{getTargetMetricName(analysisResult.parameters.targetMetric)}的影响程度，
                                        值越高表示因子变化对目标指标的影响越大。
                                    </p>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <Card className="p-4">
                                            <h4 className="font-medium mb-4">因子敏感度排序</h4>
                                            <div className="h-[350px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart layout="vertical" data={analysisResult.sensitivityAnalysis}>
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                            horizontal={true}
                                                            vertical={false}
                                                            stroke="#f0f0f0"
                                                        />
                                                        <XAxis type="number" domain={[0, 1]} axisLine={false} tickLine={false} />
                                                        <YAxis
                                                            dataKey="factorName"
                                                            type="category"
                                                            width={120}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 12 }}
                                                        />
                                                        <RechartsTooltip
                                                            formatter={(value) => {
                                                                const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                                                                return [numValue.toFixed(3), "敏感度值"];
                                                            }}
                                                            contentStyle={{
                                                                borderRadius: "6px",
                                                                border: "none",
                                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                            }}
                                                        />
                                                        <Bar
                                                            dataKey="sensitivity"
                                                            fill="#8b5cf6"
                                                            radius={[0, 4, 4, 0]}
                                                        >
                                                            {analysisResult.sensitivityAnalysis.map((_, index) => (
                                                                <Cell
                                                                    key={`cell-${index}`}
                                                                    fill={getPieColors()[index % getPieColors().length]}
                                                                />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>

                                        <div className="space-y-6">
                                            <Card className="p-4">
                                                <h4 className="font-medium mb-4">敏感度区间分析</h4>
                                                <div className="space-y-4">
                                                    {analysisResult.sensitivityAnalysis.slice(0, 3).map((item, index) => (
                                                        <div key={index}>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="font-medium">{item.factorName}</span>
                                                                <span>{item.sensitivity.toFixed(3)}</span>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Progress
                                                                    value={item.sensitivity * 100}
                                                                    className="h-2"
                                                                />
                                                                <div className="flex justify-between text-xs text-gray-500">
                                                                    <span>影响较小</span>
                                                                    <span>影响中等</span>
                                                                    <span>影响较大</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </Card>

                                            <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20">
                                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                                    <Info className="h-4 w-4 text-emerald-600" />
                                                    敏感度分析解读
                                                </h4>
                                                <ul className="text-sm space-y-2 text-gray-700 dark:text-gray-300">
                                                    <li>• 敏感度值范围为0到1，值越高表示因子对目标指标的影响越敏感</li>
                                                    <li>• 敏感度高的因子应重点监控，其微小变化可能导致目标指标显著波动</li>
                                                    <li>• {analysisResult.sensitivityAnalysis[0].factorName}是最敏感的因子，对{getTargetMetricName(analysisResult.parameters.targetMetric)}影响最大</li>
                                                    <li>• 结合因子权重和敏感度分析，可以更全面评估因子重要性</li>
                                                </ul>
                                            </Card>
                                        </div>
                                    </div>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    {/* 模型验证标签页 */}
                    <TabsContent value="validation" className="space-y-6">
                        {analysisResult && (
                            <>
                                <Card className="p-6">
                                    <h3 className="text-lg font-medium mb-6">因子模型有效性验证</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <Card className="p-4 bg-emerald-50 dark:bg-emerald-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">预测准确率</h4>
                                            <p className="text-2xl font-bold">
                                                {(((1 - analysisResult.modelPerformance.rmse / 100) * 100) as number).toFixed(1)}%
                                            </p>
                                        </Card>
                                        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">平均绝对误差</h4>
                                            <p className="text-2xl font-bold">
                                                {analysisResult.modelPerformance.mae.toFixed(2)}
                                            </p>
                                        </Card>
                                        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20">
                                            <h4 className="text-sm font-medium text-gray-500 mb-1">模型稳定性</h4>
                                            <p className="text-2xl font-bold">
                                                {analysisResult.modelPerformance.rSquared > 0.6 ? (
                                                    <span className="text-green-600">稳定</span>
                                                ) : analysisResult.modelPerformance.rSquared > 0.3 ? (
                                                    <span className="text-amber-600">一般</span>
                                                ) : (
                                                    <span className="text-red-600">不稳定</span>
                                                )}
                                            </p>
                                        </Card>
                                    </div>

                                    <Card className="p-4 mb-8">
                                        <h4 className="font-medium mb-4">预测值与实际值对比</h4>
                                        <div className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart
                                                    data={analysisResult.predictionAccuracy}
                                                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                    <XAxis
                                                        dataKey="period"
                                                        tick={{ fontSize: 12 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 12 }}
                                                        axisLine={false}
                                                        tickLine={false}
                                                    />
                                                    <RechartsTooltip
                                                        contentStyle={{
                                                            borderRadius: "6px",
                                                            border: "none",
                                                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                                        }}
                                                        labelStyle={{ fontWeight: "bold" }}
                                                        formatter={(value) => {
                                                            const numValue = typeof value === 'number' ? value : parseFloat(value as string);
                                                            return [numValue.toFixed(2), '值'];
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="actual"
                                                        stroke="#10b981"
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                        name="实际值"
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="predicted"
                                                        stroke="#ef4444"
                                                        strokeWidth={2}
                                                        dot={{ r: 4 }}
                                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                                        name="预测值"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </Card>

                                    <Card className="p-6 bg-amber-50 dark:bg-amber-900/20">
                                        <h4 className="font-medium mb-4 flex items-center gap-2">
                                            <Settings className="h-5 w-5 text-amber-600" />
                                            模型优化建议
                                        </h4>
                                        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                                            <li className="flex items-start gap-3">
                                                <ArrowUpRight className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                                <p>
                                                    {analysisResult.modelPerformance.rSquared < 0.6
                                                        ? "当前模型解释力一般，建议增加以下因子以提高模型性能："
                                                        : "模型表现良好，可考虑添加以下因子进一步提升精度："}
                                                    {["市场流动性指标", "行业相对强度", "宏观经济预期"].join("、")}
                                                </p>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <ArrowUpRight className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                                <p>
                                                    {analysisResult.factors.some((f) => !isFactorSignificant(f.pValue))
                                                        ? "部分因子不显著，建议移除"
                                                        : "所有因子均显著，无需移除"}
                                                    {analysisResult.factors
                                                        .filter((f) => !isFactorSignificant(f.pValue))
                                                        .map((f) => f.name)
                                                        .join("、") || ""}
                                                </p>
                                            </li>
                                            <li className="flex items-start gap-3">
                                                <ArrowUpRight className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                                <p>
                                                    考虑使用{analysisParams.regressionType !== "ridge" ? "岭回归" : "Lasso回归"}进行对比分析，可能获得更好的泛化能力
                                                </p>
                                            </li>
                                        </ul>
                                    </Card>
                                </Card>
                            </>
                        )}
                    </TabsContent>

                    {/* 分析报告标签页 */}
                    <TabsContent value="report" className="space-y-6">
                        {analysisResult && (
                            <Card className="p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-lg font-medium">因子分析报告</h3>
                                        <p className="text-sm text-gray-500">
                                            生成时间: {new Date().toLocaleString()} | 模型: {customModelName}
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button variant="secondary" onClick={() => exportReport("pdf")}>
                                            <Download className="mr-2 h-4 w-4" />
                                            PDF报告
                                        </Button>
                                        <Button variant="secondary" onClick={() => exportReport("excel")}>
                                            <Download className="mr-2 h-4 w-4" />
                                            数据表格
                                        </Button>
                                        <Button variant="secondary" onClick={() => exportReport("ppt")}>
                                            <Download className="mr-2 h-4 w-4" />
                                            演示文稿
                                        </Button>
                                    </div>
                                </div>

                                <div className="prose dark:prose-invert max-w-none">
                                    <h2>执行摘要</h2>
                                    <p>
                                        本次因子分析使用{getRegressionTypeName(analysisResult.parameters.regressionType)}方法，
                                        评估了{analysisResult.factors.length}个因子对{getTargetMetricName(analysisResult.parameters.targetMetric)}的影响。
                                        模型解释力(R²)为{(analysisResult.modelPerformance.rSquared * 100).toFixed(1)}%，
                                        表明所选因子能够解释{getTargetMetricName(analysisResult.parameters.targetMetric)}的{(analysisResult.modelPerformance.rSquared * 100).toFixed(1)}%变异。
                                    </p>

                                    <h2>关键发现</h2>
                                    <ul>
                                        <li>
                                            最重要的影响因子是<span className="font-medium">{analysisResult.factors[0].name}</span>，
                                            权重为{analysisResult.factors[0].weight.toFixed(3)}，呈现{
                                            analysisResult.factors[0].impactDirection === "positive"
                                                ? "正向"
                                                : "负向"
                                        }影响，且在{analysisResult.parameters.significanceLevel}%置信水平下显著。
                                        </li>
                                        <li>
                                            因子敏感度分析显示，{analysisResult.sensitivityAnalysis[0].factorName}
                                            是最敏感的因子，敏感度值为{analysisResult.sensitivityAnalysis[0].sensitivity.toFixed(3)}，
                                            其变化对{getTargetMetricName(analysisResult.parameters.targetMetric)}影响最大。
                                        </li>
                                        <li>
                                            模型预测准确率为{(((1 - analysisResult.modelPerformance.rmse / 100) * 100) as number).toFixed(1)}%，
                                            平均绝对误差为{analysisResult.modelPerformance.mae.toFixed(2)}。
                                        </li>
                                        <li>
                                            {analysisResult.factors.filter((f) => !isFactorSignificant(f.pValue)).length > 0
                                                ? `有${analysisResult.factors.filter((f) => !isFactorSignificant(f.pValue)).length}个因子在统计上不显著，建议移除。`
                                                : "所有纳入模型的因子在统计上均显著。"}
                                        </li>
                                    </ul>

                                    <h2>建议行动</h2>
                                    <ol>
                                        <li>
                                            重点监控{analysisResult.sensitivityAnalysis[0].factorName}和{analysisResult.sensitivityAnalysis[1].factorName}的变化，
                                            它们对{getTargetMetricName(analysisResult.parameters.targetMetric)}的影响最为敏感。
                                        </li>
                                        <li>
                                            {analysisResult.modelPerformance.rSquared < 0.6
                                                ? "考虑增加推荐的补充因子以提高模型解释力和预测精度。"
                                                : "模型表现良好，可维持当前因子组合，但需定期验证。"}
                                        </li>
                                        <li>
                                            建议使用不同的回归方法（如{analysisParams.regressionType !== "ridge" ? "岭回归" : "Lasso回归"}）进行交叉验证，
                                            以确保模型的稳健性。
                                        </li>
                                        <li>
                                            定期（建议每季度）重新运行因子分析，以捕捉市场动态变化和因子重要性的迁移。
                                        </li>
                                    </ol>
                                </div>

                                <div className="mt-8">
                                    <Button className="w-full sm:w-auto" onClick={() => exportReport("pdf")}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        生成完整分析报告
                                    </Button>
                                </div>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}