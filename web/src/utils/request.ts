/**
 * Axios 请求工具类
 *
 * 功能：
 * - 统一的请求配置
 * - 自动添加 JWT Token
 * - 统一错误处理
 * - 请求/响应拦截
 */

import type {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import axios from 'axios';
import toast from 'react-hot-toast';

/**
 * 自定义请求配置，扩展 AxiosRequestConfig
 */
export interface CustomRequestConfig extends AxiosRequestConfig {
    /** 是否禁用自动错误提示 Toast，默认 false */
    disableErrorToast?: boolean;
}

/**
 * 显示错误提示
 */
const showErrorToast = (message: string) => {
    toast.error(message, {
        duration: 4000,
        position: 'top-center',
        style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
        },
        icon: '⚠️',
        iconTheme: {
            primary: '#fff',
            secondary: '#667eea',
        },
    });
};

/**
 * 导出错误提示方法，供其他模块使用
 */
export const showError = showErrorToast;

/**
 * 导出成功提示方法，供其他模块使用
 */
export const showSuccess = (message: string) => {
    toast.success(message, {
        duration: 3000,
        position: 'top-center',
        style: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
        },
        icon: '✅',
        iconTheme: {
            primary: '#fff',
            secondary: '#667eea',
        },
    });
};

/**
 * 导出警告提示方法，供其他模块使用
 */
export const showWarning = (message: string) => {
    toast(message, {
        duration: 3000,
        position: 'top-center',
        style: {
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
        },
        icon: '⚡',
        iconTheme: {
            primary: '#fff',
            secondary: '#f093fb',
        },
    });
};

/**
 * 导出信息提示方法，供其他模块使用
 */
export const showInfo = (message: string) => {
    toast(message, {
        duration: 3000,
        position: 'top-center',
        style: {
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: '#fff',
            padding: '16px 24px',
            borderRadius: '12px',
            fontSize: '15px',
            fontWeight: '500',
            boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3), 0 4px 8px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
        },
        icon: 'ℹ️',
        iconTheme: {
            primary: '#fff',
            secondary: '#4facfe',
        },
    });
};

/**
 * 获取友好的错误消息
 */
interface ErrorResponse {
    msg?: string;
    message?: string;
    error?: string;
}

const getFriendlyErrorMessage = (error: AxiosError): string => {
    if (error.response) {
        const {status, data} = error.response;
        const errorData = data as ErrorResponse;
        
        // 优先使用后端返回的错误信息
        if (errorData?.msg) {
            return errorData.msg;
        }
        if (errorData?.message) {
            return errorData.message;
        }
        if (errorData?.error) {
            return errorData.error;
        }
        
        // 根据状态码返回友好提示
        switch (status) {
            case 400:
                return '请求参数错误，请检查输入内容';
            case 401:
                return '登录已过期，请重新登录';
            case 403:
                return '权限不足，无法访问该资源';
            case 404:
                return '请求的资源不存在';
            case 408:
                return '请求超时，请检查网络连接';
            case 409:
                return '资源冲突，请刷新后重试';
            case 422:
                return '数据验证失败，请检查输入内容';
            case 429:
                return '请求过于频繁，请稍后再试';
            case 500:
                return '服务器内部错误，请稍后重试';
            case 502:
                return '网关错误，服务暂时不可用';
            case 503:
                return '服务暂时不可用，请稍后重试';
            case 504:
                return '网关超时，请稍后重试';
            default:
                return `请求失败 (${status})`;
        }
    } else if (error.request) {
        // 请求已发送但没有收到响应
        if (error.code === 'ECONNABORTED') {
            return '请求超时，请检查网络连接';
        }
        if (error.code === 'ERR_NETWORK') {
            return '网络连接失败，请检查网络设置';
        }
        return '网络错误，无法连接到服务器';
    } else {
        // 请求配置出错
        return error.message || '请求配置错误';
    }
};

// API 基础配置
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost';
const TIMEOUT = 300000; // 30秒超时

// 创建 axios 实例
const request: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * 请求拦截器
 * - 自动添加 Authorization 头
 * - 可以在这里添加其他通用请求头
 */
request.interceptors.request.use(
    (config) => {
        // 从 localStorage 获取 token（注意 key 名称是 accessToken，不是 access_token）
        const token = localStorage.getItem('accessToken');

        if (token) {
            // 添加 Authorization 头
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 打印请求日志（开发环境）
        if (import.meta.env.DEV) {
            console.log(`[Request] ${config.method?.toUpperCase()} ${config.url}`, {
                params: config.params,
                data: config.data,
            });
        }

        return config;
    },
    (error: AxiosError) => {
        console.error('[Request Error]', error);
        return Promise.reject(error);
    }
);

/**
 * 业务响应数据类型
 */
interface BusinessResponse<T = unknown> {
    code: number;
    msg?: string;
    message?: string;
    data?: T;
}

/**
 * 响应拦截器
 * - 统一处理响应数据
 * - 统一处理错误
 * - Token 过期处理
 * - 检查业务状态码（code 字段）
 */
request.interceptors.response.use(
    (response: AxiosResponse) => {
        // 打印响应日志（开发环境）
        if (import.meta.env.DEV) {
            console.log(`[Response] ${response.config.url}`, response.data);
        }

        // 检查响应体中的业务状态码（code 字段）
        const responseData = response.data as BusinessResponse;

        // 如果存在 code 字段且不是 200，表示业务错误
        if (responseData?.code !== undefined && responseData.code !== 200) {
            // 提取错误消息
            const errorMessage = responseData.msg || responseData.message || '请求失败';

            // 特殊处理业务错误码 401（认证失败）
            if (responseData.code === 401) {
                // 清除本地存储的 token
                localStorage.removeItem('accessToken');
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('userInfo');

                // 打印业务错误日志（开发环境）
                if (import.meta.env.DEV) {
                    console.error('[Business Error 401]', {
                        code: responseData.code,
                        message: errorMessage,
                        url: response.config.url,
                        data: responseData
                    });
                }

                // 检查是否禁用了错误提示
                const config = response.config as CustomRequestConfig;
                const shouldShowToast = !config?.disableErrorToast;

                // 显示错误提示（如果未禁用）
                if (shouldShowToast) {
                    showErrorToast('登录已过期，即将跳转到登录页');
                }

                // 延迟跳转到登录页（给用户时间看到错误提示）
                setTimeout(() => {
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }, 1500);
            }

            // 创建一个标准的 AxiosError
            const businessError = new Error(errorMessage) as AxiosError;
            businessError.name = 'AxiosError';
            businessError.isAxiosError = true;
            businessError.config = response.config;
            businessError.request = response.request;
            businessError.response = response; // 保持原始response
            businessError.code = String(responseData.code);
            businessError.message = errorMessage;
            businessError.toJSON = () => ({});

            // 修改 response.status 为业务状态码
            Object.defineProperty(businessError.response, 'status', {
                value: responseData.code,
                writable: true,
                enumerable: true,
                configurable: true
            });

            // 打印业务错误日志（开发环境，非401的情况）
            if (import.meta.env.DEV && responseData.code !== 401) {
                console.error('[Business Error]', {
                    code: responseData.code,
                    message: errorMessage,
                    url: response.config.url,
                    data: responseData
                });
            }

            return Promise.reject(businessError);
        }

        // 直接返回 response，让调用方自己处理
        return response;
    },
    (error: AxiosError) => {
        // 获取友好的错误消息
        const friendlyMessage = getFriendlyErrorMessage(error);
        
        // 打印错误日志（开发环境）
        if (import.meta.env.DEV) {
            console.error('[Response Error]', {
                status: error.response?.status,
                data: error.response?.data,
                message: friendlyMessage,
                error
            });
        }
        
        // 检查是否禁用了错误提示
        const config = error.config as CustomRequestConfig;
        const shouldShowToast = !config?.disableErrorToast;
        
        // 检查是否为401错误（HTTP状态码或业务状态码）
        const httpStatus = error.response?.status;
        const businessCode = (error.response?.data as BusinessResponse)?.code;
        const is401Error = httpStatus === 401 || businessCode === 401;
        
        // 特殊处理 401 未授权
        if (is401Error) {
            // 清除本地存储的 token
            localStorage.removeItem('accessToken');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('userInfo');
            
            // 显示错误提示（如果未禁用）
            if (shouldShowToast) {
                showErrorToast('登录已过期，即将跳转到登录页');
            }
            
            // 延迟跳转到登录页（给用户时间看到错误提示）
            setTimeout(() => {
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }, 1500);
        } else {
            // 非401错误才显示错误提示（401已经在上面显示了）
            if (shouldShowToast) {
                showErrorToast(friendlyMessage);
            }
        }
        
        return Promise.reject(error);
    }
);

/**
 * 通用请求方法封装
 */

// GET 请求
export const get = <T = any>(url: string, config?: CustomRequestConfig): Promise<AxiosResponse<T>> => {
    return request.get<T>(url, config);
};

// POST 请求
export const post = <T = any>(url: string, data?: any, config?: CustomRequestConfig): Promise<AxiosResponse<T>> => {
    return request.post<T>(url, data, config);
};

// PUT 请求
export const put = <T = any>(url: string, data?: any, config?: CustomRequestConfig): Promise<AxiosResponse<T>> => {
    return request.put<T>(url, data, config);
};

// DELETE 请求
export const del = <T = any>(url: string, config?: CustomRequestConfig): Promise<AxiosResponse<T>> => {
    return request.delete<T>(url, config);
};

// PATCH 请求
export const patch = <T = any>(url: string, data?: any, config?: CustomRequestConfig): Promise<AxiosResponse<T>> => {
    return request.patch<T>(url, data, config);
};

/**
 * 上传文件
 */
export const upload = <T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<T>> => {
    const formData = new FormData();
    formData.append('file', file);

    return request.post<T>(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percentCompleted);
            }
        },
    });
};

/**
 * 下载文件
 */
export const download = async (url: string, filename?: string): Promise<void> => {
    const response = await request.get(url, {
        responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename || 'download';
    link.click();
    window.URL.revokeObjectURL(link.href);
};

// 导出 axios 实例，供特殊需求使用
export default request;
