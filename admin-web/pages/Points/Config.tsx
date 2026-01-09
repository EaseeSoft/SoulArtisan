import React, { useEffect, useState } from 'react';
import {
  Card,
  Form,
  InputNumber,
  Switch,
  Button,
  Spin,
  App,
  Divider,
  Typography
} from 'antd';
import { Save, ImageIcon, Video, MessageSquare } from 'lucide-react';
import {
  getPointsConfigList,
  updatePointsConfigs,
  PointsConfig,
  configKeyLabels
} from '../../api/points';

const { Title, Text } = Typography;

interface ConfigFormValues {
  [key: string]: {
    configValue: number;
    isEnabled: boolean;
  };
}

const PointsConfigPage: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<PointsConfig[]>([]);
  const [form] = Form.useForm<ConfigFormValues>();

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const result = await getPointsConfigList();
      setConfigs(result);

      // 设置表单初始值
      const formValues: ConfigFormValues = {};
      result.forEach((config) => {
        formValues[config.configKey] = {
          configValue: config.configValue,
          isEnabled: config.isEnabled === 1
        };
      });
      form.setFieldsValue(formValues);
    } catch (error) {
      message.error('加载积分配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // 转换为后端需要的格式
      const updatedConfigs: PointsConfig[] = configs.map((config) => ({
        ...config,
        configValue: values[config.configKey]?.configValue ?? config.configValue,
        isEnabled: values[config.configKey]?.isEnabled ? 1 : 0
      }));

      await updatePointsConfigs(updatedConfigs);
      message.success('配置保存成功');
      fetchConfigs();
    } catch (error) {
      message.error('保存配置失败');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const getIconForKey = (key: string) => {
    if (key.startsWith('image')) {
      return <ImageIcon size={20} className="text-purple-500" />;
    }
    if (key.startsWith('video')) {
      return <Video size={20} className="text-blue-500" />;
    }
    if (key.startsWith('gemini')) {
      return <MessageSquare size={20} className="text-green-500" />;
    }
    return null;
  };

  const getCategoryForKey = (key: string): string => {
    if (key.startsWith('image')) return 'image';
    if (key.startsWith('video')) return 'video';
    if (key.startsWith('gemini')) return 'chat';
    return 'other';
  };

  const groupedConfigs = configs.reduce((acc, config) => {
    const category = getCategoryForKey(config.configKey);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(config);
    return acc;
  }, {} as Record<string, PointsConfig[]>);

  const categoryTitles: Record<string, { title: string; icon: React.ReactNode }> = {
    image: { title: '图片生成', icon: <ImageIcon size={24} className="text-purple-500" /> },
    video: { title: '视频生成', icon: <Video size={24} className="text-blue-500" /> },
    chat: { title: 'AI 对话', icon: <MessageSquare size={24} className="text-green-500" /> }
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
      <div className="flex justify-between items-center">
        <div>
          <Title level={4} style={{ margin: 0 }}>积分扣除设置</Title>
          <Text type="secondary">配置各功能消耗的积分数量</Text>
        </div>
        <Button
          type="primary"
          icon={<Save size={16} />}
          onClick={handleSave}
          loading={saving}
        >
          保存设置
        </Button>
      </div>

      <Form form={form} layout="vertical">
        {(Object.entries(groupedConfigs) as [string, PointsConfig[]][]).map(([category, categoryConfigs]) => (
          <Card
            key={category}
            className="mb-4"
            title={
              <div className="flex items-center gap-2">
                {categoryTitles[category]?.icon}
                <span>{categoryTitles[category]?.title || category}</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryConfigs.map((config) => (
                <div
                  key={config.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getIconForKey(config.configKey)}
                      <span className="font-medium">
                        {configKeyLabels[config.configKey] || config.configName}
                      </span>
                    </div>
                    <Form.Item
                      name={[config.configKey, 'isEnabled']}
                      valuePropName="checked"
                      style={{ marginBottom: 0 }}
                    >
                      <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                    </Form.Item>
                  </div>

                  {config.description && (
                    <Text type="secondary" className="text-xs block mb-3">
                      {config.description}
                    </Text>
                  )}

                  <Form.Item
                    name={[config.configKey, 'configValue']}
                    label="消耗积分"
                    style={{ marginBottom: 0 }}
                    rules={[
                      { required: true, message: '请输入积分值' },
                      { type: 'number', min: 0, message: '积分值不能为负数' }
                    ]}
                  >
                    <InputNumber
                      min={0}
                      max={99999}
                      style={{ width: '100%' }}
                      addonAfter="积分"
                    />
                  </Form.Item>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </Form>

      <Divider />

      <div className="bg-blue-50 p-4 rounded-lg">
        <Title level={5} style={{ margin: 0, marginBottom: 8 }}>说明</Title>
        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
          <li>设置为 0 积分表示该功能免费使用</li>
          <li>禁用某项配置后，该功能将不扣除积分</li>
          <li>用户积分不足时将无法使用相应功能</li>
          <li>视频生成根据时长有不同的积分消耗</li>
        </ul>
      </div>
    </div>
  );
};

export default PointsConfigPage;
