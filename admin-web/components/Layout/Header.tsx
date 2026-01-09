import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Bell, Search, Settings, User as UserIcon, Lock } from 'lucide-react';
import { Dropdown, Badge, Avatar, Modal, Form, Input, App } from 'antd';
import type { MenuProps } from 'antd';
import { updatePassword } from '../../api/auth';

const Header: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const [searchValue, setSearchValue] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form] = Form.useForm();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === 'password') {
      setPasswordModalVisible(true);
    }
  };

  const handlePasswordSubmit = async (values: { oldPassword: string; newPassword: string }) => {
    try {
      setPasswordLoading(true);
      await updatePassword(values.oldPassword, values.newPassword);
      message.success('密码修改成功');
      setPasswordModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('密码修改失败');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordModalClose = () => {
    setPasswordModalVisible(false);
    form.resetFields();
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserIcon size={14} />,
      label: '个人信息',
    },
    {
      key: 'password',
      icon: <Lock size={14} />,
      label: '修改密码',
    },
    {
      key: 'settings',
      icon: <Settings size={14} />,
      label: '账户设置',
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 w-64">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="全局搜索..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="bg-transparent border-none outline-none text-sm text-gray-600 w-full"
        />
      </div>

      <div className="flex items-center gap-6">
        <Badge count={3} size="small">
          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell size={20} />
          </button>
        </Badge>

        <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-gray-800">{user?.realName}</div>
            <div className="text-xs text-gray-500">
              {user?.role === 'SYSTEM_ADMIN' ? '系统管理员' : '站点管理员'}
            </div>
          </div>
          <Dropdown menu={{ items: menuItems, onClick: handleMenuClick }} placement="bottomRight">
            <Avatar
              size={40}
              src={user?.avatar}
              style={{ backgroundColor: '#6366f1', cursor: 'pointer' }}
            >
              {user?.realName?.charAt(0) || 'U'}
            </Avatar>
          </Dropdown>
        </div>
      </div>

      {/* 修改密码弹框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={handlePasswordModalClose}
        onOk={() => form.submit()}
        okText="确认修改"
        cancelText="取消"
        confirmLoading={passwordLoading}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordSubmit}
        >
          <Form.Item
            label="原密码"
            name="oldPassword"
            rules={[{ required: true, message: '请输入原密码' }]}
          >
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度不能少于6位' },
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </header>
  );
};

export default Header;