import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import { StockItem } from '@/app/page';

// 匹配 ECharts 原生 Tooltip 参数结构（兼容 value 为数组的情况）
interface CustomTooltipParam {
    name?: string;                 // X轴日期
    seriesName?: string;           // 系列名（如“收盘价”）
    value?: number | any[];        // 支持数字或数组（原生类型要求）
    [key: string]: any;            // 兼容其他潜在字段
}
type CustomTooltipParams = CustomTooltipParam | CustomTooltipParam[];

// 组件属性类型
interface StockChartProps {
    data: StockItem[];
    title: string;
}

const StockChart = ({ data, title }: StockChartProps) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<ECharts | null>(null);

    // 初始化图表实例（仅执行一次）
    useEffect(() => {
        if (chartRef.current && !chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current);
        }

        // 窗口 resize 时重绘图表
        const handleResize = () => {
            chartInstance.current?.resize();
        };
        window.addEventListener('resize', handleResize);

        // 组件卸载时清理资源
        return () => {
            window.removeEventListener('resize', handleResize);
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, []);

    // 股票数据变化时更新图表
    useEffect(() => {
        if (!chartInstance.current || !data || data.length === 0) return;

        // 1. 提取图表所需数据（日期、收盘价、最高价、最低价）
        const dates = data.map(item => item.date);
        const closePrices = data.map(item => item.close);
        const highPrices = data.map(item => item.high);
        const lowPrices = data.map(item => item.low);

        // 2. 图表配置：关键修复类型断言
        const option: EChartsOption = {
            title: {
                text: title,
                left: 'center',
                textStyle: { fontSize: 16, fontWeight: 'bold' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line' }, // 折线图用“线指针”更直观
                formatter: (params: CustomTooltipParams) => {
                    // 统一处理“单个对象”或“数组”参数
                    const paramList = Array.isArray(params) ? params : [params];
                    if (paramList.length === 0) return '';

                    // 格式化提示内容（带高亮日期和价格）
                    const date = paramList[0].name || '未知日期';
                    let result = `<strong>${date}</strong><br/>`;

                    paramList.forEach(param => {
                        if (!param.seriesName) return;

                        // 处理 value 为数组的情况（股票数据实际为单值，仅兜底）
                        let price = 0;
                        if (typeof param.value === 'number') {
                            price = param.value;
                        } else if (Array.isArray(param.value) && param.value.length > 0) {
                            price = param.value[0] as number;
                        } else {
                            return;
                        }

                        result += `${param.seriesName}: ${price.toFixed(2)}<br/>`;
                    });

                    return result;
                }
            },
            legend: {
                data: ['收盘价', '最高价', '最低价'],
                top: 30,
                left: 'center'
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%', // 预留底部空间，避免日期标签重叠
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLabel: {
                    rotate: 45,  // 旋转日期标签
                    interval: 0, // 显示所有日期
                    fontSize: 12
                },
                axisLine: { lineStyle: { color: '#eee' } }
            },
            yAxis: {
                type: 'value',
                name: '价格 (元)',
                nameTextStyle: { fontSize: 12, padding: [0, 0, 0, 10] }, // 替代不兼容的 marginRight
                axisLabel: { formatter: '{value}', fontSize: 12 },
                splitLine: { lineStyle: { color: '#f5f5f5' } }
            },
            // 🌟 关键修复：通过 unknown 中转类型，绕过旧版类型定义限制
            series: [
                {
                    id: 'close-price',          // 显式 string 类型 id（避免类型冲突）
                    name: '收盘价',
                    type: 'line' as const,      // 固定为折线图类型
                    data: closePrices,
                    smooth: true,               // 平滑曲线
                    lineStyle: { width: 2, color: '#4096ff' }, // 蓝色实线
                    emphasis: {
                        focus: 'series' as const  // 固定为合法值（ECharts 实际支持）
                    }
                },
                {
                    id: 'high-price',
                    name: '最高价',
                    type: 'line' as const,
                    data: highPrices,
                    smooth: true,
                    lineStyle: { width: 1.5, type: 'dashed', color: '#ff4d4f' }, // 红色虚线
                    emphasis: { focus: 'series' as const }
                },
                {
                    id: 'low-price',
                    name: '最低价',
                    type: 'line' as const,
                    data: lowPrices,
                    smooth: true,
                    lineStyle: { width: 1.5, type: 'dashed', color: '#52c41a' }, // 绿色虚线
                    emphasis: { focus: 'series' as const }
                }
                // 🔥 先转为 unknown，再转为 SeriesLine[]，绕过旧版类型检查
            ] as unknown as EChartsOption.SeriesLine[],
        };

        // 3. 应用配置到图表
        chartInstance.current.setOption(option);
    }, [data, title]);

    // 渲染图表容器
    return (
        <div
            ref={chartRef}
            style={{
                width: '100%',
                height: '400px',
                marginTop: '20px',
                marginBottom: '20px'
            }}
        />
    );
};

export default StockChart;