import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Space, Tag, Modal, Pagination, Form, Input, InputNumber, Tabs, Upload, ColorPicker, Spin, Alert, App } from 'antd';
import type { UploadFile } from 'antd';
import { Edit, Trash2, Plus, Power, Settings, Save, Key, Cloud, Database, Palette, Upload as UploadIcon } from 'lucide-react';
import { getSiteList, updateSiteStatus, deleteSite, getSiteConfig, updateSiteConfig, uploadFile } from '../../api/site';
import { Site, SiteConfigRequest } from '../../types';

const SiteList: React.FC = () => {
  const { message, modal } = App.useApp();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 配置弹框相关状态
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSubmitting, setConfigSubmitting] = useState(false);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [configForm] = Form.useForm();
  const [faviconFileList, setFaviconFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchSites = async (page: number = currentPage, size: number = pageSize) => {
    setLoading(true);
    try {
      const result = await getSiteList(page, size);
      setSites(result.list);
      setTotal(result.total);
      setCurrentPage(result.page);
      setPageSize(result.pageSize);
    } catch (error) {
      message.error('加载站点列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleToggleStatus = async (site: Site) => {
    const newStatus = site.status === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? '启用' : '禁用';

    modal.confirm({
      title: `确认${statusText}站点`,
      content: `确定要${statusText}站点 "${site.siteName}" 吗？`,
      onOk: async () => {
        try {
          await updateSiteStatus(site.id, newStatus);
          message.success(`${statusText}成功`);
          fetchSites();
        } catch (error) {
          message.error(`${statusText}失败`);
        }
      },
    });
  };

  const handleDelete = async (site: Site) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除站点 "${site.siteName}" 吗？此操作无法撤销。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteSite(site.id);
          message.success('删除成功');
          fetchSites();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  // 打开配置弹框
  const handleOpenConfig = async (site: Site) => {
    setCurrentSite(site);
    setConfigModalVisible(true);
    setConfigLoading(true);
    setFaviconFileList([]);
    configForm.resetFields();

    try {
      const config = await getSiteConfig(site.id);
      configForm.setFieldsValue(config);

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
      setConfigLoading(false);
    }
  };

  // 关闭配置弹框
  const handleCloseConfig = () => {
    setConfigModalVisible(false);
    setCurrentSite(null);
    configForm.resetFields();
    setFaviconFileList([]);
  };

  // 提交配置
  const handleSubmitConfig = async (values: SiteConfigRequest) => {
    if (!currentSite) return;

    try {
      setConfigSubmitting(true);
      // 处理颜色值
      let themeColor = values.themeColor;
      if (themeColor && typeof themeColor === 'object') {
        themeColor = (themeColor as any).toHexString?.() || themeColor;
      }
      const submitValues = {
        ...values,
        themeColor,
      };
      await updateSiteConfig(currentSite.id, submitValues);
      message.success('配置保存成功');
      handleCloseConfig();
    } catch (error) {
      message.error('配置保存失败');
      console.error(error);
    } finally {
      setConfigSubmitting(false);
    }
  };

  // Favicon 上传配置
  const faviconUploadProps = {
    name: 'file',
    listType: 'picture-card' as const,
    fileList: faviconFileList,
    maxCount: 1,
    accept: 'image/*',
    beforeUpload: () => false,
    onChange: async ({ fileList }: { fileList: UploadFile[] }) => {
      if (fileList.length === 0) {
        setFaviconFileList([]);
        configForm.setFieldValue('favicon', '');
        return;
      }

      const file = fileList[fileList.length - 1];

      if (file.status === 'done') {
        setFaviconFileList(fileList);
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
          setFaviconFileList([uploadedFile]);
          configForm.setFieldValue('favicon', result.url);
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
      configForm.setFieldValue('favicon', '');
    },
  };

  const handlePageChange = (page: number, size?: number) => {
    fetchSites(page, size || pageSize);
  };

  const columns = [
    {
      title: '站点信息',
      key: 'siteInfo',
      render: (record: Site) => (
        <div>
          <div className="font-semibold text-gray-800">{record.siteName}</div>
          <div className="text-xs text-gray-500">{record.siteCode}</div>
          <div className="text-xs text-blue-500">{record.domain}</div>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '管理员',
      key: 'admin',
      width: 150,
      render: (record: Site) => (
        <div>
          <div className="text-sm text-gray-800">{record.adminRealName || '-'}</div>
          <div className="text-xs text-gray-500">{record.adminUsername}</div>
        </div>
      ),
    },
    {
      title: '统计',
      key: 'stats',
      width: 120,
      render: (record: Site) => (
        <div className="text-sm">
          <div>用户: {record.userCount || 0}</div>
          <div>项目: {record.projectCount || 0}</div>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => <span className="text-sm text-gray-500">{time}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (record: Site) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={record.status === 1 ? <Power size={16} /> : <Power size={16} />}
            onClick={() => handleToggleStatus(record)}
            title={record.status === 1 ? '禁用' : '启用'}
          />
          <Button
            type="text"
            size="small"
            icon={<Settings size={16} />}
            onClick={() => handleOpenConfig(record)}
            title="配置"
          />
          <Link to={`/sites/edit/${record.id}`}>
            <Button
              type="text"
              size="small"
              icon={<Edit size={16} />}
              title="编辑"
            />
          </Link>
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => handleDelete(record)}
            title="删除"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">站点管理</h1>
          <p className="text-gray-500 text-sm mt-1">管理所有注册站点及其状态</p>
        </div>
        <Link to="/sites/create">
          <Button type="primary" icon={<Plus size={18} />}>
            创建站点
          </Button>
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={sites}
        loading={loading}
        rowKey="id"
        pagination={false}
        bordered
      />

      <div className="flex justify-end">
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={total}
          onChange={handlePageChange}
          showSizeChanger
          showTotal={(total) => `共 ${total} 条`}
        />
      </div>

      {/* 站点配置弹框 */}
      <Modal
        title={`站点配置 - ${currentSite?.siteName || ''}`}
        open={configModalVisible}
        onCancel={handleCloseConfig}
        width={800}
        footer={null}
        destroyOnClose
      >
        {configLoading ? (
          <div className="flex items-center justify-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Alert
              message="安全提示"
              description="敏感配置信息（如API Key、密钥）将加密存储，页面显示时会脱敏处理。"
              type="info"
              showIcon
              closable
              className="mb-4"
            />
            <Form
              form={configForm}
              layout="vertical"
              onFinish={handleSubmitConfig}
            >
              <Tabs
                defaultActiveKey="display"
                tabPosition="left"
                style={{ minHeight: 400 }}
                items={[
                  {
                    key: 'display',
                    label: (
                      <span className="flex items-center gap-2">
                        <Palette size={16} />
                        站点展示
                      </span>
                    ),
                    children: (
                      <div className="py-4 pl-4">
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
                          extra="浏览器标签页显示的小图标"
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
                          extra="站点的主题颜色"
                        >
                          <ColorPicker showText />
                        </Form.Item>
                        <Form.Item
                          label="页脚文字"
                          name="footerText"
                          extra="显示在页面底部的文字信息"
                        >
                          <Input.TextArea placeholder="输入页脚文字" rows={2} />
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
                    key: 'api',
                    label: (
                      <span className="flex items-center gap-2">
                        <Key size={16} />
                        API 配置
                      </span>
                    ),
                    children: (
                      <div className="py-4 pl-4">
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">多米 API 配置</h4>
                          <Form.Item
                            label="API 请求地址"
                            name="duomiApiUrl"
                            extra="多米API的请求地址"
                          >
                            <Input placeholder="例如: https://duomiapi.com" />
                          </Form.Item>
                          <Form.Item
                            label="API Key"
                            name="duomiApiKey"
                            extra="用于调用多米服务的API密钥"
                          >
                            <Input.Password placeholder="输入新的API Key以更新" visibilityToggle />
                          </Form.Item>
                        </div>
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Gemini API 配置</h4>
                          <Form.Item
                            label="API 请求地址"
                            name="geminiApiUrl"
                            extra="Gemini API的请求地址"
                          >
                            <Input placeholder="例如: https://generativelanguage.googleapis.com" />
                          </Form.Item>
                          <Form.Item
                            label="API Key"
                            name="geminiApiKey"
                            extra="用于调用Google Gemini AI服务的API密钥"
                          >
                            <Input.Password placeholder="输入新的API Key以更新" visibilityToggle />
                          </Form.Item>
                        </div>
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">回调地址配置</h4>
                          <Form.Item
                            label="视频生成回调地址"
                            name="videoCallbackUrl"
                            extra="视频生成任务完成后的回调通知地址"
                          >
                            <Input placeholder="https://your-domain.com/callback/video" />
                          </Form.Item>
                          <Form.Item
                            label="角色生成回调地址"
                            name="characterCallbackUrl"
                            extra="角色生成任务完成后的回调通知地址"
                          >
                            <Input placeholder="https://your-domain.com/callback/character" />
                          </Form.Item>
                        </div>
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
                      <div className="py-4 pl-4">
                        <Form.Item
                          label="Secret ID"
                          name="cosSecretId"
                          extra="腾讯云访问密钥ID"
                        >
                          <Input.Password placeholder="输入新的Secret ID以更新" visibilityToggle />
                        </Form.Item>
                        <Form.Item
                          label="Secret Key"
                          name="cosSecretKey"
                          extra="腾讯云访问密钥"
                        >
                          <Input.Password placeholder="输入新的Secret Key以更新" visibilityToggle />
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
                          extra="COS绑定的CDN加速域名"
                        >
                          <Input placeholder="输入CDN域名" />
                        </Form.Item>
                      </div>
                    ),
                  },
                  {
                    key: 'system',
                    label: (
                      <span className="flex items-center gap-2">
                        <Database size={16} />
                        系统配置
                      </span>
                    ),
                    children: (
                      <div className="py-4 pl-4">
                        <Form.Item
                          label="最大用户数"
                          name="maxUsers"
                          extra="该站点允许的最大用户数，0表示不限制"
                        >
                          <InputNumber placeholder="输入最大用户数" min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item
                          label="最大存储空间 (MB)"
                          name="maxStorage"
                          extra="该站点允许的最大存储空间，单位MB，0表示不限制"
                        >
                          <InputNumber placeholder="输入最大存储空间" min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                    ),
                  },
                ]}
              />
              <div className="flex justify-end gap-4 mt-4 border-t pt-4">
                <Button onClick={handleCloseConfig}>取消</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={configSubmitting}
                  icon={<Save size={18} />}
                >
                  保存配置
                </Button>
              </div>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default SiteList;
