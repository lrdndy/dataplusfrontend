import React from 'react';

interface StockIndexItem {
    indexName: string;
    indexPrice: number;
    contracts: Contract[];
}

interface Contract {
    code: string;
    price: number;
    basis?: number;        // 基差
    remainingDividend?: number; // 剩余分红
    adjustedBasis?: number; // 调整基差
    remainingDays: number; // 剩余天数
    expiryDate: string;    // 到期日
    annualizedBasis?: number; // 年化基差
    adjustedAnnualizedBasis?: number; // 调整年化基差
    settlementPriceChange?: number; // 结算价涨跌额
    settlementPriceChangeRate?: number; // 结算价涨跌幅
    closingPriceChange?: number; // 收盘价涨跌额
    closingPriceChangeRate?: number; // 收盘价涨跌幅
}

const StockIndex: React.FC = () => {
    // 模拟与截图一致的数据源
    const mockData: StockIndexItem[] = [
        {
            indexName: '沪深300',
            indexPrice: 4550.58,
            contracts: [
                {
                    code: 'IF2510',
                    price: 4476,
                    remainingDividend: 5.659,
                    adjustedBasis: -16.451,
                    remainingDays: 29,
                    expiryDate: '2025-10-17',
                    annualizedBasis: -6.19,
                    adjustedAnnualizedBasis: -4.6,
                    settlementPriceChange: -62.2,
                    settlementPriceChangeRate: -1.37,
                    closingPriceChange: -65.8,
                    closingPriceChangeRate: -1.4,
                },
                {
                    code: 'IF2512',
                    price: 4448.2,
                    remainingDividend: 23.633,
                    adjustedBasis: -26.277,
                    remainingDays: 92,
                    expiryDate: '2025-12-19',
                    annualizedBasis: -4.4,
                    adjustedAnnualizedBasis: -2.32,
                    settlementPriceChange: -66.4,
                    settlementPriceChangeRate: -1.47,
                    closingPriceChange: -70,
                    closingPriceChangeRate: -1.5,
                },
                {
                    code: 'IF2603',
                    price: 4418,
                    remainingDividend: 41.95,
                    adjustedBasis: -38.16,
                    remainingDays: 183,
                    expiryDate: '2026-03-20',
                    annualizedBasis: -3.55,
                    adjustedAnnualizedBasis: -1.69,
                    settlementPriceChange: -70.2,
                    settlementPriceChangeRate: -1.56,
                    closingPriceChange: -74.8,
                    closingPriceChangeRate: -1.6,
                },
            ],
        },
        {
            indexName: '中证500',
            indexPrice: 7199.88,
            contracts: [
                {
                    code: 'IC2509',
                    price: 7171.6,
                    remainingDividend: 0.347,
                    adjustedBasis: -27.933,
                    remainingDays: 1,
                    expiryDate: '2025-09-19',
                    annualizedBasis: -143.37,
                    adjustedAnnualizedBasis: -141.61,
                    settlementPriceChange: -72.6,
                    settlementPriceChangeRate: -1,
                    closingPriceChange: -80.8,
                    closingPriceChangeRate: -1.1,
                },
                {
                    code: 'IC2510',
                    price: 7114.4,
                    remainingDividend: 10.064,
                    adjustedBasis: -75.416,
                    remainingDays: 29,
                    expiryDate: '2025-10-17',
                    annualizedBasis: -14.94,
                    adjustedAnnualizedBasis: -13.18,
                    settlementPriceChange: -72,
                    settlementPriceChangeRate: -1,
                    closingPriceChange: -82.6,
                    closingPriceChangeRate: -1.1,
                },
                {
                    code: 'IC2512',
                    price: 6985.4,
                    remainingDividend: 21.128,
                    adjustedBasis: -193.352,
                    remainingDays: 92,
                    expiryDate: '2025-12-19',
                    annualizedBasis: -11.82,
                    adjustedAnnualizedBasis: -10.65,
                    settlementPriceChange: -83.2,
                    settlementPriceChangeRate: -1.18,
                    closingPriceChange: -95.6,
                    closingPriceChangeRate: -1.3,
                },
                {
                    code: 'IC2603',
                    price: 6819.6,
                    remainingDividend: 25.182,
                    adjustedBasis: -355.098,
                    remainingDays: 183,
                    expiryDate: '2026-03-20',
                    annualizedBasis: -10.53,
                    adjustedAnnualizedBasis: -9.84,
                    settlementPriceChange: -85,
                    settlementPriceChangeRate: -1.23,
                    closingPriceChange: -96.4,
                    closingPriceChangeRate: -1.3,
                },
            ],
        },
        {
            indexName: '中证1000',
            indexPrice: 7476.4,
            contracts: [
                {
                    code: 'IM2509',
                    price: 7454.8,
                    remainingDividend: 0.94,
                    adjustedBasis: -20.66,
                    remainingDays: 1,
                    expiryDate: '2025-09-19',
                    annualizedBasis: -105.45,
                    adjustedAnnualizedBasis: -100.86,
                    settlementPriceChange: -89.4,
                    settlementPriceChangeRate: -1.19,
                    closingPriceChange: -92.2,
                    closingPriceChangeRate: -1.2,
                },
                {
                    code: 'IM2510',
                    price: 7370.2,
                    remainingDividend: 6.799,
                    adjustedBasis: -99.401,
                    remainingDays: 29,
                    expiryDate: '2025-10-17',
                    annualizedBasis: -17.88,
                    adjustedAnnualizedBasis: -16.73,
                    settlementPriceChange: -107.6,
                    settlementPriceChangeRate: -1.44,
                    closingPriceChange: -110,
                    closingPriceChangeRate: -1.4,
                },
                {
                    code: 'IM2512',
                    price: 7213.4,
                    remainingDividend: 16.389,
                    adjustedBasis: -246.611,
                    remainingDays: 92,
                    expiryDate: '2025-12-19',
                    annualizedBasis: -13.96,
                    adjustedAnnualizedBasis: -13.09,
                    settlementPriceChange: -110.6,
                    settlementPriceChangeRate: -1.51,
                    closingPriceChange: -118.2,
                    closingPriceChangeRate: -1.6,
                },
                {
                    code: 'IM2603',
                    price: 7000,
                    remainingDividend: 20.177,
                    adjustedBasis: -456.223,
                    remainingDays: 183,
                    expiryDate: '2026-03-20',
                    annualizedBasis: -12.71,
                    adjustedAnnualizedBasis: -12.17,
                    settlementPriceChange: -119.6,
                    settlementPriceChangeRate: -1.68,
                    closingPriceChange: -126.2,
                    closingPriceChangeRate: -1.7,
                },
            ],
        },
    ];

    return (
        <div className="space-y-4">
            {/* 标题与数据来源 */}
            <h2 className="text-xl font-bold text-center mb-2">股指基差</h2>
            <div className="flex justify-between text-sm text-gray-500 mb-4">
                <span>数据更新日期：2025-09-18</span>
                <span>剩余分红数据来源：华泰期货研究院</span>
            </div>

            {mockData.map((indexItem) => (
                <div key={indexItem.indexName} className="mb-6">
                    {/* 指数名称与价格 */}
                    <div className="flex items-center mb-2">
                        <span className="text-lg font-semibold mr-2">{indexItem.indexName}</span>
                        <span className="text-gray-700">{indexItem.indexPrice}</span>
                    </div>

                    {/* 合并表格，添加水平滚动 */}
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-sm whitespace-nowrap">
                            <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-gray-200 px-2 py-1 text-left">合约</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">价格</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">剩余分红</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">调整基差</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">剩余天数</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">到期日</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">年化基差</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">调整年化基差</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">结算价涨跌额</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">结算价涨跌幅</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">收盘价涨跌额</th>
                                <th className="border border-gray-200 px-2 py-1 text-right">收盘价涨跌幅</th>
                            </tr>
                            </thead>
                            <tbody>
                            {indexItem.contracts.map((contract) => (
                                <tr key={contract.code} className="border-b border-gray-200 hover:bg-gray-50">
                                    <td className="px-2 py-1 font-medium">{contract.code}</td>
                                    <td className="px-2 py-1 text-right">{contract.price}</td>
                                    <td className="px-2 py-1 text-right">{contract.remainingDividend ?? '-'}</td>
                                    <td
                                        className={`px-2 py-1 text-right ${
                                            contract.adjustedBasis !== undefined
                                                ? contract.adjustedBasis >= 0 ? 'text-red-500' : 'text-green-500'
                                                : ''
                                        }`}
                                    >
                                        {contract.adjustedBasis ?? '-'}
                                    </td>
                                    <td className="px-2 py-1 text-right">{contract.remainingDays}</td>
                                    <td className="px-2 py-1 text-right">{contract.expiryDate}</td>
                                    <td
                                        className={`px-2 py-1 text-right ${
                                            contract.annualizedBasis !== undefined
                                                ? contract.annualizedBasis >= 0 ? 'text-red-500' : 'text-green-500'
                                                : ''
                                        }`}
                                    >
                                        {contract.annualizedBasis ?? '-'}%
                                    </td>
                                    <td
                                        className={`px-2 py-1 text-right ${
                                            contract.adjustedAnnualizedBasis !== undefined
                                                ? contract.adjustedAnnualizedBasis >= 0 ? 'text-red-500' : 'text-green-500'
                                                : ''
                                        }`}
                                    >
                                        {contract.adjustedAnnualizedBasis ?? '-'}%
                                    </td>
                                    <td className="px-2 py-1 text-right text-green-500">
                                        {contract.settlementPriceChange ?? '-'}
                                    </td>
                                    <td className="px-2 py-1 text-right text-green-500">
                                        {contract.settlementPriceChangeRate ?? '-'}%
                                    </td>
                                    <td className="px-2 py-1 text-right text-green-500">
                                        {contract.closingPriceChange ?? '-'}
                                    </td>
                                    <td className="px-2 py-1 text-right text-green-500">
                                        {contract.closingPriceChangeRate ?? '-'}%
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default StockIndex;