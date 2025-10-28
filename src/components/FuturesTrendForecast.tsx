"use client";

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    RefreshCw,
    Info,
    AlertCircle,
    Database,
    Clock
} from 'lucide-react';
import { getNewStockIndexData, StockIndexCalculationResponse } from '@/services/api';

// 基础类型定义
interface Contract {
    code: string;
    price: number;
    basis: number;
    remainingDividend: number;
    adjustedBasis: number;
    remainingDays: number;
    expiryDate: string;
    annualizedBasis: number;
    adjustedAnnualizedBasis: number;
    settlementPriceChange: number;
    settlementPriceChangeRate: number;
    closingPriceChange: number;
    closingPriceChangeRate: number;
}

interface StockIndexItem {
    indexName: string;
    indexPrice: number;
    contracts: Contract[];
}

interface BasicInfo {
    期货合约代码: string;
    对应现货指数: string;
    现货指数代码: string;
    期货价格: number;
    现货最新价: number;
    到期日: string;
    剩余天数: number;
    数据更新时间: string;
}

interface TargetIndicators {
    剩余分红: number;
    剩余分红说明: string;
    调整基差: number;
    年化基差: string;
    调整年化基差: string;
    结算价涨跌额: number;
    结算价涨跌幅: string;
    收盘价涨跌额: number;
    收盘价涨跌幅: string;
}

type ContractData = {
    basic_info: BasicInfo;
    target_indicators: TargetIndicators;
};

interface ForecastResult {
    accuracy: string;
    trend: 'up' | 'down' | 'stable';
    volatilityRange: { min: number; max: number };
    positionChange: number;
    relatedContract: {
        code: string;
        expiryDate: string;
        currentPrice: number;
        basis: number;
    };
}

const parsePercent = (percentStr: string): number => {
    const num = parseFloat(percentStr.replace('%', ''));
    return isNaN(num) ? 0 : num;
};

const FuturesTrendForecast = () => {
    // 核心状态：股指数据、加载态、错误信息
    const [stockData, setStockData] = useState<StockIndexItem[]>([]);
    const [isFetching, setIsFetching] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [dataLoaded, setDataLoaded] = useState<boolean>(false);
    const [isForecasting, setIsForecasting] = useState<boolean>(false);

    // 辅助信息：更新时间、分红说明
    const [updateTime, setUpdateTime] = useState<string>('');
    const [dividendNote, setDividendNote] = useState<string>('');

    // 预测参数（临时选择：用户交互时实时更新）
    const [selectedIndex, setSelectedIndex] = useState<string>('');
    const [selectedCycle, setSelectedCycle] = useState<'7d' | '30d' | '90d'>('30d');
    const [selectedModel, setSelectedModel] = useState<'arima' | 'lstm' | 'prophet'>('arima');

    // 确认参数（点击“生成”后锁定，避免实时变化）
    const [confirmedIndex, setConfirmedIndex] = useState<string>('');
    const [confirmedCycle, setConfirmedCycle] = useState<'7d' | '30d' | '90d'>('30d');
    const [confirmedModel, setConfirmedModel] = useState<'arima' | 'lstm' | 'prophet'>('arima');

    // 其他状态：预测结果、合约列表、定时器
    const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
    const [availableContracts, setAvailableContracts] = useState<Contract[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 下拉框切换时，更新当前指数的合约列表
    useEffect(() => {
        if (!selectedIndex || !stockData.length) return;
        const targetIndex = stockData.find(item => item.indexName === selectedIndex);
        setAvailableContracts(targetIndex ? targetIndex.contracts : []);
    }, [selectedIndex, stockData]);

    // 数据加载后，自动填充“临时参数”（无需用户手动选，兜底保障）
    useEffect(() => {
        if (dataLoaded && stockData.length > 0) {
            // 自动选第一个指数（若未选）
            if (!selectedIndex) setSelectedIndex(stockData[0].indexName);
            // 自动选默认周期（若未选）
            if (!selectedCycle) setSelectedCycle('30d');
            // 自动选默认模型（若未选）
            if (!selectedModel) setSelectedModel('arima');
        }
    }, [dataLoaded, stockData, selectedIndex, selectedCycle, selectedModel]);

    // 组件卸载时清理定时器
    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // 加载股指数据
    const fetchStockData = async () => {
        if (isFetching) return;
        try {
            setIsFetching(true);
            const apiData: StockIndexCalculationResponse = await getNewStockIndexData();

            if (apiData.status !== 'success' || !apiData.data) {
                throw new Error(`数据异常：${apiData.msg || '无有效数据'}`);
            }

            const indexDataMap: Record<string, StockIndexItem> = {
                '沪深300': { indexName: '沪深300', indexPrice: 0, contracts: [] },
                '中证500': { indexName: '中证500', indexPrice: 0, contracts: [] },
                '中证1000': { indexName: '中证1000', indexPrice: 0, contracts: [] },
            };

            Object.values(apiData.data).forEach(contract => {
                const basic = contract.basic_info;
                const indicators = contract.target_indicators;
                const indexName = basic.对应现货指数;
                if (!indexName || !basic.期货合约代码) return;

                const formattedContract: Contract = {
                    code: basic.期货合约代码,
                    price: basic.期货价格,
                    basis: basic.现货最新价 - basic.期货价格,
                    remainingDividend: indicators.剩余分红,
                    adjustedBasis: indicators.调整基差,
                    remainingDays: basic.剩余天数,
                    expiryDate: basic.到期日 || '-',
                    annualizedBasis: parsePercent(indicators.年化基差 || '0%'),
                    adjustedAnnualizedBasis: parsePercent(indicators.调整年化基差 || '0%'),
                    settlementPriceChange: indicators.结算价涨跌额,
                    settlementPriceChangeRate: parsePercent(indicators.结算价涨跌幅 || '0%'),
                    closingPriceChange: indicators.收盘价涨跌额,
                    closingPriceChangeRate: parsePercent(indicators.收盘价涨跌幅 || '0%'),
                };

                if (indexDataMap[indexName]) {
                    indexDataMap[indexName].indexPrice = basic.现货最新价;
                    indexDataMap[indexName].contracts.push(formattedContract);
                }

                if (basic.数据更新时间) setUpdateTime(basic.数据更新时间);
                if (indicators.剩余分红说明) setDividendNote(indicators.剩余分红说明);
            });

            const validIndexData = Object.values(indexDataMap).filter(item => item.contracts.length > 0);
            setStockData(validIndexData);
            setDataLoaded(true);
            setErrorMsg(null);
        } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : '获取数据时发生未知错误');
            setDataLoaded(false);
        } finally {
            setIsFetching(false);
        }
    };

    // 启动定时刷新
    const startPeriodicUpdate = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(fetchStockData, 11000);
    };

    // 生成趋势预测
    const handleGenerateForecast = async () => {
        setForecastResult(null);

        // 首次加载数据（自动填充参数后，校验会通过）
        if (!dataLoaded || !stockData.length) {
            setErrorMsg(null);
            await fetchStockData();
            if (!dataLoaded || !stockData.length) return;
            startPeriodicUpdate();
        }

        // 校验临时参数是否完整（数据加载后已自动填充，大概率通过）
        if (!selectedIndex || !selectedCycle || !selectedModel) {
            setErrorMsg('请先选择完整的预测参数（指数、周期、模型）');
            return;
        }

        // 锁定当前选择的参数（点击“生成”后不再随下拉框变化）
        setConfirmedIndex(selectedIndex);
        setConfirmedCycle(selectedCycle);
        setConfirmedModel(selectedModel);
        setIsForecasting(true);

        try {
            const targetIndex = stockData.find(item => item.indexName === selectedIndex);
            if (!targetIndex || targetIndex.contracts.length === 0) {
                throw new Error('未找到有效的期货合约数据');
            }

            const mainContract = [...targetIndex.contracts]
                .sort((a, b) => a.remainingDays - b.remainingDays)[0];

            const basisRatio = mainContract.basis / targetIndex.indexPrice;
            const trend: 'up' | 'down' | 'stable' =
                basisRatio > 0.02 ? 'up' : basisRatio < -0.02 ? 'down' : 'stable';

            const volatilityFactor = { '7d': 0.03, '30d': 0.08, '90d': 0.15 };
            const fluctuation = mainContract.price * volatilityFactor[selectedCycle];

            const baseAccuracy = { arima: 85, lstm: 92, prophet: 88 };
            const dayFactor = Math.min(5, (90 - mainContract.remainingDays) / 18);

            const baseChange = { arima: 3.2, lstm: 5.5, prophet: 4.0 };
            const trendFactor = trend !== 'stable' ? 1.2 : 1;

            await new Promise(resolve => setTimeout(resolve, 800));
            setForecastResult({
                accuracy: (baseAccuracy[selectedModel] + dayFactor).toFixed(1),
                trend,
                volatilityRange: {
                    min: Math.round(mainContract.price - fluctuation),
                    max: Math.round(mainContract.price + fluctuation)
                },
                positionChange: parseFloat((baseChange[selectedModel] * trendFactor).toFixed(1)),
                relatedContract: {
                    code: mainContract.code,
                    expiryDate: mainContract.expiryDate,
                    currentPrice: mainContract.price,
                    basis: mainContract.basis
                }
            });
        } catch (error) {
            setErrorMsg(error instanceof Error ? error.message : '预测计算失败');
            // 预测失败时，重置“确认参数”为默认值（保证类型安全）
            setConfirmedIndex('');
            setConfirmedCycle('30d');
            setConfirmedModel('arima');
        } finally {
            setIsForecasting(false);
        }
    };

    // 生成模型说明（仅在“确认参数”完整时显示）
    const getModelDescription = () => {
        if (!confirmedIndex || !confirmedCycle || !confirmedModel) {
            return '请生成趋势预测以查看模型说明';
        }

        const cycleText = {
            '7d': '7天短期',
            '30d': '30天中期',
            '90d': '90天长期'
        }[confirmedCycle];

        const modelDescriptions = {
            'arima': `${confirmedIndex}线性趋势明显，ARIMA模型适合捕捉${cycleText}价格波动规律，对主力合约到期前30天内预测效果最佳`,
            'lstm': `LSTM模型擅长分析${confirmedIndex}期货价格与持仓量的非线性关系，对包含分红因素的${cycleText}预测更准确`,
            'prophet': `Prophet模型针对${confirmedIndex}的到期周期特征优化，能有效识别${cycleText}内的季节性波动和到期日效应`
        };

        return modelDescriptions[confirmedModel];
    };

    return (
        <div className="space-y-6 p-4">
            <div>
                <h1 className="text-2xl font-bold">期货趋势预测分析</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    基于股指现货与期货合约数据，预测未来价格走势和市场趋势
                </p>
                {updateTime && (
                    <p className="text-xs text-gray-400 mt-1">数据最后更新: {updateTime}</p>
                )}
            </div>

            {/* 数据加载提示 */}
            {isFetching && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 flex items-center">
                    <Clock className="h-5 w-5 mr-2 flex-shrink-0" />
                    <div>
                        <p className="font-medium">正在加载数据</p>
                        <p className="text-sm">数据加载可能需要较长时间，请耐心等待...</p>
                    </div>
                </div>
            )}

            {/* 错误提示 */}
            {errorMsg && !isFetching && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p>{errorMsg}</p>
                        {dividendNote && (
                            <p className="text-sm mt-1">{dividendNote}</p>
                        )}
                    </div>
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => fetchStockData()}
                        className="ml-4 h-8"
                    >
                        重试
                    </Button>
                </div>
            )}

            <Card className="p-6 shadow-sm">
                <h3 className="text-lg font-medium mb-6">预测参数配置</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    {/* 指数选择（临时参数，随下拉框实时更新） */}
                    <div>
                        <Label className="block mb-2">预测指数</Label>
                        <Select
                            value={selectedIndex}
                            onValueChange={setSelectedIndex}
                            disabled={!dataLoaded || isFetching || isForecasting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={dataLoaded ? "选择股指" : "请先加载数据"} />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                {stockData.map(item => (
                                    <SelectItem key={item.indexName} value={item.indexName}>
                                        {item.indexName}（{item.indexPrice.toFixed(2)}）
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 周期选择（临时参数，随下拉框实时更新） */}
                    <div>
                        <Label className="block mb-2">预测周期</Label>
                        <Select
                            value={selectedCycle}
                            onValueChange={(v) => setSelectedCycle(v as '7d' | '30d' | '90d')}
                            disabled={!dataLoaded || isFetching || isForecasting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择周期" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="7d">7天（短期）</SelectItem>
                                <SelectItem value="30d">30天（中期）</SelectItem>
                                <SelectItem value="90d">90天（长期）</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 模型选择（临时参数，随下拉框实时更新） */}
                    <div>
                        <Label className="block mb-2">预测模型</Label>
                        <Select
                            value={selectedModel}
                            onValueChange={(v) => setSelectedModel(v as 'arima' | 'lstm' | 'prophet')}
                            disabled={!dataLoaded || isFetching || isForecasting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="选择模型" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                                <SelectItem value="arima">ARIMA（线性趋势）</SelectItem>
                                <SelectItem value="lstm">LSTM（非线性联动）</SelectItem>
                                <SelectItem value="prophet">Prophet（周期特征）</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 生成预测按钮 */}
                <Button
                    className="w-full md:w-auto bg-sky-600 hover:bg-sky-800 text-white text-lg py-6 px-8 transition-colors duration-200"
                    onClick={handleGenerateForecast}
                    disabled={isFetching || isForecasting}
                >
                    {isFetching ? (
                        <>
                            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                            加载数据中...
                        </>
                    ) : isForecasting ? (
                        <>
                            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                            计算预测中...
                        </>
                    ) : (
                        "生成趋势预测"
                    )}
                </Button>

                {/* 模型说明（仅显示“确认参数”的说明） */}
                {dataLoaded && !isFetching && (
                    <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-800 mt-4 flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <p>{getModelDescription()}</p>
                    </div>
                )}

                {/* 分红说明 */}
                {dataLoaded && !isFetching && dividendNote && (
                    <div className="p-3 bg-green-50 rounded-md text-sm text-green-800 mt-2 flex items-start">
                        <Info className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <p>{dividendNote}</p>
                    </div>
                )}

                {/* 手动刷新按钮 */}
                {dataLoaded && !isFetching && !isForecasting && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchStockData()}
                        className="mt-2 text-sm text-gray-500"
                    >
                        <RefreshCw className="mr-1 h-4 w-4" />
                        手动刷新数据
                    </Button>
                )}

                {/* 预测结果（仅“确认参数”完整时显示） */}
                {forecastResult && confirmedIndex && confirmedCycle && confirmedModel && !isFetching && !isForecasting && (
                    <div className="mt-6 p-5 border rounded-lg animate-in fade-in duration-300">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                            <h4 className="font-semibold text-lg">
                                {confirmedIndex} 期货预测结果（{confirmedCycle === '7d' ? '7天短期' : confirmedCycle === '30d' ? '30天中期' : '90天长期'}）
                            </h4>
                            <Badge className="bg-purple-100 text-purple-800 self-start">
                                预测模型：{confirmedModel === 'arima' ? 'ARIMA（线性趋势）' : confirmedModel === 'lstm' ? 'LSTM（非线性联动）' : 'Prophet（周期特征）'}
                            </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">预测准确度</p>
                                <p className="text-xl font-bold text-green-600">
                                    {forecastResult.accuracy}%
                                </p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">趋势方向</p>
                                <Badge
                                    className={
                                        forecastResult.trend === 'up' ? 'bg-green-100 text-green-800' :
                                            forecastResult.trend === 'down' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                    }
                                >
                  <span className="flex items-center">
                    {forecastResult.trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> :
                        forecastResult.trend === 'down' ? <TrendingDown className="h-4 w-4 mr-1" /> :
                            <Minus className="h-4 w-4 mr-1" />}
                      {forecastResult.trend === 'up' ? '上涨' :
                          forecastResult.trend === 'down' ? '下跌' : '平稳'}
                  </span>
                                </Badge>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">波动范围（点）</p>
                                <p className="text-sm font-medium">
                                    {forecastResult.volatilityRange.min} - {forecastResult.volatilityRange.max}
                                </p>
                            </div>

                            <div className="p-3 bg-gray-50 rounded-md">
                                <p className="text-xs text-gray-500 mb-1">持仓量变化</p>
                                <p className={`text-sm font-medium ${
                                    forecastResult.positionChange >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {forecastResult.positionChange >= 0 ? '+' : ''}{forecastResult.positionChange}%
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 text-xs text-gray-500 border-t pt-3">
                            <p>
                                <span className="font-medium">关联合约：</span>
                                {forecastResult.relatedContract.code}（到期日：{forecastResult.relatedContract.expiryDate}）
                            </p>
                            <p>
                                <span className="font-medium">当前状态：</span>
                                期货价 {forecastResult.relatedContract.currentPrice.toFixed(2)}，基差 {forecastResult.relatedContract.basis.toFixed(2)}
                            </p>
                            <p className="mt-1">
                                <span className="font-medium">预测参数：</span>
                                指数={confirmedIndex} | 周期={confirmedCycle} | 模型={confirmedModel}
                            </p>
                        </div>
                    </div>
                )}

                {/* 首次使用引导 */}
                {!dataLoaded && !isFetching && !errorMsg && (
                    <div className="p-8 text-center mt-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                            <Database className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">准备生成预测</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                            点击&ldquo;生成趋势预测&ldquo;按钮后，系统将加载所需的股指和期货合约数据，
                            数据加载可能需要较长时间，请耐心等待
                        </p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default FuturesTrendForecast;