import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import { StockItem } from '@/app/page';

// 组件属性类型
interface StockChartProps {
    data: StockItem[];
    title: string;
    theme?: 'light' | 'dark';
    textColor?: string;
    gridColor?: string;
    seriesColors?: {
        close: string;
        high: string;
        low: string;
    };
}

// 默认样式配置（深色科技风）
const DEFAULT_STYLES = {
    dark: {
        textColor: '#e2e8f0',
        gridColor: '#334155',
        axisLineColor: '#475569',
        tooltipBg: '#1e293b',
        tooltipBorder: '#475569',
        seriesColors: {
            close: '#22d3ee',
            high: '#ef4444',
            low: '#22c55e'
        }
    },
    light: {
        textColor: '#1e293b',
        gridColor: '#f1f5f9',
        axisLineColor: '#cbd5e1',
        tooltipBg: '#ffffff',
        tooltipBorder: '#e2e8f0',
        seriesColors: {
            close: '#4096ff',
            high: '#ff4d4f',
            low: '#52c41a'
        }
    }
};

const StockChart = ({
                        data,
                        title,
                        theme = 'dark',
                        textColor,
                        gridColor,
                        seriesColors
                    }: StockChartProps) => {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<ECharts | null>(null);

    // 合并样式配置
    const styleConfig = {
        ...DEFAULT_STYLES[theme],
        textColor: textColor || DEFAULT_STYLES[theme].textColor,
        gridColor: gridColor || DEFAULT_STYLES[theme].gridColor,
        seriesColors: seriesColors || DEFAULT_STYLES[theme].seriesColors
    };

    // 初始化图表
    useEffect(() => {
        if (chartRef.current && !chartInstance.current) {
            chartInstance.current = echarts.init(chartRef.current);
        }

        const handleResize = () => {
            chartInstance.current?.resize();
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, []);

    // 更新图表（移除所有导致类型错误的功能）
    useEffect(() => {
        if (!chartInstance.current || !data || data.length === 0) return;

        // 提取数据
        const dates = data.map(item => item.date);
        const closePrices = data.map(item => item.close);
        const highPrices = data.map(item => item.high);
        const lowPrices = data.map(item => item.low);

        // 简化版图表配置（无类型错误）
        const option: EChartsOption = {
            title: {
                text: title,
                left: 'center',
                textStyle: {
                    fontSize: 16,
                    fontWeight: 600 as const,
                    color: styleConfig.textColor
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'line' },
                backgroundColor: styleConfig.tooltipBg,
                borderColor: styleConfig.tooltipBorder,
                borderWidth: 1,
                textStyle: { color: styleConfig.textColor }
                // 移除自定义formatter以避免类型错误
            },
            legend: {
                data: ['收盘价', '最高价', '最低价'],
                top: 30,
                left: 'center',
                textStyle: { color: styleConfig.textColor }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '15%',
                top: '15%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                data: dates,
                axisLabel: {
                    rotate: 45,
                    color: styleConfig.textColor
                },
                axisLine: {
                    lineStyle: { color: styleConfig.axisLineColor }
                }
            },
            yAxis: {
                type: 'value',
                name: '价格 (元)',
                nameTextStyle: { color: styleConfig.textColor },
                axisLabel: { color: styleConfig.textColor },
                axisLine: {
                    lineStyle: { color: styleConfig.axisLineColor }
                },
                splitLine: {
                    lineStyle: { color: styleConfig.gridColor }
                }
            },
            // 简化系列配置，移除冲突属性
            series: [
                {
                    name: '收盘价',
                    type: 'line' as const,
                    data: closePrices,
                    smooth: true,
                    lineStyle: {
                        width: 2,
                        color: styleConfig.seriesColors.close
                    }
                },
                {
                    name: '最高价',
                    type: 'line' as const,
                    data: highPrices,
                    smooth: true,
                    lineStyle: {
                        width: 1.5,
                        type: 'dashed' as const,
                        color: styleConfig.seriesColors.high
                    }
                },
                {
                    name: '最低价',
                    type: 'line' as const,
                    data: lowPrices,
                    smooth: true,
                    lineStyle: {
                        width: 1.5,
                        type: 'dashed' as const,
                        color: styleConfig.seriesColors.low
                    }
                }
            ]
        };

        chartInstance.current.setOption(option, true);
    }, [data, title, styleConfig]);

    return (
        <div
            ref={chartRef}
            style={{
                width: '100%',
                height: '400px',
                marginTop: '8px',
                marginBottom: '8px'
            }}
        />
    );
};

export default StockChart;