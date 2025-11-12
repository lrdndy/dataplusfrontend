"use client";
// FuturesCorrelationTable.tsx
import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectValue, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import type { FuturesContractData, CorrelationResult } from '@/app/datathinker/page.tsx'; // 引入父组件定义的类型



interface FuturesCorrelationTableProps {
    correlationResults: CorrelationResult[]; // 父组件共享的计算结果
    loading: boolean; // 父组件共享的加载状态
    allContractIds: string[]; // 父组件共享的合约ID列表
    onRefresh: () => void; // 父组件的刷新函数
    updateFrequency: number; // 父组件的更新频率
}
const FuturesCorrelationTable: React.FC<FuturesCorrelationTableProps> = ({
                                                                             correlationResults,
                                                                             loading,
                                                                             allContractIds,
                                                                             onRefresh,
                                                                             updateFrequency,
                                                                         }) => {
    // 状态管理
    const [filterContract, setFilterContract] = useState<string>("all"); // 筛选合约
    const [correlationThreshold, setCorrelationThreshold] = useState<number>(0); // 相关性阈值

    const filteredResults = useMemo(() => {
        return correlationResults.filter((result) => {
            // 合约筛选：包含指定合约或"全部"
            const matchesContract = filterContract === "all"
                ? true
                : result.contract1 === filterContract || result.contract2 === filterContract;
            // 相关性阈值筛选：绝对值≥阈值
            const matchesThreshold = Math.abs(result.correlation) >= correlationThreshold;
            return matchesContract && matchesThreshold;
        });
    }, [correlationResults, filterContract, correlationThreshold]);
    // 样式辅助函数
    const getCorrelationColor = (correlation: number, isSignificant: boolean) => {
        if (!isSignificant) return "text-gray-500";
        return correlation > 0 ? "text-red-600" : "text-green-600";
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
        <Card className="overflow-hidden">
            <div className="p-4 border-b bg-white dark:bg-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="font-semibold text-gray-900 dark:text-white">期货合约相关性分析</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* 合约筛选下拉框（数据来自父组件） */}
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

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            数据更新频率：{updateFrequency / 1000}秒
                        </p>
                    </div>
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
    );
};

export default FuturesCorrelationTable;
