// src/services/api.ts
import axios from 'axios';

// 创建axios实例，配置基础地址
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

const ctp_api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_CTP_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// 示例：获取hello接口数据
export const getHelloMessage = async () => {
    const response = await api.get('/hello/');
    return response.data;
};

// 示例：获取服务器时间接口数据
export const getServerTime = async () => {
    const response = await api.get('/time/');
    return response.data;
};

export const getStockData = async () => {
    const response = await api.get('/stock/');
    return response.data;
};


// 👉 新股指接口专属响应类型（仅适配 /stock-index/calculation）
export interface StockIndexCalculationResponse {
    status: string;
    msg: string;
    data: {
        [key: string]: { // 合约代码：IF2512/IM2512/IC2512
            basic_info: {
                期货合约代码: string;
                对应现货指数: string;
                现货指数代码: string;
                期货价格: number;
                现货最新价: number;
                到期日: string;
                剩余天数: number;
                数据更新时间: string;
            };
            target_indicators: {
                剩余分红: number;
                剩余分红说明: string;
                调整基差: number;
                年化基差: string;
                调整年化基差: string;
                结算价涨跌额: number;
                结算价涨跌幅: string;
                收盘价涨跌额: number;
                收盘价涨跌幅: string;
            };
        };
    };
    接口请求时间: string;
    调试信息: string;
}
export const getNewStockIndexData = async (): Promise<StockIndexCalculationResponse> => {
    try {
        const response = await ctp_api.get('/stock-index/calculation');
        return response.data;
    } catch (error) {
        console.error('【新股指接口】请求失败：', error);
        throw new Error(
            error instanceof Error
                ? `新股指接口错误：${error.message}`
                : '获取股指基差数据失败'
        );
    }
};

export { api, ctp_api };

