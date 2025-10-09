"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';


// 定义期货预测结果的类型结构
interface ForecastResult {
    accuracy: string;
    trend: 'up' | 'down' | 'stable';
    volatilityRange: { min: number; max: number };
    positionChange: number;
}

const FuturesTrendForecast = () => {
    // 预测相关状态
    const [selectedCycle, setSelectedCycle] = useState<'7d' | '30d' | '90d'>('30d');
    const [selectedModel, setSelectedModel] = useState<'arima' | 'lstm' | 'prophet'>('arima');
    const [isForecasting, setIsForecasting] = useState(false);
    const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
    const [activeModel, setActiveModel] = useState<'arima' | 'lstm' | 'prophet'>(selectedModel);

    // 生成预测的核心逻辑
    const handleGenerateForecast = () => {
        setIsForecasting(true);
        setForecastResult(null);

        setTimeout(() => {
            const cycleMap = { '7d': 7, '30d': 30, '90d': 90 };
            const modelAccuracyMap = { 'arima': 88, 'lstm': 92, 'prophet': 90 };

            const trend: 'up' | 'down' = cycleMap[selectedCycle] > 30 ? 'up' : 'down';
            const result: ForecastResult = {
                accuracy: (modelAccuracyMap[selectedModel] + (cycleMap[selectedCycle] / 90) * 2).toFixed(1),
                trend: trend,
                volatilityRange: {
                    min: 4200 - cycleMap[selectedCycle] * 10,
                    max: 4800 + cycleMap[selectedCycle] * 10,
                },
                positionChange: selectedModel === 'lstm' ? 5.2 : 3.8,
            };

            // 关键：生成预测时，同步“当前选中的模型”到 activeModel
            setActiveModel(selectedModel);

            setForecastResult(result);
            setIsForecasting(false);
        }, 1200);
    };

    // 模型说明辅助函数
    const getModelDescription = (model: 'arima' | 'lstm' | 'prophet'): string => {
        const descMap = {
            'arima': 'ARIMA模型：适合线性趋势明显的期货品种（如农产品），对短期波动预测稳定',
            'lstm': 'LSTM模型：适合持仓量与价格联动强的品种（如能源期货），能捕捉非线性规律',
            'prophet': 'Prophet模型：适合有到期周期特征的品种（如金融期货），对季节性因素适配好',
        };
        return descMap[model] || '该模型适用于多数期货品种，预测结果仅供参考';
    };
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">期货趋势预测分析</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    基于期货历史数据（价格/持仓量）预测未来合约走势和市场趋势
                </p>
            </div>

            <Card className="p-6">
                <div className="space-y-6">
                    <h3 className="text-lg font-medium">期货价格趋势预测</h3>

                    {/* 预测参数选择区 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="block mb-2">预测周期</Label>
                            <Select
                                value={selectedCycle}
                                onValueChange={(value) => setSelectedCycle(value as '7d' | '30d' | '90d')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择期货预测周期" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="7d">7天</SelectItem>
                                    <SelectItem value="30d">30天</SelectItem>
                                    <SelectItem value="90d">90天（合约到期前）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="block mb-2">预测模型（期货专用）</Label>
                            <Select
                                value={selectedModel}
                                onValueChange={(value) => setSelectedModel(value as 'arima' | 'lstm' | 'prophet')}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="选择期货预测模型" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="arima">ARIMA（适合线性趋势）</SelectItem>
                                    <SelectItem value="lstm">LSTM（适合持仓量-价格联动）</SelectItem>
                                    <SelectItem value="prophet">Prophet（适合到期周期预测）</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                    </div>

                    {/* 生成预测按钮 */}
                    <Button
                        className="w-full md:w-auto"
                        onClick={handleGenerateForecast}
                        disabled={isForecasting}
                    >
                        {isForecasting ? '预测生成中...' : '生成期货趋势预测'}
                    </Button>

                    {/* 预测结果展示（非空时渲染） */}
                    {forecastResult && (
                        <div className="mt-4 p-4 border rounded-md bg-white dark:bg-gray-800">
                            <h4 className="font-medium mb-3">期货预测结果摘要</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">预测准确度</span>
                                    <span className="text-lg font-semibold mt-1">{forecastResult.accuracy}%</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">趋势方向（主力合约）</span>
                                    <Badge
                                        className={
                                            forecastResult.trend === 'up'
                                                ? 'bg-green-100 text-green-800 mt-1'
                                                : forecastResult.trend === 'down'
                                                    ? 'bg-red-100 text-red-800 mt-1'
                                                    : 'bg-gray-100 text-gray-800 mt-1'
                                        }
                                    >
                                        {forecastResult.trend === 'up' ? '上涨' :
                                            forecastResult.trend === 'down' ? '下跌' : '平稳'}
                                    </Badge>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">预期波动范围（点）</span>
                                    <span className="text-lg font-semibold mt-1">
                    {forecastResult.volatilityRange.min} - {forecastResult.volatilityRange.max}
                  </span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">到期前持仓量变化</span>
                                    <span className={`text-lg font-semibold mt-1 ${
                                        forecastResult.positionChange >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                    {forecastResult.positionChange >= 0 ? '+' : ''}{forecastResult.positionChange}%
                  </span>
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                                <p>模型说明：{getModelDescription(activeModel)}</p>
                                <p>提示：预测结果基于历史数据，实际走势需结合市场实时情况</p>
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default FuturesTrendForecast;