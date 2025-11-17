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
export interface StockItem { // 股票数据的单条记录类型
    date: string;
    open: number;
    close: number;
    high: number;
    low: number;
}
export interface StockResponse { // 股票接口的完整响应类型
    stock_code: string;
    stock_name: string;
    data: StockItem[];
    message: string;
    error?: string; // 可选：后端可能返回的错误信息字段
}

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

export const getStockData = async (stockCode: string): Promise<StockResponse> => {
    try {
        // 发送POST请求：基础地址 + /stock/ → 最终地址：http://127.0.0.1:8000/api/stock/
        const response = await api.post<StockResponse>('/stock/', {
            stock_code: stockCode, // 参数名与后端保持一致（必须和后端接收的key相同）
        });

        // Axios会自动解析JSON，直接返回数据
        return response.data;

    } catch (error) {
        // 精细化错误处理（区分网络错误、后端响应错误）
        if (axios.isAxiosError(error)) {
            // 情况1：有响应（如400参数错误、404路径错误、500后端异常）
            if (error.response) {
                const errorMsg =
                    error.response.data?.error || // 优先取后端返回的error字段
                    `请求失败 [${error.response.status}]: ${error.response.statusText}`;
                throw new Error(errorMsg);
            }
            // 情况2：无响应（如网络中断、超时）
            else if (error.request) {
                throw new Error('网络异常：无法连接到后端服务，请检查后端是否启动');
            }
            // 情况3：请求配置错误（如参数格式错）
            else {
                throw new Error(`请求配置错误：${error.message}`);
            }
        }
        // 非Axios错误（如类型错误）
        else {
            throw new Error(`未知错误：${error instanceof Error ? error.message : '获取股票数据失败'}`);
        }
    }
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

