const API_BASE = '/auth';

export interface User {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const getToken = () => localStorage.getItem('token');

export const setToken = (token: string) => localStorage.setItem('token', token);

export const clearToken = () => localStorage.removeItem('token');

export const isLoggedIn = () => !!getToken();

export const login = async (username: string, password: string): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (data.code !== 200) throw new Error(data.message || '登录失败');
  setToken(data.data.token);
  return data.data;
};

export const register = async (
  username: string,
  password: string,
  email?: string,
  nickname?: string,
  phone?: string
): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email, nickname, phone })
  });
  const data = await res.json();
  if (data.code !== 200) throw new Error(data.message || '注册失败');
  setToken(data.data.token);
  return data.data;
};

export const logout = async () => {
  const token = getToken();
  if (token) {
    await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: { 'Authorization': token }
    }).catch(() => {});
  }
  clearToken();
};

export const getTokenInfo = async () => {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/token-info`, {
    headers: { 'Authorization': token }
  });
  const data = await res.json();
  if (data.code !== 200) return null;
  return data.data;
};

export const getSystemConfig = async () => {
  const res = await fetch(`${API_BASE}/system-config`);
  const data = await res.json();
  return data.data;
};
