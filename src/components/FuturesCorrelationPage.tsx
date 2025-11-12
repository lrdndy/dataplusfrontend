"use client";
import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectValue, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowUpRight, ArrowDownRight, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import type { FuturesContractData, CorrelationResult } from '@/app/datathinker/page.tsx'; // 导入原有期货数据类型

// -------------------------- 类型定义 --------------------------
interface FuturesCorrelationPageProps {
    correlationResults: CorrelationResult[]; // 父组件共享的计算结果
    loading: boolean; // 父组件共享的加载状态
    error: string | null; // 父组件共享的错误状态
    allContractIds: string[]; // 父组件共享的合约ID列表
    onRefresh: () => void; // 父组件的刷新函数
    updateFrequency: number; // 父组件的更新频率
}

const FuturesCorrelationPage: React.FC<FuturesCorrelationPageProps> = ({
                                                                           correlationResults,
                                                                           loading,
                                                                           error,
                                                                           allContractIds,
                                                                           onRefresh,
                                                                           updateFrequency,
                                                                       }) => {
    // 状态管理
    const [filterContract, setFilterContract] = useState<string>('all');
    const [correlationThreshold, setCorrelationThreshold] = useState<number>(0);
    // 历史价格缓存（用ref避免重渲染）
    const filteredResults = useMemo(() => {
        return correlationResults.filter(result => {
            const matchesContract = filterContract === 'all'
                ? true
                : result.contract1 === filterContract || result.contract2 === filterContract;
            const matchesThreshold = Math.abs(result.correlation) >= correlationThreshold;
            return matchesContract && matchesThreshold;
        });
    }, [correlationResults, filterContract, correlationThreshold]);
    const getCorrelationColor = (correlation: number, isSignificant: boolean) => {
        if (!isSignificant) return 'text-gray-500';
        return correlation > 0 ? 'text-red-600' : correlation < 0 ? 'text-green-600' : 'text-gray-500';
    };
    const getCorrelationBadge = (correlation: number, isSignificant: boolean) => {
        if (!isSignificant) {
            return <Badge className="bg-gray-100 text-gray-800">待数据加载</Badge>;
        }
        const absCorr = Math.abs(correlation);
        if (absCorr >= 0.7) {
            return correlation > 0
                ? <Badge className="bg-red-100 text-red-800">强正相关</Badge>
                : <Badge className="bg-green-100 text-green-800">强负相关</Badge>;
        } else if (absCorr >= 0.3) {
            return correlation > 0
                ? <Badge className="bg-orange-100 text-orange-800">中等正相关</Badge>
                : <Badge className="bg-teal-100 text-teal-800">中等负相关</Badge>;
        } else {
            return <Badge className="bg-blue-100 text-blue-800">弱相关</Badge>;
        }
    };
    return (
        <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-200px)]">
            {/* 页面标题与筛选栏 */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">期货合约相关性分析</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        基于实时价格历史序列计算皮尔逊相关系数，反映合约间价格联动关系
                    </p>
                </div>

                {/* 筛选控件 */}
                <div className="flex flex-wrap gap-3">
                    {/* 合约筛选（数据来自父组件） */}
                    <Select value={filterContract} onValueChange={setFilterContract}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="筛选合约对" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="all">所有合约对</SelectItem>
                            {allContractIds.map(contractId => (
                                <SelectItem key={contractId} value={contractId}>包含 {contractId}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* 相关性阈值筛选 */}
                    <Select value={correlationThreshold.toString()} onValueChange={(val) => setCorrelationThreshold(Number(val))}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="相关性阈值" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            <SelectItem value="0">全部（≥0）</SelectItem>
                            <SelectItem value="0.3">弱相关（≥0.3）</SelectItem>
                            <SelectItem value="0.5">中等相关（≥0.5）</SelectItem>
                            <SelectItem value="0.7">强相关（≥0.7）</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* 手动刷新（调用父组件的刷新函数） */}
                    <Button onClick={onRefresh} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? '刷新中' : '手动刷新'}
                    </Button>
                </div>
            </div>

            {/* 错误提示（来自父组件的共享错误状态） */}
            {error && (
                <Card className="bg-red-50 dark:bg-red-900/20 p-4 border-l-4 border-red-500">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                </Card>
            )}

            {/* 相关性结果表格（数据来自父组件） */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-white">相关性计算结果</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            数据更新频率：{updateFrequency/1000}秒
                        </p>
                    </div>
                </div>

                <div className="p-4 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <RefreshCw className="h-6 w-6 text-gray-400 animate-spin mr-2" />
                            <p className="text-gray-500">计算相关性中...</p>
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="flex items-center justify-center py-10 text-gray-500">
                            <AlertTriangle className="h-5 w-5 mr-2" />
                            <p>暂无符合条件的合约对（请检查筛选条件或等待数据积累）</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800">
                                    <TableHead className="w-[200px]">合约对</TableHead>
                                    <TableHead className="w-[120px] text-right">相关系数</TableHead>
                                    <TableHead className="w-[120px]">相关性强度</TableHead>
                                    <TableHead className="w-[100px]">显著性</TableHead>
                                    <TableHead className="w-[200px]">说明</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredResults.map((result, index) => (
                                    <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col sm:flex-row gap-1">
                                                <span>{result.contract1}</span>
                                                <span className="text-gray-400">—</span>
                                                <span>{result.contract2}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-right font-medium ${getCorrelationColor(result.correlation, result.isSignificant)}`}>
                                            {result.correlation.toFixed(4)}
                                        </TableCell>
                                        <TableCell>{getCorrelationBadge(result.correlation, result.isSignificant)}</TableCell>
                                        <TableCell>
                                            {result.isSignificant ? (
                                                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                                                    <CheckCircle className="h-3 w-3" /> 显著
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-800">不显著</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {result.isSignificant
                                                    ? result.correlation > 0 ? '价格同步上涨概率高' : '价格反向变动概率高'
                                                    : '需更多数据点才显著'}
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </Card>
            {/* 相关性计算说明（保留不变） */}
            <Card className="bg-white dark:bg-gray-800 p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">相关性计算说明</h3>
                <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 list-disc pl-5">
                    <li>采用皮尔逊相关系数，取值范围[-1, 1]：1=完全正相关，-1=完全负相关，0=无相关</li>
                    <li>应用场景：强正相关合约可用于对冲风险，强负相关合约可用于套利策略</li>
                </ul>
            </Card>
        </div>
    );
};

export default FuturesCorrelationPage;