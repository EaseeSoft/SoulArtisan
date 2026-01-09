import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Button, message, Card } from 'antd';
import { ArrowLeft, Save } from 'lucide-react';
import { createSite } from '../../api/site';
import { SiteCreateRequest } from '../../types';

const CreateSite: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: SiteCreateRequest) => {
    try {
      setLoading(true);
      await createSite(values);
      message.success('站点创建成功');
      navigate('/sites');
    } catch (error) {
      // 错误已在 request 拦截器中处理，这里只记录日志
      console.error('Failed to create site', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/sites')}
        >
          返回
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">创建站点</h1>
          <p className="text-gray-500 text-sm mt-1">填写详细信息以创建新站点</p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ sort: 0 }}
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">站点信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="站点名称"
                  name="siteName"
                  rules={[{ required: true, message: '请输入站点名称' }]}
                >
                  <Input placeholder="例如：营销门户" />
                </Form.Item>

                <Form.Item
                  label="站点编码"
                  name="siteCode"
                  rules={[
                    { required: true, message: '请输入站点编码' },
                    { pattern: /^[a-z0-9_-]+$/, message: '只能包含小写字母、数字、下划线和短横线' }
                  ]}
                  extra="唯一标识符，建议使用小写英文和数字"
                >
                  <Input placeholder="例如：marketing-portal" />
                </Form.Item>
              </div>

              <Form.Item
                label="站点域名"
                name="domain"
                rules={[{ required: true, message: '请输入站点域名' }]}
              >
                <Input placeholder="https://example.com" />
              </Form.Item>

              <Form.Item
                label="Logo URL"
                name="logo"
              >
                <Input placeholder="https://example.com/logo.png" />
              </Form.Item>

              <Form.Item
                label="站点描述"
                name="description"
              >
                <Input.TextArea rows={3} placeholder="站点的简要描述" />
              </Form.Item>

              <Form.Item
                label="排序"
                name="sort"
                extra="数字越小越靠前"
              >
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4">管理员信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Form.Item
                  label="管理员账号"
                  name="adminUsername"
                  rules={[
                    { required: true, message: '请输入管理员账号' },
                    { min: 4, message: '账号长度至少4位' }
                  ]}
                >
                  <Input placeholder="admin" />
                </Form.Item>

                <Form.Item
                  label="管理员密码"
                  name="adminPassword"
                  rules={[
                    { required: true, message: '请输入管理员密码' },
                    { min: 6, message: '密码长度至少6位' }
                  ]}
                >
                  <Input.Password placeholder="至少6位" />
                </Form.Item>
              </div>

              <Form.Item
                label="管理员姓名"
                name="adminRealName"
                rules={[{ required: true, message: '请输入管理员姓名' }]}
              >
                <Input placeholder="张三" />
              </Form.Item>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t mt-6">
            <Button onClick={() => navigate('/sites')}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<Save size={18} />}
            >
              创建站点
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default CreateSite;
