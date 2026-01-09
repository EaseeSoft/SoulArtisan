import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Button, message, Card, Spin } from 'antd';
import { ArrowLeft, Save } from 'lucide-react';
import { getSiteDetail, updateSite } from '../../api/site';
import { SiteUpdateRequest } from '../../types';

const EditSite: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSiteDetail();
    }
  }, [id]);

  const fetchSiteDetail = async () => {
    try {
      setLoading(true);
      const site = await getSiteDetail(Number(id));
      form.setFieldsValue({
        siteName: site.siteName,
        domain: site.domain,
        logo: site.logo,
        description: site.description,
        sort: site.sort,
      });
    } catch (error) {
      // 错误已在 request 拦截器中处理
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: SiteUpdateRequest) => {
    try {
      setSubmitting(true);
      await updateSite(Number(id), values);
      message.success('站点更新成功');
      navigate('/sites');
    } catch (error) {
      // 错误已在 request 拦截器中处理
      console.error('Failed to update site', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-800">编辑站点</h1>
          <p className="text-gray-500 text-sm mt-1">更新站点的基本信息</p>
        </div>
      </div>

      <Card className="max-w-4xl">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="站点名称"
            name="siteName"
            rules={[{ required: true, message: '请输入站点名称' }]}
          >
            <Input placeholder="例如：营销门户" />
          </Form.Item>

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

          <div className="flex justify-end gap-4 pt-6 border-t mt-6">
            <Button onClick={() => navigate('/sites')}>
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<Save size={18} />}
            >
              保存更改
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default EditSite;
