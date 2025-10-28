import React, { useState, useEffect } from 'react';
// 👉 1. 导入封装好的新股指接口函数和类型（从 services/api.ts 导入）
import { getNewStockIndexData, StockIndexCalculationResponse } from '@/services/api';

// 👉 2. 替换原有的 ApiResponse 类型，直接使用封装好的专属类型
// （删除原有的 ApiResponse 定义，复用 api.ts 中的 StockIndexCalculationResponse）

// 2. 组件渲染所需数据类型（保持不变）
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
    // 3. 状态管理：数据、加载态、错误态、公共信息（保持不变）
    const [stockData, setStockData] = useState<StockIndexItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [updateTime, setUpdateTime] = useState<string>('');
    const [dividendNote, setDividendNote] = useState<string>('');

    // 👉 4. 删除原有的 API_URL（已在 api.ts 的 stockIndexApi 实例中配置）

    // 5. 工具函数：字符串百分比转数字（保持不变）
    const parsePercent = (percentStr: string): number => {
        return parseFloat(percentStr.replace(/%/g, ''));
    };

    // 6. 工具函数：涨跌颜色控制（保持不变）
    const getChangeColor = (value: number): string => {
        return value > 0 ? 'text-red-500' : value < 0 ? 'text-green-500' : '';
    };

    // 7. 接口请求逻辑：改用封装的 getNewStockIndexData 函数（核心修改）
    useEffect(() => {
        const fetchIndexData = async () => {
            // 重置状态（保持不变）
            setIsLoading(true);
            setErrorMsg(null);

            try {
                // 👉 核心：调用封装好的新股指接口函数（无需手动写 fetch 逻辑）
                const apiData: StockIndexCalculationResponse = await getNewStockIndexData();

                // 校验接口业务状态（保持不变，api.ts 已做基础错误捕获，这里做业务校验）
                if (apiData.status !== 'success') {
                    throw new Error(`数据异常：${apiData.msg}`);
                }

                // 8. 转换接口数据为组件渲染格式（保持不变）
                const rawContracts = apiData.data;
                const indexDataMap: Record<string, StockIndexItem> = {
                    '沪深300': { indexName: '沪深300', indexPrice: 0, contracts: [] },
                    '中证500': { indexName: '中证500', indexPrice: 0, contracts: [] },
                    '中证1000': { indexName: '中证1000', indexPrice: 0, contracts: [] },
                };

                // 遍历每个期货合约（保持不变）
                Object.values(rawContracts).forEach(contract => {
                    const basic = contract.basic_info;
                    const indicators = contract.target_indicators;
                    const indexName = basic.对应现货指数;

                    // 构建单个合约数据（保持不变）
                    const formattedContract: Contract = {
                        code: basic.期货合约代码,
                        price: basic.期货价格,
                        basis: basic.现货最新价 - basic.期货价格, // 自动计算基差
                        remainingDividend: indicators.剩余分红,
                        adjustedBasis: indicators.调整基差,
                        remainingDays: basic.剩余天数,
                        expiryDate: basic.到期日,
                        annualizedBasis: parsePercent(indicators.年化基差),
                        adjustedAnnualizedBasis: parsePercent(indicators.调整年化基差),
                        settlementPriceChange: indicators.结算价涨跌额,
                        settlementPriceChangeRate: parsePercent(indicators.结算价涨跌幅),
                        closingPriceChange: indicators.收盘价涨跌额,
                        closingPriceChangeRate: parsePercent(indicators.收盘价涨跌幅),
                    };

                    // 关联合约到对应现货指数（保持不变）
                    if (indexDataMap[indexName]) {
                        indexDataMap[indexName].indexPrice = basic.现货最新价;
                        indexDataMap[indexName].contracts.push(formattedContract);
                    }

                    // 存储公共信息（保持不变）
                    setUpdateTime(basic.数据更新时间);
                    setDividendNote(indicators.剩余分红说明);
                });

                // 过滤空数据，更新组件状态（保持不变）
                const validIndexData = Object.values(indexDataMap).filter(
                    item => item.contracts.length > 0
                );
                setStockData(validIndexData);

            } catch (error) {
                // 捕获错误（api.ts 已包装错误信息，这里直接展示）
                setErrorMsg(error instanceof Error ? error.message : '未知错误');
            } finally {
                // 无论成功失败，结束加载态（保持不变）
                setIsLoading(false);
            }
        };

        // 执行请求（保持不变）
        fetchIndexData();
    }, []); // 👉 依赖项删除 API_URL（已在 api.ts 中配置，无需组件内监听）

    // 9. 加载中状态渲染（保持不变）
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-40 text-gray-500">
                加载股指数据中...
            </div>
        );
    }

    // 10. 错误状态渲染（保持不变）
    if (errorMsg) {
        return (
            <div className="flex items-center justify-center h-40 text-red-500">
                加载失败：{errorMsg}
            </div>
        );
    }

    // 11. 成功状态渲染（完整UI，保持不变）
    return (
        <div className="container mx-auto px-4 py-6">
            {/* 标题栏 */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">股指基差数据</h2>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <span>数据更新时间：{updateTime}</span>
                    <span>{dividendNote}</span>
                </div>
            </div>

            {/* 各指数数据表格 */}
            <div className="space-y-8">
                {stockData.map((indexItem) => (
                    <div key={indexItem.indexName} className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        {/* 指数标题行 */}
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <div className="flex items-center">
                <span className="text-lg font-semibold text-gray-800 mr-4">
                  {indexItem.indexName}
                </span>
                                <span className="text-gray-600">现货指数：{indexItem.indexPrice.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* 表格（支持横向滚动） */}
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