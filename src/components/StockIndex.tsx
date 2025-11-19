import React, { useState, useEffect, useRef } from 'react';
import { getNewStockIndexData, StockIndexCalculationResponse } from '@/services/api';

interface StockIndexItem {
    indexName: string; // 现货指数名称（沪深300/中证500/中证1000）
    indexPrice: number; // 现货最新价
    contracts: Contract[]; // 对应期货合约列表
}

export interface Contract {
    code: string; // 期货合约代码（IF2512等）
    price: number; // 期货价格
    basis: number; // 基差（现货价 - 期货价，自动计算）
    remainingDividend: number; // 剩余分红
    adjustedBasis: number; // 调整基差
    remainingDays: number; // 剩余天数
    expiryDate: string; // 到期日
    annualizedBasis: number; // 年化基差（去掉%的数值）
    adjustedAnnualizedBasis: number; // 调整年化基差（去掉%的数值）
    settlementPriceChange: number; // 结算价涨跌额
    settlementPriceChangeRate: number; // 结算价涨跌幅（去掉%的数值）
    closingPriceChange: number; // 收盘价涨跌额
    closingPriceChangeRate: number; // 收盘价涨跌幅（去掉%的数值）
}

const StockIndex: React.FC = () => {
    const [stockData, setStockData] = useState<StockIndexItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [updateTime, setUpdateTime] = useState<string>('');
    const [dividendNote, setDividendNote] = useState<string>('');


    // 新增1：请求并发控制（避免前一次请求未完成时发起新请求）
    const [isFetching, setIsFetching] = useState<boolean>(false);
    // 新增2：定时器引用（用于组件卸载时清除，防止内存泄漏）
    const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 工具函数：字符串百分比转数字（保留原有逻辑）
    const parsePercent = (percentStr: string): number => {
        return parseFloat(percentStr.replace(/%/g, '')) || 0;
    };

    // 工具函数：涨跌颜色控制（保留原有逻辑）
    const getChangeColor = (value: number): string => {
        return value > 0 ? 'text-red-500' : value < 0 ? 'text-green-500' : '';
    };

    // 核心：真实API请求函数（保留原有数据处理逻辑，新增并发控制）
    const fetchIndexData = async () => {
        // 并发控制：如果前一次请求未完成，直接返回
        if (isFetching) return;

        try {
            setIsFetching(true); // 标记为正在请求
            setErrorMsg(null); // 重置错误信息

            // 调用真实API接口
            const apiData: StockIndexCalculationResponse = await getNewStockIndexData();
            console.log(apiData);
            // 校验接口业务状态（真实接口可能返回warning，需兼容）
            if (apiData.status !== 'success' && apiData.status !== 'warning') {
                throw new Error(`数据异常：${apiData.msg || '接口返回未知状态'}`);
            }

            // 处理接口返回的原始数据（与原有逻辑一致）
            const rawContracts = apiData.data || {};
            const indexDataMap: Record<string, StockIndexItem> = {
                '沪深300': { indexName: '沪深300', indexPrice: 0, contracts: [] },
                '中证500': { indexName: '中证500', indexPrice: 0, contracts: [] },
                '中证1000': { indexName: '中证1000', indexPrice: 0, contracts: [] },
            };

            // 遍历合约数据，转换为组件需要的格式
            Object.values(rawContracts).forEach(contract => {
                const basic = contract.basic_info || {};
                const indicators = contract.target_indicators || {};
                const indexName = basic.对应现货指数 || '未知指数';

                // 数值容错（避免接口返回null/undefined导致NaN）
                const spotPrice = Number(basic.现货最新价) || 0;
                const futurePrice = Number(basic.期货价格) || 0;

                const formattedContract: Contract = {
                    code: basic.期货合约代码 || '未知合约',
                    price: futurePrice,
                    basis: parseFloat((spotPrice - futurePrice).toFixed(2)), // 实时计算基差
                    remainingDividend: Number(indicators.剩余分红) || 0,
                    adjustedBasis: Number(indicators.调整基差) || 0,
                    remainingDays: Number(basic.剩余天数) || 0,
                    expiryDate: basic.到期日 || '未知日期',
                    annualizedBasis: parsePercent(indicators.年化基差 || '0%'),
                    adjustedAnnualizedBasis: parsePercent(indicators.调整年化基差 || '0%'),
                    settlementPriceChange: Number(indicators.结算价涨跌额) || 0,
                    settlementPriceChangeRate: parsePercent(indicators.结算价涨跌幅 || '0%'),
                    closingPriceChange: Number(indicators.收盘价涨跌额) || 0,
                    closingPriceChangeRate: parsePercent(indicators.收盘价涨跌幅 || '0%'),
                };

                // 关联合约到对应现货指数
                if (indexDataMap[indexName]) {
                    indexDataMap[indexName].indexPrice = spotPrice;
                    indexDataMap[indexName].contracts.push(formattedContract);
                }

                // 更新时间戳（优先用接口返回的时间，其次用当前系统时间）
                const apiUpdateTime = basic.数据更新时间 || apiData['接口请求时间'] || '';
                const currentTime = new Date().toLocaleString();
                setUpdateTime(apiUpdateTime || currentTime);

                // 更新分红说明（保留接口返回的备注）
                setDividendNote(indicators.剩余分红说明 || '剩余分红需接入现货指数分红预期接口');
            });

            // 过滤空数据，更新组件状态
            const validIndexData = Object.values(indexDataMap).filter(
                item => item.contracts.length > 0
            );
            setStockData(validIndexData);

        } catch (error) {
            // 捕获请求错误（网络错误、接口错误等）
            setErrorMsg(error instanceof Error ? error.message : '未知请求错误');
        } finally {
            setIsFetching(false); // 标记为请求完成
            setIsLoading(false); // 结束初始加载态（仅首次请求生效）
        }
    };

    // 新增：定时器逻辑（组件挂载时启动，卸载时清除）
    useEffect(() => {
        // 1. 初始请求：组件挂载后立即请求一次数据
        fetchIndexData();

        // 2. 定时请求：每隔3秒调用一次真实API
        refreshTimerRef.current = setInterval(() => {
            fetchIndexData();
        }, 3000);

        // 3. 组件卸载时清除定时器（关键！防止内存泄漏和无效请求）
        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, []); // 依赖项为空，确保定时器只初始化一次

    // 加载中状态渲染（仅首次请求显示）
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-500">
                加载股指数据中...
            </div>
        );
    }

    // 错误状态渲染（请求失败时显示，且定时器会继续尝试）
    if (errorMsg) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-red-500">
                <p>加载失败：{errorMsg}</p>
                {/* 手动重试按钮（用户可主动触发，不依赖定时器） */}
                <button
                    onClick={fetchIndexData}
                    disabled={isFetching} // 请求中禁用按钮
                    className="mt-2 px-3 py-1 text-sm text-blue-500 border border-blue-500 rounded hover:bg-blue-50 disabled:opacity-50"
                >
                    {isFetching ? '重试中...' : '点击重试'}
                </button>
            </div>
        );
    }

    // 成功状态渲染（保留原有UI，显示真实API返回的数据）
    return (
        <div className="container mx-auto px-4 py-6">
            {/* 标题栏（显示真实刷新信息） */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">股指基差数据</h2>
                <div className="flex flex-col sm:flex-row justify-between items-center mt-2 text-sm text-gray-500">
                    <span>数据更新时间：{updateTime}</span>
                    {/* 明确标注是真实API刷新，增强用户信任 */}
                    <span>{dividendNote} | 真实API自动刷新：3秒/次</span>
                </div>
            </div>

            {/* 各指数数据表格（显示真实接口返回的数值） */}
            <div className="space-y-8">
                {stockData.map((indexItem) => (
                    <div key={indexItem.indexName} className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        {/* 指数标题行（显示真实现货指数价格） */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-800 mr-4">
                  {indexItem.indexName}
                </span>
                                <span className="text-gray-600">
                                    现货指数：{indexItem.indexPrice.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* 表格（支持横向滚动，显示真实合约数据） */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700">
                                <tr>
                                    <th className="px-4 py-3 border-b border-gray-200 w-20">合约代码</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-24">期货价格</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-24">基差</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-24">剩余分红</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-24">调整基差</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-20">剩余天数</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-32">到期日</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-28">年化基差(%)</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-32">调整年化基差(%)</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-32">结算价涨跌额</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-32">结算价涨跌幅(%)</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-32">收盘价涨跌额</th>
                                    <th className="px-4 py-3 border-b border-gray-200 text-right w-32">收盘价涨跌幅(%)</th>
                                </tr>
                                </thead>
                                <tbody className="text-gray-600">
                                {indexItem.contracts.map((contract) => (
                                    <tr
                                        key={contract.code}
                                        className="hover:bg-gray-50 border-b border-gray-200 last:border-0"
                                    >
                                        <td className="px-4 py-3 font-medium">{contract.code}</td>
                                        <td className="px-4 py-3 text-right">{contract.price.toFixed(2)}</td>
                                        <td className={`px-4 py-3 text-right ${getChangeColor(contract.basis)}`}>
                                            {contract.basis.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right">{contract.remainingDividend.toFixed(3)}</td>
                                        <td className={`px-4 py-3 text-right ${getChangeColor(contract.adjustedBasis)}`}>
                                            {contract.adjustedBasis.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-right">{contract.remainingDays}</td>
                                        <td className="px-4 py-3 text-right">{contract.expiryDate}</td>
                                        <td className={`px-4 py-3 text-right ${getChangeColor(contract.annualizedBasis)}`}>
                                            {contract.annualizedBasis.toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-right ${getChangeColor(contract.adjustedAnnualizedBasis)}`}>
                                            {contract.adjustedAnnualizedBasis.toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-right ${getChangeColor(contract.settlementPriceChange)}`}>
                                            {contract.settlementPriceChange.toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-right ${getChangeColor(contract.settlementPriceChangeRate)}`}>
                                            {contract.settlementPriceChangeRate.toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-right ${getChangeColor(contract.closingPriceChange)}`}>
                                            {contract.closingPriceChange.toFixed(2)}
                                        </td>
                                        <td className={`px-4 py-3 text-right ${getChangeColor(contract.closingPriceChangeRate)}`}>
                                            {contract.closingPriceChangeRate.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StockIndex;