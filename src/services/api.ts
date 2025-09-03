// src/services/api.ts
import axios from 'axios';

// 创建axios实例，配置基础地址
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
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

export default api;
