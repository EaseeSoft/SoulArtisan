import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Space,
  Tag,
  App,
  Typography,
  Tooltip,
} from 'antd';
import { Edit, RefreshCw, MessageSquare, Plus } from 'lucide-react';
import type { ColumnsType } from 'antd/es/table';
import {
  getChatPromptList,
  createChatPrompt,
  updateChatPrompt,
  toggleChatPromptEnabled,
  refreshChatPromptCache,
  ChatPrompt,
  ChatPromptCreateRequest,
  ChatPromptUpdateRequest,
} from '../../api/chatPrompt';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const ChatPromptList: React.FC = () => {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<ChatPrompt[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<ChatPrompt | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const result = await getChatPromptList();
      setPrompts(result);
    } catch (error) {
      message.error('加载提示词配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleEdit = (record: ChatPrompt) => {
    setSelectedPrompt(record);
    form.setFieldsValue({
      label: record.label,
      description: record.description,
      systemPrompt: record.systemPrompt,
      defaultTemperature: record.defaultTemperature,
      defaultMaxTokens: record.defaultMaxTokens,
      sortOrder: record.sortOrder,
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values: ChatPromptUpdateRequest) => {
    if (!selectedPrompt) return;

    setSaving(true);
    try {
      await updateChatPrompt(selectedPrompt.id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      fetchPrompts();
    } catch (error) {
      message.error('更新失败');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = () => {
    createForm.resetFields();
    createForm.setFieldsValue({
      defaultTemperature: 0.7,
      defaultMaxTokens: 2048,
      sortOrder: 0,
      isEnabled: 1,
    });
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async (values: ChatPromptCreateRequest) => {
    setSaving(true);
    try {
      await createChatPrompt(values);
      message.success('创建成功');
      setCreateModalVisible(false);
      fetchPrompts();
    } catch (error: any) {
      message.error(error?.message || '创建失败');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async (record: ChatPrompt) => {
    const newStatus = record.isEnabled === 1 ? 0 : 1;
    try {
      await toggleChatPromptEnabled(record.id, newStatus);
      message.success(newStatus === 1 ? '已启用' : '已禁用');
      fetchPrompts();
    } catch (error) {
      message.error('操作失败');
      console.error(error);
    }
  };

  const handleRefreshCache = async () => {
    modal.confirm({
      title: '刷新缓存',
      content: '确定要刷新提示词缓存吗？',
      onOk: async () => {
        try {
          await refreshChatPromptCache();
          message.success('缓存刷新成功');
        } catch (error) {
          message.error('缓存刷新失败');
          console.error(error);
        }
      },
    });
  };

  const columns: ColumnsType<ChatPrompt> = [
    {
      title: '场景名称',
      dataIndex: 'label',
      key: 'label',
      width: 150,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: '编码',
      dataIndex: 'code',
      key: 'code',
      width: 260,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: '提示词预览',
      dataIndex: 'systemPrompt',
      key: 'systemPrompt',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text.substring(0, 500) + (text.length > 500 ? '...' : '')}>
          <Paragraph
            ellipsis={{ rows: 2 }}
            style={{ margin: 0, maxWidth: 300 }}
          >
            {text}
          </Paragraph>
        </Tooltip>
      ),
    },
    {
      title: '温度',
      dataIndex: 'defaultTemperature',
      key: 'defaultTemperature',
      width: 80,
      align: 'center',
    },
    {
      title: 'MaxTokens',
      dataIndex: 'defaultMaxTokens',
      key: 'defaultMaxTokens',
      width: 100,
      align: 'center',
      render: (value: number) => value?.toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: 100,
      align: 'center',
      render: (value: number, record) => (
        <Switch
          checked={value === 1}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={() => handleToggleEnabled(record)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<Edit size={16} />}
          onClick={() => handleEdit(record)}
        >
          编辑
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={4} style={{ margin: 0 }}>提示词配置</Title>
          <Text type="secondary">管理 AI 聊天场景的系统提示词</Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={handleCreate}
          >
            新增
          </Button>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={handleRefreshCache}
          >
            刷新缓存
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={prompts}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={`编辑提示词 - ${selectedPrompt?.label}`}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="label"
              label="场景名称"
              rules={[{ required: true, message: '请输入场景名称' }]}
            >
              <Input placeholder="请输入场景名称" />
            </Form.Item>

            <Form.Item name="description" label="描述">
              <Input placeholder="请输入描述" />
            </Form.Item>
          </div>

          <Form.Item
            name="systemPrompt"
            label="系统提示词"
            rules={[{ required: true, message: '请输入系统提示词' }]}
          >
            <TextArea
              rows={12}
              placeholder="请输入系统提示词"
              showCount
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              name="defaultTemperature"
              label="默认温度"
              tooltip="控制回复的随机性，0-1 之间，值越大越随机"
              rules={[
                { required: true, message: '请输入默认温度' },
                { type: 'number', min: 0, max: 1, message: '温度范围 0-1' },
              ]}
            >
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="defaultMaxTokens"
              label="默认 MaxTokens"
              tooltip="控制回复的最大长度"
              rules={[
                { required: true, message: '请输入 MaxTokens' },
                { type: 'number', min: 1, message: 'MaxTokens 必须大于 0' },
              ]}
            >
              <InputNumber
                min={1}
                max={20480000}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="sortOrder"
              label="排序"
              tooltip="数字越小越靠前"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setEditModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增弹窗 */}
      <Modal
        title="新增提示词配置"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateSubmit}
          className="mt-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="code"
              label="场景编码"
              rules={[
                { required: true, message: '请输入场景编码' },
                { pattern: /^[a-z_]+$/, message: '编码只能包含小写字母和下划线' },
              ]}
              tooltip="唯一标识，创建后不可修改"
            >
              <Input placeholder="例如: my_scenario" />
            </Form.Item>

            <Form.Item
              name="label"
              label="场景名称"
              rules={[{ required: true, message: '请输入场景名称' }]}
            >
              <Input placeholder="请输入场景名称" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="描述">
            <Input placeholder="请输入描述" />
          </Form.Item>

          <Form.Item
            name="systemPrompt"
            label="系统提示词"
            rules={[{ required: true, message: '请输入系统提示词' }]}
          >
            <TextArea
              rows={12}
              placeholder="请输入系统提示词"
              showCount
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <div className="grid grid-cols-4 gap-4">
            <Form.Item
              name="defaultTemperature"
              label="默认温度"
              tooltip="控制回复的随机性，0-1 之间"
              rules={[
                { required: true, message: '请输入默认温度' },
                { type: 'number', min: 0, max: 1, message: '温度范围 0-1' },
              ]}
            >
              <InputNumber
                min={0}
                max={1}
                step={0.1}
                precision={2}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="defaultMaxTokens"
              label="默认 MaxTokens"
              tooltip="控制回复的最大长度"
              rules={[
                { required: true, message: '请输入 MaxTokens' },
                { type: 'number', min: 1, message: 'MaxTokens 必须大于 0' },
              ]}
            >
              <InputNumber
                min={1}
                max={20480000}
                style={{ width: '100%' }}
              />
            </Form.Item>

            <Form.Item
              name="sortOrder"
              label="排序"
              tooltip="数字越小越靠前"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="isEnabled"
              label="状态"
              tooltip="是否启用"
            >
              <InputNumber min={0} max={1} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 说明 */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <Title level={5} style={{ margin: 0, marginBottom: 8 }}>说明</Title>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>系统提示词用于设定 AI 的角色和行为准则</li>
          <li>温度参数控制回复的随机性，值越大回复越有创意但可能不够准确</li>
          <li>MaxTokens 控制回复的最大长度，建议根据场景合理设置</li>
          <li>禁用提示词后，该场景将使用默认的通用提示词</li>
          <li>修改后需要刷新缓存才能立即生效</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatPromptList;
