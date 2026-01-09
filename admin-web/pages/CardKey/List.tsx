import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Pagination,
  Input,
  Form,
  Select,
  App,
  Modal,
  InputNumber,
  DatePicker,
  Tooltip,
  Typography
} from 'antd';
import { Search, Plus, Power, Trash2, Copy, Download } from 'lucide-react';
import {
  getCardKeyList,
  generateCardKeys,
  disableCardKey,
  enableCardKey,
  deleteCardKey,
  batchDeleteCardKeys,
  getBatchNoList,
  CardKey,
  CardKeyQueryRequest,
  CardKeyGenerateRequest
} from '../../api/cardkey';
import dayjs from 'dayjs';

const { Text } = Typography;

const CardKeyList: React.FC = () => {
  const { modal, message } = App.useApp();
  const [cardKeys, setCardKeys] = useState<CardKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();
  const [generateForm] = Form.useForm();
  const [query, setQuery] = useState<CardKeyQueryRequest>({});
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [batchNoList, setBatchNoList] = useState<string[]>([]);
  const [generatedCardKeys, setGeneratedCardKeys] = useState<CardKey[]>([]);
  const [resultModalVisible, setResultModalVisible] = useState(false);

  const fetchCardKeys = async (
    page: number = currentPage,
    size: number = pageSize,
    searchQuery: CardKeyQueryRequest = query
  ) => {
    setLoading(true);
    try {
      const result = await getCardKeyList(page, size, searchQuery);
      setCardKeys(result.list);
      setTotal(result.total);
      setCurrentPage(result.page);
      setPageSize(result.pageSize);
    } catch (error) {
      message.error('加载卡密列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchNoList = async () => {
    try {
      const list = await getBatchNoList();
      setBatchNoList(list);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchCardKeys();
    fetchBatchNoList();
  }, []);

  const handleSearch = (values: CardKeyQueryRequest) => {
    setQuery(values);
    fetchCardKeys(1, pageSize, values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQuery({});
    fetchCardKeys(1, pageSize, {});
  };

  const handleGenerate = async (values: CardKeyGenerateRequest) => {
    setGenerating(true);
    try {
      // 处理过期时间
      const data: CardKeyGenerateRequest = {
        ...values,
        expiredAt: values.expiredAt ? dayjs(values.expiredAt).format('YYYY-MM-DDTHH:mm:ss') : undefined
      };
      const result = await generateCardKeys(data);
      message.success(`成功生成 ${result.length} 个卡密`);
      setGeneratedCardKeys(result);
      setGenerateModalVisible(false);
      setResultModalVisible(true);
      generateForm.resetFields();
      fetchCardKeys();
      fetchBatchNoList();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '生成卡密失败';
      message.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleStatus = async (record: CardKey) => {
    const isDisabling = record.status === 0;
    const action = isDisabling ? '禁用' : '启用';

    modal.confirm({
      title: `确认${action}卡密`,
      content: `确定要${action}卡密 "${record.cardCode}" 吗？`,
      onOk: async () => {
        try {
          if (isDisabling) {
            await disableCardKey(record.id);
          } else {
            await enableCardKey(record.id);
          }
          message.success(`${action}成功`);
          fetchCardKeys();
        } catch (error) {
          message.error(`${action}失败`);
        }
      }
    });
  };

  const handleDelete = async (record: CardKey) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除卡密 "${record.cardCode}" 吗？此操作无法撤销。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteCardKey(record.id);
          message.success('删除成功');
          fetchCardKeys();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的卡密');
      return;
    }

    modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个卡密吗？已使用的卡密不会被删除。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await batchDeleteCardKeys(selectedRowKeys as number[]);
          message.success('批量删除成功');
          setSelectedRowKeys([]);
          fetchCardKeys();
        } catch (error) {
          message.error('批量删除失败');
        }
      }
    });
  };

  const handleCopyCardCode = (cardCode: string) => {
    navigator.clipboard.writeText(cardCode);
    message.success('卡密已复制到剪贴板');
  };

  const handleExportCardKeys = () => {
    if (generatedCardKeys.length === 0) return;

    const content = generatedCardKeys.map((card) => card.cardCode).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardkeys_${dayjs().format('YYYYMMDDHHmmss')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

  const handlePageChange = (page: number, size?: number) => {
    fetchCardKeys(page, size || pageSize, query);
  };

  const getStatusTag = (status: number) => {
    switch (status) {
      case 0:
        return <Tag color="blue">未使用</Tag>;
      case 1:
        return <Tag color="green">已使用</Tag>;
      case 2:
        return <Tag color="red">已禁用</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const columns = [
    {
      title: '卡密码',
      dataIndex: 'cardCode',
      key: 'cardCode',
      width: 200,
      render: (cardCode: string) => (
        <Space>
          <Text code copyable={{ text: cardCode }}>
            {cardCode}
          </Text>
        </Space>
      )
    },
    {
      title: '积分值',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      render: (points: number) => <span className="font-semibold text-blue-600">{points}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => getStatusTag(status)
    },
    {
      title: '批次号',
      dataIndex: 'batchNo',
      key: 'batchNo',
      width: 180,
      render: (batchNo: string) => batchNo || '-'
    },
    {
      title: '使用信息',
      key: 'usedInfo',
      width: 180,
      render: (_: unknown, record: CardKey) => {
        if (record.status !== 1) return '-';
        return (
          <div className="text-sm">
            <div>用户ID: {record.usedBy}</div>
            <div className="text-gray-500">{record.usedAt}</div>
          </div>
        );
      }
    },
    {
      title: '过期时间',
      dataIndex: 'expiredAt',
      key: 'expiredAt',
      width: 160,
      render: (time: string) => {
        if (!time) return '-';
        const isExpired = dayjs(time).isBefore(dayjs());
        return <span className={isExpired ? 'text-red-500' : 'text-gray-500'}>{time}</span>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => <span className="text-sm text-gray-500">{time}</span>
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: CardKey) => (
        <Space size="small">
          {record.status !== 1 && (
            <>
              <Tooltip title={record.status === 0 ? '禁用' : '启用'}>
                <Button
                  type="text"
                  size="small"
                  icon={<Power size={16} />}
                  onClick={() => handleToggleStatus(record)}
                />
              </Tooltip>
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<Trash2 size={16} />}
                  onClick={() => handleDelete(record)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
    getCheckboxProps: (record: CardKey) => ({
      disabled: record.status === 1 // 已使用的不能选择
    })
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">卡密管理</h1>
        <p className="text-gray-500 text-sm mt-1">管理站点卡密，用于用户兑换积分</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="cardCode">
            <Input placeholder="卡密码" prefix={<Search size={16} />} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="batchNo">
            <Select
              placeholder="批次号"
              style={{ width: 200 }}
              allowClear
              options={batchNoList.map((batchNo) => ({ label: batchNo, value: batchNo }))}
            />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              allowClear
              options={[
                { label: '未使用', value: 0 },
                { label: '已使用', value: 1 },
                { label: '已禁用', value: 2 },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              搜索
            </Button>
          </Form.Item>
          <Form.Item>
            <Button onClick={handleReset}>重置</Button>
          </Form.Item>
        </Form>
      </div>

      <div className="flex justify-between items-center">
        <Space>
          <Button type="primary" icon={<Plus size={16} />} onClick={() => setGenerateModalVisible(true)}>
            生成卡密
          </Button>
          {selectedRowKeys.length > 0 && (
            <Button danger onClick={handleBatchDelete}>
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
        </Space>
        <span className="text-gray-500 text-sm">共 {total} 条记录</span>
      </div>

      <Table
        columns={columns}
        dataSource={cardKeys}
        loading={loading}
        rowKey="id"
        rowSelection={rowSelection}
        pagination={false}
        bordered
        scroll={{ x: 1200 }}
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

      {/* 生成卡密弹窗 */}
      <Modal
        title="生成卡密"
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={generateForm} layout="vertical" onFinish={handleGenerate} initialValues={{ count: 10, points: 100 }}>
          <Form.Item
            name="count"
            label="生成数量"
            rules={[
              { required: true, message: '请输入生成数量' },
              { type: 'number', min: 1, max: 1000, message: '数量范围为1-1000' }
            ]}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} placeholder="1-1000" />
          </Form.Item>
          <Form.Item
            name="points"
            label="积分值"
            rules={[
              { required: true, message: '请输入积分值' },
              { type: 'number', min: 1, message: '积分值必须大于0' }
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="每张卡密的积分值" />
          </Form.Item>
          <Form.Item name="batchNo" label="批次号">
            <Input placeholder="留空则自动生成" />
          </Form.Item>
          <Form.Item name="expiredAt" label="过期时间">
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="不设置则永不过期"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选备注信息" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setGenerateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={generating}>
                生成
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成结果弹窗 */}
      <Modal
        title="生成成功"
        open={resultModalVisible}
        onCancel={() => setResultModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResultModalVisible(false)}>
            关闭
          </Button>,
          <Button key="export" type="primary" icon={<Download size={16} />} onClick={handleExportCardKeys}>
            导出卡密
          </Button>
        ]}
        width={600}
      >
        <div className="mb-4">
          <p className="text-gray-600">成功生成 {generatedCardKeys.length} 个卡密，每张积分值为 {generatedCardKeys[0]?.points || 0}</p>
        </div>
        <div className="max-h-96 overflow-y-auto bg-gray-50 p-4 rounded">
          {generatedCardKeys.map((card) => (
            <div key={card.id} className="flex items-center justify-between py-1 border-b border-gray-200 last:border-0">
              <Text code>{card.cardCode}</Text>
              <Button type="text" size="small" icon={<Copy size={14} />} onClick={() => handleCopyCardCode(card.cardCode)}>
                复制
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default CardKeyList;
