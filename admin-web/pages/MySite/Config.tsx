import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Spin, Alert, ColorPicker, Tabs, Upload, App } from 'antd';
import type { UploadFile } from 'antd';
import { Save, Cloud, Palette, Globe, Upload as UploadIcon } from 'lucide-react';
import { getMySiteDetail, getMySiteConfig, updateMySiteConfig, uploadFile } from '../../api/site';
import { SiteConfigRequest, Site } from '../../types';

const MySiteConfig: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [siteInfo, setSiteInfo] = useState<Site | null>(null);
  const [faviconFileList, setFaviconFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 获取站点详情
      const siteDetail = await getMySiteDetail();
      setSiteInfo(siteDetail);

      // 获取站点配置
      const config = await getMySiteConfig();
      form.setFieldsValue(config);

      // 如果有favicon，设置文件列表用于显示
      if (config.favicon) {
        setFaviconFileList([
          {
            uid: '-1',
            name: 'favicon',
            status: 'done',
            url: config.favicon,
            thumbUrl: config.favicon,
          },
        ]);
      }
    } catch (error) {
      message.error('加载配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: SiteConfigRequest) => {
    try {
      setSubmitting(true);
      // 处理颜色值
      let themeColor = values.themeColor;
      if (themeColor && typeof themeColor === 'object') {
        themeColor = (themeColor as any).toHexString?.() || themeColor;
      }
      const submitValues = {
        ...values,
        themeColor,
      };
      await updateMySiteConfig(submitValues);
      message.success('配置保存成功');
    } catch (error) {
      message.error('配置保存失败');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // Favicon 上传配置
  const faviconUploadProps = {
    name: 'file',
    listType: 'picture-card' as const,
    fileList: faviconFileList,
    maxCount: 1,
    accept: 'image/*',
    beforeUpload: () => false, // 阻止自动上传
    onChange: async ({ fileList }: { fileList: UploadFile[] }) => {
      // 如果是删除操作
      if (fileList.length === 0) {
        setFaviconFileList([]);
        form.setFieldValue('favicon', '');
        return;
      }

      const file = fileList[fileList.length - 1];

      // 如果是已上传的文件，直接设置
      if (file.status === 'done') {
        setFaviconFileList(fileList);
        return;
      }

      // 新文件需要上传
      if (file.originFileObj) {
        try {
          setUploading(true);
          const result = await uploadFile(file.originFileObj);
          const uploadedFile = {
            uid: file.uid,
            name: file.name,
            status: 'done' as const,
            url: result.url,
            thumbUrl: result.url,
          };
          setFaviconFileList([uploadedFile]);
          form.setFieldValue('favicon', result.url);
          message.success('图标上传成功');
        } catch (error) {
          message.error('图标上传失败');
          console.error(error);
          setFaviconFileList([]);
        } finally {
          setUploading(false);
        }
      }
    },
    onRemove: () => {
      setFaviconFileList([]);
      form.setFieldValue('favicon', '');
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'display',
      label: (
        <span className="flex items-center gap-2">
          <Palette size={16} />
          站点展示
        </span>
      ),
      children: (
        <div className="py-4">
          <Form.Item
            label="显示名称"
            name="displayName"
            extra="用户访问站点时看到的名称，如不设置则使用站点名称"
          >
            <Input placeholder="输入站点显示名称" />
          </Form.Item>

          <Form.Item
            label="网站图标 (Favicon)"
            name="favicon"
            extra="浏览器标签页显示的小图标，支持 ico、png、jpg 等格式"
          >
            <Input type="hidden" />
          </Form.Item>
          <Form.Item>
            <Upload {...faviconUploadProps}>
              {faviconFileList.length === 0 && (
                <div className="flex flex-col items-center justify-center">
                  <UploadIcon size={24} className="text-gray-400" />
                  <div className="mt-2 text-sm text-gray-500">
                    {uploading ? '上传中...' : '点击上传'}
                  </div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            label="主题色"
            name="themeColor"
            extra="站点的主题颜色，用于按钮、链接等元素"
          >
            <ColorPicker showText />
          </Form.Item>

          <Form.Item
            label="页脚文字"
            name="footerText"
            extra="显示在页面底部的文字信息"
          >
            <Input.TextArea
              placeholder="输入页脚文字"
              rows={2}
            />
          </Form.Item>

          <Form.Item
            label="版权信息"
            name="copyright"
            extra="显示在页面底部的版权声明"
          >
            <Input placeholder="例如: © 2024 公司名称 版权所有" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'cos',
      label: (
        <span className="flex items-center gap-2">
          <Cloud size={16} />
          COS 配置
        </span>
      ),
      children: (
        <div className="py-4">
          <Form.Item
            label="Secret ID"
            name="cosSecretId"
            extra="腾讯云访问密钥ID"
          >
            <Input.Password
              placeholder="输入新的Secret ID以更新"
              visibilityToggle
            />
          </Form.Item>

          <Form.Item
            label="Secret Key"
            name="cosSecretKey"
            extra="腾讯云访问密钥"
          >
            <Input.Password
              placeholder="输入新的Secret Key以更新"
              visibilityToggle
            />
          </Form.Item>

          <Form.Item
            label="存储桶名称"
            name="cosBucket"
            extra="COS存储桶名称，例如: my-bucket-1234567890"
          >
            <Input placeholder="输入存储桶名称" />
          </Form.Item>

          <Form.Item
            label="区域"
            name="cosRegion"
            extra="COS存储桶所在区域，例如: ap-guangzhou"
          >
            <Input placeholder="输入区域" />
          </Form.Item>

          <Form.Item
            label="CDN 域名"
            name="cosCdnDomain"
            extra="COS绑定的CDN加速域名，例如: https://cdn.example.com"
          >
            <Input placeholder="输入CDN域名" />
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">站点配置</h1>
          <p className="text-gray-500 text-sm mt-1">配置您站点的各项参数</p>
        </div>
      </div>

      {/* 站点基本信息 */}
      {siteInfo && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Globe size={20} className="text-gray-600" />
              <span>站点信息</span>
            </div>
          }
          className="mb-6"
        >
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">站点名称：</span>
              <span className="font-medium">{siteInfo.siteName}</span>
            </div>
            <div>
              <span className="text-gray-500">站点编码：</span>
              <span className="font-medium">{siteInfo.siteCode}</span>
            </div>
            <div>
              <span className="text-gray-500">域名：</span>
              <span className="font-medium text-blue-600">{siteInfo.domain}</span>
            </div>
            <div>
              <span className="text-gray-500">用户数：</span>
              <span className="font-medium">{siteInfo.userCount || 0}</span>
            </div>
          </div>
        </Card>
      )}

      <Alert
        message="安全提示"
        description="敏感配置信息（如API Key、密钥）将加密存储，页面显示时会脱敏处理。请妥善保管这些信息。"
        type="info"
        showIcon
        closable
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="max-w-4xl"
      >
        <Card className="mb-6">
          <Tabs
            items={tabItems}
            defaultActiveKey="display"
            tabPosition="left"
            style={{ minHeight: 400 }}
          />
        </Card>

        <div className="flex justify-end gap-4">
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<Save size={18} />}
          >
            保存配置
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default MySiteConfig;
