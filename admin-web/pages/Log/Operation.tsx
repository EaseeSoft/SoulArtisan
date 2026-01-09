import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Input, message, Space, Select, DatePicker, Modal, Descriptions } from 'antd';
import { SearchOutlined, ReloadOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import { getOperationLogs } from '../../api/log';
import { AdminOperationLog, LogQueryRequest } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const OperationLogList: React.FC = () => {
  const [logs, setLogs] = useState<AdminOperationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState<LogQueryRequest>({});
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [currentLog, setCurrentLog] = useState<AdminOperationLog | null>(null);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getOperationLogs(currentPage, pageSize, query);
      setLogs(result.list);
      setTotal(result.total);
    } catch (error) {
      message.error('加载操作日志失败');
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

  const columns: ColumnsType<AdminOperationLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '管理员',
      dataIndex: 'adminName',
      key: 'adminName',
      width: 100,
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
    },
    {
      title: '操作',
      dataIndex: 'operation',
      key: 'operation',
      width: 120,
    },
    {
      title: '方法',
      dataIndex: 'method',
      key: 'method',
      ellipsis: true,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
    },
    {
      title: '耗时(ms)',
      dataIndex: 'costTime',
      key: 'costTime',
      width: 90,
      render: (costTime: number) => (
        <span style={{ color: costTime > 1000 ? '#ff4d4f' : 'inherit' }}>
          {costTime}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => getStatusTag(status),
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      render: (_: any, record: AdminOperationLog) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setCurrentLog(record);
            setDetailModalVisible(true);
          }}
        >
          详情
        </Button>
      ),
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
        <h1 className="text-2xl font-bold">操作日志</h1>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <Space wrap className="mb-4">
          <Input
            placeholder="管理员名称"
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

          <Input
            placeholder="模块"
            style={{ width: 120 }}
            allowClear
            onChange={(e) => setQuery({ ...query, module: e.target.value })}
          />

          <Select
            placeholder="状态"
            style={{ width: 100 }}
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
          scroll={{ x: 1100 }}
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

      <Modal
        title="操作日志详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setCurrentLog(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setCurrentLog(null);
          }}>
            关闭
          </Button>
        ]}
        width={700}
      >
        {currentLog && (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="ID">{currentLog.id}</Descriptions.Item>
            <Descriptions.Item label="管理员">{currentLog.adminName}</Descriptions.Item>
            <Descriptions.Item label="模块">{currentLog.module}</Descriptions.Item>
            <Descriptions.Item label="操作">{currentLog.operation}</Descriptions.Item>
            <Descriptions.Item label="状态" span={2}>
              {currentLog.status === 1 ? (
                <Tag color="success">成功</Tag>
              ) : (
                <Tag color="error">失败</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="请求方法" span={2}>{currentLog.method}</Descriptions.Item>
            <Descriptions.Item label="请求URL" span={2}>{currentLog.requestUrl}</Descriptions.Item>
            <Descriptions.Item label="请求参数" span={2}>
              <div style={{ maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {currentLog.requestParams || '-'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="响应结果" span={2}>
              <div style={{ maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {currentLog.responseResult || '-'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentLog.ip}</Descriptions.Item>
            <Descriptions.Item label="耗时">{currentLog.costTime} ms</Descriptions.Item>
            <Descriptions.Item label="操作时间" span={2}>{currentLog.createdAt}</Descriptions.Item>
            {currentLog.errorMsg && (
              <Descriptions.Item label="错误信息" span={2}>
                <div style={{ color: '#ff4d4f', maxHeight: 100, overflow: 'auto' }}>
                  {currentLog.errorMsg}
                </div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default OperationLogList;
