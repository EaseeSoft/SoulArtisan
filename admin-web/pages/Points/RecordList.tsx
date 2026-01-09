import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Tag,
  Pagination,
  Input,
  Form,
  Select,
  App
} from 'antd';
import { Search, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import {
  getPointsRecordList,
  PointsRecord,
  PointsRecordQueryRequest,
  sourceLabels,
  typeLabels
} from '../../api/points';

const PointsRecordList: React.FC = () => {
  const { message } = App.useApp();
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();
  const [query, setQuery] = useState<PointsRecordQueryRequest>({});

  const fetchRecords = async (
    page: number = currentPage,
    size: number = pageSize,
    searchQuery: PointsRecordQueryRequest = query
  ) => {
    setLoading(true);
    try {
      const result = await getPointsRecordList(page, size, searchQuery);
      setRecords(result.list);
      setTotal(result.total);
      setCurrentPage(result.page);
      setPageSize(result.pageSize);
    } catch (error) {
      message.error('加载积分记录失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSearch = (values: PointsRecordQueryRequest) => {
    setQuery(values);
    fetchRecords(1, pageSize, values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQuery({});
    fetchRecords(1, pageSize, {});
  };

  const handlePageChange = (page: number, size?: number) => {
    fetchRecords(page, size || pageSize, query);
  };

  const getTypeTag = (type: number) => {
    if (type === 1) {
      return (
        <Tag color="green" icon={<ArrowUpCircle size={12} className="inline mr-1" />}>
          {typeLabels[type]}
        </Tag>
      );
    }
    return (
      <Tag color="red" icon={<ArrowDownCircle size={12} className="inline mr-1" />}>
        {typeLabels[type]}
      </Tag>
    );
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 150,
      render: (_: unknown, record: PointsRecord) => (
        <div>
          <div className="font-semibold">{record.username || '-'}</div>
          {record.nickname && <div className="text-xs text-gray-500">{record.nickname}</div>}
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: number) => getTypeTag(type)
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      render: (points: number, record: PointsRecord) => (
        <span className={record.type === 1 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {record.type === 1 ? '+' : '-'}{points}
        </span>
      )
    },
    {
      title: '变动后余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 120,
      render: (balance: number) => <span className="font-semibold text-blue-600">{balance}</span>
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 120,
      render: (source: string) => <Tag>{sourceLabels[source] || source}</Tag>
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      ellipsis: true,
      render: (remark: string) => remark || '-'
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      key: 'operatorName',
      width: 100,
      render: (name: string) => name || '-'
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => <span className="text-sm text-gray-500">{time}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">积分记录</h1>
        <p className="text-gray-500 text-sm mt-1">查看用户积分收支记录</p>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="username">
            <Input placeholder="用户名" prefix={<Search size={16} />} style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="type">
            <Select
              placeholder="类型"
              style={{ width: 120 }}
              allowClear
              options={[
                { label: '收入', value: 1 },
                { label: '支出', value: 2 },
              ]}
            />
          </Form.Item>
          <Form.Item name="source">
            <Select
              placeholder="来源"
              style={{ width: 140 }}
              allowClear
              options={[
                { label: '卡密兑换', value: 'card_key' },
                { label: '管理员调整', value: 'admin_adjust' },
                { label: '任务消耗', value: 'task_consume' },
                { label: '注册赠送', value: 'register' },
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

      <Table
        columns={columns}
        dataSource={records}
        loading={loading}
        rowKey="id"
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
    </div>
  );
};

export default PointsRecordList;
