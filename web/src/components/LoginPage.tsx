import React, { useState, useContext } from 'react';
import { Hammer, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import AuthContext from '@/contexts/AuthContext';

interface LoginPageProps {
  onBack: () => void;
  onSuccess: () => void;
  onGoRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, onSuccess, onGoRegister }) => {
  const auth = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const success = await auth?.login(username, password);
      if (success) {
        onSuccess();
      } else {
        setError('用户名或密码错误');
      }
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md px-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-600 mb-8 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">返回首页</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
              <Hammer className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">登录灵匠</h1>
              <p className="text-xs text-gray-400">开启您的创意之旅</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                placeholder="请输入用户名"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all pr-12"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-400">还没有账号？</span>
            <button
              onClick={onGoRegister}
              className="text-sm text-indigo-600 font-bold ml-1 hover:underline"
            >
              立即注册
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
