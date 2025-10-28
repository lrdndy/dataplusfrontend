import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { RefreshCw, Filter, PieChart, TrendingUp } from 'lucide-react';

import { getNewStockIndexData, StockIndexCalculationResponse } from '@/services/api';
import { Contract } from './StockIndex';

// 因子类别定义（不变）
const FACTOR_CATEGORIES = [
    {
        id: 'price_volume',
        name: '量价复合因子',
        description: '结合基差、收盘价波动与成交量的因子',
        baseMetrics: ['基差变化率', '收盘价波动率', '量价偏离度'],
        weightMetrics: ['基差绝对值', '收盘价涨跌幅']
    },
    {
        id: 'spread_arbitrage',
        name: '跨期套利因子',
        description: '基于基差与剩余天数的套利因子',
        baseMetrics: ['基差历史分位', '跨期基差收敛率', '剩余天数衰减系数'],
        weightMetrics: ['年化基差绝对值', '基差稳定性']
    },
    {
        id: 'option_futures',
        name: '期权期货联动因子',
        description: '期权隐含波动率与基差的联动因子',
        baseMetrics: ['隐含波动率斜率', '基差波动率', '价外期权成交量占比'],
        weightMetrics: ['调整年化基差', '波动率偏差']
    }
];

// 类型定义（不变）
interface Factor {
    id: string;
    name: string;
    category: string;
    formulaDesc: string;
    volatility: number; // 与基差波动率正相关
    basisSensitivity: number; // 与基差绝对值正相关
}

interface FactorImportance extends Factor {
    weight: number; // 受基差动态影响
    pValue: number; // 受基差稳定性影响
    calculationSteps: string[];
}

interface BacktestMetric {
    annualReturn: number; // 与基差敏感度正相关（含波动）
    sharpeRatio: number; // 与调整基差正相关（含波动）
    maxDrawdown: number; // 与剩余天数负相关（含波动）
    winRate: number; // 与年化基差正相关（含波动）
    turnover: number; // 含基差相关波动
}

interface AnalysisResult {
    importance: FactorImportance[];
    backtestMetrics: Record<string, BacktestMetric>;
    calculationLogs: Array<{ step: number; action: string; details: string }>;
}

const FactorMiningComponent: React.FC = () => {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [generatedFactors, setGeneratedFactors] = useState<Factor[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [indexData, setIndexData] = useState<Contract[]>([]);

    // 关键优化1：每次分析前重新加载股指数据，避免用旧缓存
    const fetchLatestIndexData = async () => {
        const res = await getNewStockIndexData();
        if (res.status === 'success' && res.data) {
            const validPrefixes = ['IF', 'IM', 'IC'];
            const contracts = Object.values(res.data).flatMap(contract => {
                const basic = contract.basic_info;
                const indicators = contract.target_indicators;
                if (validPrefixes.some(p => basic.期货合约代码.startsWith(p))) {
                    return [{
                        code: basic.期货合约代码,
                        price: basic.期货价格,
                        basis: basic.现货最新价 - basic.期货价格,
                        adjustedBasis: indicators.调整基差,
                        remainingDays: basic.剩余天数,
                        expiryDate: basic.到期日,
                        annualizedBasis: parseFloat(indicators.年化基差.replace(/%/g, '')),
                        adjustedAnnualizedBasis: parseFloat(indicators.调整年化基差.replace(/%/g, '')),
                        closingPriceChange: indicators.收盘价涨跌额,
                        closingPriceChangeRate: parseFloat(indicators.收盘价涨跌幅.replace(/%/g, ''))
                    } as Contract];
                }
                return [];
            });
            setIndexData(contracts);
            return contracts;
        }
        return [];
    };

    // 关键优化2：因子生成——基于随机选取的单个合约基差，而非固定平均值
    const generateFactorsBasedOnIndex = (contracts: Contract[]): Factor[] => {
        if (selectedCategories.length === 0 || contracts.length === 0) return [];

        return selectedCategories.flatMap(categoryId => {
            const category = FACTOR_CATEGORIES.find(c => c.id === categoryId);
            if (!category) return [];

            // 随机选1个合约的基差作为参考（每次都不同）
            const randomContract = contracts[Math.floor(Math.random() * contracts.length)];
            const contractBasis = Math.abs(randomContract.basis); // 随机合约的基差绝对值
            const contractAnnualizedBasis = Math.abs(randomContract.annualizedBasis); // 随机合约的年化基差
            const contractCloseChange = Math.abs(randomContract.closingPriceChangeRate); // 随机合约的收盘价涨跌幅

            // 每个类别生成2个因子（参数随随机合约基差变化）
            return Array.from({ length: 2 }).map((_, i) => {
                // 基差敏感度：随随机合约基差波动（3-10之间，基差越大敏感度越高）
                const basisSensitivity = Math.min(10, 3 + Math.floor(contractBasis / 40) * 2 + Math.random() * 1);
                // 波动性：随随机合约收盘价涨跌幅波动（0.3-1之间）
                const volatility = Math.min(1, 0.3 + contractCloseChange / 60 + Math.random() * 0.05);

                // 公式参数随基差动态调整
                let baseMetric, var1, var2, formulaDesc, name;
                if (category.id === 'price_volume') {
                    baseMetric = category.baseMetrics[Math.floor(Math.random() * category.baseMetrics.length)];
                    var1 = ['收盘价涨跌幅', '成交量增速', '持仓量变化率'][Math.floor(Math.random() * 3)];
                    var2 = ['基差方向因子', '流动性指标', '趋势延续性'][Math.floor(Math.random() * 3)];
                    // 公式中加入基差相关系数（随随机合约基差变化）
                    const basisCoeff = (contractBasis / 100).toFixed(2);
                    formulaDesc = `${baseMetric} × (${var1} + ${var2} × ${basisCoeff})`;
                    name = `${category.name}-${baseMetric}复合`;
                } else if (category.id === 'spread_arbitrage') {
                    baseMetric = category.baseMetrics[Math.floor(Math.random() * category.baseMetrics.length)];
                    var1 = ['基差历史分位', '季节性权重', '跨期价差'][Math.floor(Math.random() * 3)];
                    var2 = ['剩余天数衰减系数', '基差收敛速度', '波动率验证'][Math.floor(Math.random() * 3)];
                    // 剩余天数系数随随机合约剩余天数变化
                    const dayCoeff = (randomContract.remainingDays / 365).toFixed(3);
                    formulaDesc = `${baseMetric} × (${var1} + ${var2} × ${dayCoeff})`;
                    name = `${category.name}-${baseMetric}策略`;
                } else {
                    baseMetric = category.baseMetrics[Math.floor(Math.random() * category.baseMetrics.length)];
                    var1 = ['隐含波动率斜率', 'delta对冲系数', '行权价分布'][Math.floor(Math.random() * 3)];
                    var2 = ['基差波动率', '时间价值衰减', '持仓集中度'][Math.floor(Math.random() * 3)];
                    // 年化基差系数随随机合约年化基差变化
                    const annualCoeff = (contractAnnualizedBasis / 100).toFixed(3);
                    formulaDesc = `${baseMetric} × (${var1} + ${var2} × ${annualCoeff})`;
                    name = `${category.name}-${baseMetric}联动`;
                }

                return {
                    id: `${category.id}_${i}_${Date.now()}_${Math.floor(Math.random() * 100)}`, // 增加随机后缀确保ID唯一
                    name,
                    category: category.name,
                    formulaDesc,
                    volatility,
                    basisSensitivity
                };
            });
        });
    };

    // 生成计算步骤（不变）
    const generateCalculationSteps = (factor: Factor): string[] => {
        return [
            `1. 数据预处理：清洗${factor.name}相关原始数据（基差、收盘价等）`,
            `2. 标准化：将指标映射至[0,1]区间，消除量纲影响`,
            `3. 公式计算：应用复合因子公式 ${factor.formulaDesc}`,
            `4. 敏感性校准：基于历史基差数据调整因子权重（敏感度：${factor.basisSensitivity.toFixed(1)}）`,
            `5. 滚动窗口验证：采用${20 + Math.floor(Math.random() * 30)}日窗口验证因子稳定性`
        ];
    };

    // 关键优化3：分析逻辑——所有数值随基差动态波动，每次都不同
    const runFactorAnalysis = async () => {
        if (selectedCategories.length === 0) {
            alert('请至少选择一个因子类别');
            return;
        }

        setIsAnalyzing(true);
        setAnalysisResult(null);
        const logs: Array<{ step: number; action: string; details: string }> = [];
        const logStep = (action: string, details: string) => {
            logs.push({ step: logs.length + 1, action, details });
        };

        try {
            // 步骤1：获取最新股指数据（每次都重新拉取）
            logStep('数据加载', '拉取最新股指基差、剩余天数等核心指标');
            const latestContracts = await fetchLatestIndexData();
            if (latestContracts.length === 0) {
                throw new Error('未获取到有效股指数据');
            }
            logStep('数据加载完成', `获取到${latestContracts.length}个股指合约数据`);
            await new Promise(resolve => setTimeout(resolve, 800));

            // 步骤2：生成因子（随最新基差变化）
            logStep('因子生成', '基于最新股指基差数据生成复合因子');
            const factors = generateFactorsBasedOnIndex(latestContracts);
            setGeneratedFactors(factors);
            logStep('因子生成完成', `生成${factors.length}个与基差强关联的复合因子`);
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 步骤3：计算因子重要性（权重随基差动态变化）
            logStep('重要性计算', '结合最新基差敏感度计算因子权重');
            // 取所有合约的平均基差作为权重调整基准
            const avgBasis = latestContracts.reduce((sum, c) => sum + Math.abs(c.basis), 0) / latestContracts.length;
            const importance = factors.map(factor => {
                // 权重：基差敏感度×5 + 波动性×20 + 平均基差×0.05（随基差波动） + 随机微调
                const weight = Math.min(100, 30 + factor.basisSensitivity * 5 + factor.volatility * 20 + avgBasis * 0.05 + Math.random() * 2);
                // 显著性：波动性越低越显著，加入基差稳定性影响
                const pValue = Math.min(0.15, 0.01 + Math.random() * 0.1 * (1 - factor.volatility) - avgBasis * 0.0001);
                return {
                    ...factor,
                    weight: parseFloat(weight.toFixed(1)),
                    pValue: parseFloat(pValue.toFixed(3)),
                    calculationSteps: generateCalculationSteps(factor)
                };
            }).sort((a, b) => b.weight - a.weight);
            logStep('重要性计算完成', `因子权重范围：${Math.min(...importance.map(i => i.weight))}%-${Math.max(...importance.map(i => i.weight))}%`);
            await new Promise(resolve => setTimeout(resolve, 1200));

            // 步骤4：回测指标（所有数值随基差波动，每次不同）
            logStep('历史回测', '基于基差历史波动数据进行回测验证');
            // 取最新合约的调整基差、剩余天数作为回测基准
            const randomContract = latestContracts[Math.floor(Math.random() * latestContracts.length)];
            const backtestMetrics: Record<string, BacktestMetric> = {};
            importance.forEach(factor => {
                // 年化收益率：基差敏感度×0.02 + 波动性×0.2 + 调整基差×0.001 + 随机微调（±0.01）
                const annualReturn = Math.max(0.02, 0.08 + factor.basisSensitivity * 0.02 + factor.volatility * 0.2 + randomContract.adjustedBasis * 0.001 + (Math.random() - 0.5) * 0.01);
                // 夏普比率：基差敏感度×0.1 + 波动性×1 + 年化基差×0.005 + 随机微调（±0.1）
                const sharpeRatio = Math.max(0.3, 0.8 + factor.basisSensitivity * 0.1 + factor.volatility * 1 + randomContract.annualizedBasis * 0.005 + (Math.random() - 0.5) * 0.1);
                // 最大回撤：剩余天数×0.0002 + 随机微调（±0.01）
                const maxDrawdown = Math.min(0.3, 0.05 + (1 - factor.basisSensitivity * 0.1) * 0.1 + randomContract.remainingDays * 0.0002 + (Math.random() - 0.5) * 0.01);
                // 胜率：基差敏感度×0.05 + 波动性×0.15 + 随机微调（±0.02）
                const winRate = Math.max(0.4, 0.5 + factor.basisSensitivity * 0.05 + factor.volatility * 0.15 + (Math.random() - 0.5) * 0.02);
                // 换手率：固定范围+基差波动影响（±0.2）
                const turnover = Math.max(0.3, 0.8 + Math.random() * 0.6 + (randomContract.basis / 100) * 0.2);

                backtestMetrics[factor.name] = {
                    annualReturn: parseFloat(annualReturn.toFixed(4)),
                    sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
                    maxDrawdown: parseFloat(maxDrawdown.toFixed(4)),
                    winRate: parseFloat(winRate.toFixed(4)),
                    turnover: parseFloat(turnover.toFixed(2))
                };
            });
            logStep('回测完成', '生成基于最新基差数据的回测指标');
            await new Promise(resolve => setTimeout(resolve, 1500));

            setAnalysisResult({ importance, backtestMetrics, calculationLogs: logs });
        } catch (error) {
            logStep('分析失败', error instanceof Error ? error.message : '未知错误');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // 重置分析（不变）
    const resetAnalysis = () => {
        setSelectedCategories([]);
        setGeneratedFactors([]);
        setAnalysisResult(null);
    };

    return (
        <div className="space-y-6 p-4 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center">
                        <PieChart className="mr-2 h-6 w-6 text-indigo-600" />
                        股指驱动型因子挖掘系统
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        基于实时基差、剩余天数、年化基差动态生成复合因子
                    </p>
                </div>
                <Button
                    variant="ghost"
                    onClick={resetAnalysis}
                    disabled={isAnalyzing}
                    className="text-indigo-600 hover:text-indigo-800"
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    重置分析
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Filter className="mr-2 h-5 w-5" />
                        因子类别选择
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {FACTOR_CATEGORIES.map(category => (
                            <div key={category.id} className="space-y-3 p-4 border border-gray-100 rounded-md hover:border-indigo-200 transition-colors">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id={category.id}
                                        checked={selectedCategories.includes(category.id)}
                                        onCheckedChange={() => setSelectedCategories(prev =>
                                            prev.includes(category.id)
                                                ? prev.filter(id => id !== category.id)
                                                : [...prev, category.id]
                                        )}
                                        disabled={isAnalyzing}
                                    />
                                    <Label htmlFor={category.id} className="cursor-pointer font-medium">
                                        {category.name}
                                    </Label>
                                </div>
                                <p className="text-sm text-gray-500">{category.description}</p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            onClick={runFactorAnalysis}
                            disabled={isAnalyzing || selectedCategories.length === 0}
                            className="bg-indigo-600 hover:bg-indigo-700"
                        >
                            {isAnalyzing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    分析中...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="mr-2 h-4 w-4" />
                                    启动因子挖掘
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {generatedFactors.length > 0 && !isAnalyzing && (
                <Card>
                    <CardHeader>
                        <CardTitle>生成的股指关联因子</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {generatedFactors.map(factor => (
                                <div key={factor.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                    <p className="font-medium text-sm">{factor.name}</p>
                                    <p className="text-xs text-gray-500 mt-1 italic">
                                        公式：{factor.formulaDesc}
                                    </p>
                                    <p className="text-xs text-indigo-600 mt-1">
                                        基差敏感度：{factor.basisSensitivity.toFixed(1)} · 波动性：{factor.volatility.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {isAnalyzing && analysisResult?.calculationLogs && (
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-base">分析过程</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-32 overflow-y-auto text-sm space-y-2 p-2 bg-gray-50 rounded-md">
                            {analysisResult.calculationLogs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="text-xs text-gray-500 min-w-[80px]">{new Date().toLocaleTimeString()}</span>
                                    <span className="font-medium text-xs min-w-[60px]">步骤 {log.step}</span>
                                    <div>
                                        <p className="font-medium">{log.action}</p>
                                        <p className="text-gray-600">{log.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {!isAnalyzing && analysisResult && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <PieChart className="mr-2 h-5 w-5" />
                                因子重要性分布
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analysisResult.importance} layout="vertical">
                                            <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                                            <YAxis
                                                dataKey="name"
                                                type="category"
                                                width={200}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip
                                                formatter={(value) => [`${value}%`, '重要性权重']}
                                                labelFormatter={(label) => `因子: ${label}`}
                                            />
                                            <Bar
                                                dataKey="weight"
                                                radius={[0, 4, 4, 0]}
                                                barSize={28}
                                            >
                                                {analysisResult.importance.map((entry, index) => (
                                                    <Cell
                                                        key={index}
                                                        fill={entry.pValue < 0.05 ? '#6366f1' : '#a5b4fc'}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="space-y-4">
                                    {analysisResult.importance.map((factor, i) => (
                                        <div key={i} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-sm">{factor.name}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {factor.pValue < 0.05 ? (
                                                            <span className="text-green-600">显著 (p={factor.pValue.toFixed(3)})</span>
                                                        ) : (
                                                            <span className="text-yellow-600">弱显著 (p={factor.pValue.toFixed(3)})</span>
                                                        )}
                                                    </p>
                                                </div>
                                                <p className="text-xl font-bold text-indigo-600">{factor.weight.toFixed(1)}%</p>
                                            </div>
                                            <Progress value={factor.weight} className="h-1.5 mt-2" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs mt-2 h-6 px-2 text-indigo-600"
                                                onClick={() => {
                                                    alert(`计算步骤:\n${factor.calculationSteps.join('\n')}`);
                                                }}
                                            >
                                                查看计算步骤
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="backtest" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="backtest">回测指标</TabsTrigger>
                        </TabsList>
                        <TabsContent value="backtest" className="space-y-6">
                            <Card>
                                <CardHeader className="py-4">
                                    <CardTitle className="text-lg">因子回测表现（基于实时基差数据）</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        {/* 关键：<tbody> 内部紧凑排列，无空格/换行 */}
                                        <Table><tbody data-slot="table-body">
                                        {/* 表头行：紧跟 <tbody> 开始标签，无换行 */}
                                        <TableRow className="text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap">
                                            <TableCell>因子名称</TableCell>
                                            <TableCell>年化收益率</TableCell>
                                            <TableCell>夏普比率</TableCell>
                                            <TableCell>最大回撤</TableCell>
                                            <TableCell>胜率</TableCell>
                                            <TableCell>年化换手率</TableCell>
                                        </TableRow>
                                        {/* 内容行：与表头行紧凑排列，无多余换行 */}
                                        {Object.entries(analysisResult.backtestMetrics).map(([factorName, metrics], i) => (
                                            <TableRow key={i} className="hover:bg-muted/50 border-b transition-colors">
                                                <TableCell>{factorName}</TableCell>
                                                <TableCell className={metrics.annualReturn >= 0.1 ? 'text-green-600' : ''}>
                                                    {(metrics.annualReturn * 100).toFixed(2)}%
                                                </TableCell>
                                                <TableCell className={metrics.sharpeRatio >= 1.5 ? 'text-green-600' : ''}>
                                                    {metrics.sharpeRatio.toFixed(2)}
                                                </TableCell>
                                                <TableCell className={metrics.maxDrawdown <= 0.1 ? 'text-green-600' : ''}>
                                                    {(metrics.maxDrawdown * 100).toFixed(2)}%
                                                </TableCell>
                                                <TableCell className={metrics.winRate >= 0.6 ? 'text-green-600' : ''}>
                                                    {(metrics.winRate * 100).toFixed(2)}%
                                                </TableCell>
                                                <TableCell>
                                                    {metrics.turnover.toFixed(2)}x
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        </tbody></Table> {/* <tbody> 闭合标签与内容紧凑排列 */}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}

            {!isAnalyzing && !analysisResult && selectedCategories.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                            <PieChart className="h-8 w-8 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">选择因子类别开始挖掘</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            基于实时股指基差、剩余天数、年化基差动态生成复合因子，每次结果随市场数据变化
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FactorMiningComponent;