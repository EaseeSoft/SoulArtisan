import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, message } from 'antd';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/useAuthStore';
import { useSystemConfigStore } from '../../store/useSystemConfigStore';
import { Lock, User } from 'lucide-react';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { loadUser } = useAuthStore();
  const { config } = useSystemConfigStore();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setLoading(true);

    try {
      const response = await login(values.username, values.password);
      message.success('登录成功');

      // 重新加载用户信息
      await loadUser();

      navigate('/dashboard');
    } catch (err: any) {
      message.error(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4"
      style={config.loginBgImage ? {
        backgroundImage: `url(${config.loginBgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-center">
          {config.systemLogo ? (
            <img src={config.systemLogo} alt="Logo" className="h-16 mx-auto mb-4" />
          ) : (
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Lock className="text-white" size={32} />
            </div>
          )}
          <h2 className="text-3xl font-bold text-white mb-2">{config.loginTitle || '管理后台'}</h2>
          <p className="text-indigo-100">{config.loginSubtitle || config.systemTitle}</p>
        </div>

        <div className="p-8">
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            initialValues={{
              username: '',
              password: '',
            }}
          >
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<User className="text-gray-400" size={18} />}
                placeholder="请输入用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<Lock className="text-gray-400" size={18} />}
                placeholder="请输入密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;