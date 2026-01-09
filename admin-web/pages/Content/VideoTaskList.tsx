import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Modal, Input, message, Space, Select, Progress, Image } from 'antd';
import { SearchOutlined, ReloadOutlined, PlayCircleOutlined, CopyOutlined, PictureOutlined } from '@ant-design/icons';
import { getVideoTaskList, addVideoTaskRemark } from '../../api/task';
import { VideoTask, TaskQueryRequest } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const VideoTaskList: React.FC = () => {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState<TaskQueryRequest>({});
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<VideoTask | null>(null);
  const [remark, setRemark] = useState('');
  const [refImageModalVisible, setRefImageModalVisible] = useState(false);
  const [viewingRefImageUrl, setViewingRefImageUrl] = useState('');

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getVideoTaskList(currentPage, pageSize, query);
      setTasks(result.list);
      setTotal(result.total);
    } catch (error) {
      message.error('加载视频任务列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      message.success('提示词已复制');
    } catch (error) {
      message.error('复制失败');
    }
  };

  const handleAddRemark = async () => {
    if (!currentTask) return;
    try {
      await addVideoTaskRemark(currentTask.id, remark);
      message.success('备注添加成功');
      setRemarkModalVisible(false);
      setRemark('');
      loadData();
    } catch (error) {
      message.error('添加备注失败');
      console.error(error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusConfig: { [key: string]: { color: string; text: string } } = {
      pending: { color: 'default', text: '待处理' },
      running: { color: 'processing', text: '运行中' },
      succeeded: { color: 'success', text: '已成功' },
      error: { color: 'error', text: '失败' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<VideoTask> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '用户',
      dataIndex: 'username',
      key: 'username',
      width: 100,
    },
    {
      title: '站点',
      dataIndex: 'siteName',
      key: 'siteName',
      width: 100,
    },
    {
      title: '提示词',
      dataIndex: 'prompt',
      key: 'prompt',
      ellipsis: true,
      render: (prompt: string) => (
        <Space size="small">
          <span style={{ maxWidth: 300 }} className="inline-block truncate">{prompt}</span>
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopyPrompt(prompt)}
          />
        </Space>
      ),
    },
    {
      title: '参考图',
      dataIndex: 'imageUrls',
      key: 'imageUrls',
      width: 80,
      render: (imageUrls: string[]) => imageUrls && imageUrls.length > 0 ? (
        <Image
          width={40}
          height={40}
          src={imageUrls[0]}
          alt="参考图"
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          preview={{
            onVisibleChange: (visible) => {
              if (!visible) {
                setRefImageModalVisible(false);
              }
            },
          }}
          onClick={() => {
            setViewingRefImageUrl(imageUrls[0]);
            setRefImageModalVisible(true);
          }}
        />
      ) : '-',
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 110,
      render: (progress: number) => progress ? <Progress percent={progress} size="small" /> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_: any, record: VideoTask) => (
        <Space size="small">
          {record.resultUrl && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => window.open(record.resultUrl)}
            >
              查看
            </Button>
          )}
          <Button
            type="link"
            size="small"
            onClick={() => {
              setCurrentTask(record);
              setRemark(record.adminRemark || '');
              setRemarkModalVisible(true);
            }}
          >
            备注
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">视频任务列表</h1>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <Space wrap className="mb-4">
          <Select
            placeholder="选择状态"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setQuery({ ...query, status: value })}
            options={[
              { label: '待处理', value: 'pending' },
              { label: '运行中', value: 'running' },
              { label: '已成功', value: 'succeeded' },
              { label: '失败', value: 'error' },
            ]}
          />

          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1000 }}
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
        title="添加备注"
        open={remarkModalVisible}
        onOk={handleAddRemark}
        onCancel={() => {
          setRemarkModalVisible(false);
          setRemark('');
        }}
      >
        <Input.TextArea
          rows={4}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="请输入备注信息"
        />
        {currentTask?.adminRemark && (
          <div className="mt-2 text-gray-500 text-sm">
            当前备注：{currentTask.adminRemark}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VideoTaskList;