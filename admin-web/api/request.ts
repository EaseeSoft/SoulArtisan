import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { showMessage } from '../utils/antdStatic';

// API 基础地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// 创建 axios 实例
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response;

    // 后端统一响应格式: { code: number, message: string, data: any }
    if (data.code === 200) {
      return data.data;
    }

    // 处理业务错误
    const errorMsg = data.message || data.msg || '请求失败';
    showMessage.error(errorMsg);
    return Promise.reject(new Error(errorMsg));
  },
  (error: AxiosError<any>) => {
    // 处理 HTTP 错误
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          showMessage.error('未登录或登录已过期，请重新登录');
          // 清除token并跳转到登录页
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
          window.location.href = '#/login';
          break;
        case 403:
          showMessage.error(data?.message || data?.msg || '权限不足');
          break;
        case 404:
          showMessage.error('请求的资源不存在');
          break;
        case 500:
          showMessage.error(data?.message || data?.msg || '服务器错误');
          break;
        default:
          showMessage.error(data?.message || data?.msg || `请求失败 (${status})`);
      }
    } else if (error.request) {
      showMessage.error('网络错误，请检查网络连接');
    } else {
      showMessage.error(error.message || '请求失败');
    }

    return Promise.reject(error);
  }
);

export default request;
