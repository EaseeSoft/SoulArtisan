import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Spin, Alert, ColorPicker, Tabs, Upload, App } from 'antd';
import type { UploadFile } from 'antd';
import { Save, Palette, Monitor, FileText, Upload as UploadIcon, Settings } from 'lucide-react';
import { getSystemConfig, updateSystemConfig } from '../../api/system';
import { uploadFile } from '../../api/site';
import { SystemConfigRequest } from '../../types';
import { useSystemConfigStore } from '../../store/useSystemConfigStore';

const SystemConfigPage: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { setConfig } = useSystemConfigStore();

  // 文件列表状态
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [faviconFileList, setFaviconFileList] = useState<UploadFile[]>([]);
  const [loginBgFileList, setLoginBgFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = await getSystemConfig();
      form.setFieldsValue(config);

      // 设置已有的图片文件列表
      if (config.systemLogo) {
        setLogoFileList([
          { uid: '-1', name: 'logo', status: 'done', url: config.systemLogo, thumbUrl: config.systemLogo },
        ]);
      }
      if (config.systemFavicon) {
        setFaviconFileList([
          { uid: '-1', name: 'favicon', status: 'done', url: config.systemFavicon, thumbUrl: config.systemFavicon },
        ]);
      }
      if (config.loginBgImage) {
        setLoginBgFileList([
          { uid: '-1', name: 'loginBg', status: 'done', url: config.loginBgImage, thumbUrl: config.loginBgImage },
        ]);
      }
    } catch (error) {
      message.error('加载系统配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: SystemConfigRequest) => {
    try {
      setSubmitting(true);
      // 处理颜色值
      let primaryColor = values.primaryColor;
      if (primaryColor && typeof primaryColor === 'object') {
        primaryColor = (primaryColor as any).toHexString?.() || primaryColor;
      }
      const submitValues = {
        ...values,
        primaryColor,
      };
      await updateSystemConfig(submitValues);
      message.success('系统配置保存成功');
      // 更新全局配置
      setConfig({
        ...submitValues,
        systemTitle: submitValues.systemTitle || 'AI视频管理',
      });
    } catch (error) {
      message.error('保存配置失败');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  // 创建上传配置的通用函数
  const createUploadProps = (
    fieldName: string,
    fileList: UploadFile[],
    setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>
  ) => ({
    name: 'file',
    listType: 'picture-card' as const,
    fileList: fileList,
    maxCount: 1,
    accept: 'image/*',
    beforeUpload: () => false,
    onChange: async ({ fileList }: { fileList: UploadFile[] }) => {
      if (fileList.length === 0) {
        setFileList([]);
        form.setFieldValue(fieldName, '');
        return;
      }

      const file = fileList[fileList.length - 1];
      if (file.status === 'done') {
        setFileList(fileList);
        return;
      }

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
          setFileList([uploadedFile]);
          form.setFieldValue(fieldName, result.url);
          message.success('上传成功');
        } catch (error) {
          message.error('上传失败');
          console.error(error);
          setFileList([]);
        } finally {
          setUploading(false);
        }
      }
    },
    onRemove: () => {
      setFileList([]);
      form.setFieldValue(fieldName, '');
    },
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span className="flex items-center gap-2">
          <Monitor size={16} />
          基础配置
        </span>
      ),
      children: (
        <div className="py-4">
          <Form.Item
            label="系统标题"
            name="systemTitle"
            rules={[{ required: true, message: '请输入系统标题' }]}
            extra="显示在侧边栏顶部和浏览器标题栏"
          >
            <Input placeholder="输入系统标题，如：AI视频管理后台" />
          </Form.Item>

          <Form.Item
            label="系统 Logo"
            name="systemLogo"
            extra="显示在侧边栏顶部，建议尺寸 200x60 像素"
          >
            <Input type="hidden" />
          </Form.Item>
          <Form.Item>
            <Upload {...createUploadProps('systemLogo', logoFileList, setLogoFileList)}>
              {logoFileList.length === 0 && (
                <div className="flex flex-col items-center justify-center">
                  <UploadIcon size={24} className="text-gray-400" />
                  <div className="mt-2 text-sm text-gray-500">
                    {uploading ? '上传中...' : '上传 Logo'}
                  </div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            label="网站图标 (Favicon)"
            name="systemFavicon"
            extra="浏览器标签页显示的小图标，建议 32x32 或 64x64 像素"
          >
            <Input type="hidden" />
          </Form.Item>
          <Form.Item>
            <Upload {...createUploadProps('systemFavicon', faviconFileList, setFaviconFileList)}>
              {faviconFileList.length === 0 && (
                <div className="flex flex-col items-center justify-center">
                  <UploadIcon size={24} className="text-gray-400" />
                  <div className="mt-2 text-sm text-gray-500">
                    {uploading ? '上传中...' : '上传图标'}
                  </div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'login',
      label: (
        <span className="flex items-center gap-2">
          <Monitor size={16} />
          登录页面
        </span>
      ),
      children: (
        <div className="py-4">
          <Form.Item
            label="登录页标题"
            name="loginTitle"
            extra="登录页面显示的主标题"
          >
            <Input placeholder="输入登录页标题" />
          </Form.Item>

          <Form.Item
            label="登录页副标题"
            name="loginSubtitle"
            extra="登录页面显示的副标题"
          >
            <Input placeholder="输入登录页副标题" />
          </Form.Item>

          <Form.Item
            label="登录页背景图"
            name="loginBgImage"
            extra="登录页面的背景图片，建议尺寸 1920x1080"
          >
            <Input type="hidden" />
          </Form.Item>
          <Form.Item>
            <Upload {...createUploadProps('loginBgImage', loginBgFileList, setLoginBgFileList)}>
              {loginBgFileList.length === 0 && (
                <div className="flex flex-col items-center justify-center">
                  <UploadIcon size={24} className="text-gray-400" />
                  <div className="mt-2 text-sm text-gray-500">
                    {uploading ? '上传中...' : '上传背景图'}
                  </div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'copyright',
      label: (
        <span className="flex items-center gap-2">
          <FileText size={16} />
          版权信息
        </span>
      ),
      children: (
        <div className="py-4">
          <Form.Item
            label="版权信息"
            name="copyright"
            extra="显示在页面底部的版权声明"
          >
            <Input placeholder="例如：© 2025 XX公司 版权所有" />
          </Form.Item>

          <Form.Item
            label="页脚文字"
            name="footerText"
            extra="显示在页面底部的附加文字"
          >
            <Input.TextArea placeholder="输入页脚文字" rows={2} />
          </Form.Item>

          <Form.Item
            label="ICP 备案号"
            name="icpBeian"
            extra="网站备案号，如：京ICP备XXXXXXXX号"
          >
            <Input placeholder="输入备案号" />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'theme',
      label: (
        <span className="flex items-center gap-2">
          <Palette size={16} />
          主题设置
        </span>
      ),
      children: (
        <div className="py-4">
          <Form.Item
            label="主题色"
            name="primaryColor"
            extra="系统的主题颜色，用于按钮、链接等元素"
          >
            <ColorPicker showText />
          </Form.Item>
        </div>
      ),
    },
    {
      key: 'concurrency',
      label: (
        <span className="flex items-center gap-2">
          <Settings size={16} />
          并发控制
        </span>
      ),
      children: (
        <div className="py-4">
          <Alert
            message="并发控制说明"
            description="设置每个用户的图片和视频生成并发任务数限制，避免第三方API调用超出配额。设置为0表示不限制。"
            type="warning"
            showIcon
            className="mb-6"
          />

          {/* 配置表单 */}
          <Form.Item
            label="图片生成并发限制"
            name="imageConcurrencyLimit"
            rules={[{ required: true, message: '请输入并发限制数' }]}
            extra="每个用户同时处理的图片生成任务数量上限，建议范围：5-20，0表示不限制"
          >
            <Input type="number" min={0} max={100} placeholder="默认: 10" />
          </Form.Item>

          <Form.Item
            label="视频生成并发限制"
            name="videoConcurrencyLimit"
            rules={[{ required: true, message: '请输入并发限制数' }]}
            extra="每个用户同时处理的视频生成任务数量上限，建议范围：1-10，0表示不限制"
          >
            <Input type="number" min={0} max={50} placeholder="默认: 5" />
          </Form.Item>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">系统配置</h1>
          <p className="text-gray-500 text-sm mt-1">管理系统的全局配置，包括标题、Logo、版权等信息</p>
        </div>
      </div>

      <Alert
        message="配置说明"
        description="修改系统配置后会立即生效，影响所有用户看到的管理后台界面。请谨慎修改。"
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
            defaultActiveKey="basic"
            tabPosition="left"
            style={{ minHeight: 400 }}
          />
        </Card>

        <div className="flex justify-end gap-4">
          <Button onClick={() => form.resetFields()}>
            重置
          </Button>
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

export default SystemConfigPage;
