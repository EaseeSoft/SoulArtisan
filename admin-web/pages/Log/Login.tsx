import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Input, message, Space, Select, DatePicker } from 'antd';
import { SearchOutlined, ReloadOutlined, LoginOutlined } from '@ant-design/icons';
import { getLoginLogs } from '../../api/log';
import { AdminLoginLog, LogQueryRequest } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const { RangePicker } = DatePicker;

const LoginLogList: React.FC = () => {
  const [logs, setLogs] = useState<AdminLoginLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState<LogQueryRequest>({});

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getLoginLogs(currentPage, pageSize, query);
      setLogs(result.list);
      setTotal(result.total);
    } catch (error) {
      message.error('加载登录日志失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

  const getStatusTag = (status: number) => {
    return status === 1 ? (
      <Tag color="success">成功</Tag>
    ) : (
      <Tag color="error">失败</Tag>
    );
  };

  const columns: ColumnsType<AdminLoginLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
    },
    {
      title: 'IP归属地',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (location: string) => location || '-',
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      key: 'browser',
      width: 120,
      render: (browser: string) => browser || '-',
    },
    {
      title: '操作系统',
      dataIndex: 'os',
      key: 'os',
      width: 120,
      render: (os: string) => os || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => getStatusTag(status),
    },
    {
      title: '提示消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (message: string) => message || '-',
    },
    {
      title: '登录时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
  ];

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates.length === 2) {
      setQuery({
        ...query,
        startTime: dates[0].format('YYYY-MM-DD HH:mm:ss'),
        endTime: dates[1].format('YYYY-MM-DD HH:mm:ss'),
      });
    } else {
      const { startTime, endTime, ...rest } = query;
      setQuery(rest);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">登录日志</h1>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <Space wrap className="mb-4">
          <Input
            placeholder="用户名"
            style={{ width: 150 }}
            allowClear
            onChange={(e) => setQuery({ ...query, adminName: e.target.value })}
          />

          <Input
            placeholder="IP地址"
            style={{ width: 150 }}
            allowClear
            onChange={(e) => setQuery({ ...query, ip: e.target.value })}
          />

          <Select
            placeholder="登录状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setQuery({ ...query, status: value })}
            options={[
              { label: '成功', value: 1 },
              { label: '失败', value: 0 },
            ]}
          />

          <RangePicker
            showTime
            format="YYYY-MM-DD HH:mm:ss"
            placeholder={['开始时间', '结束时间']}
            onChange={handleDateRangeChange}
          />

          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={logs}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1050 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            },
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </div>
    </div>
  );
};

export default LoginLogList;
