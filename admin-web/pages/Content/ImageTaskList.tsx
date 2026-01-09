import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Modal, Input, message, Space, Select, Image } from 'antd';
import { SearchOutlined, ReloadOutlined, FileImageOutlined, EyeOutlined, DownloadOutlined, CopyOutlined } from '@ant-design/icons';
import { getImageTaskList, addImageTaskRemark } from '../../api/task';
import { ImageTask, TaskQueryRequest } from '../../types';
import type { ColumnsType } from 'antd/es/table';

const ImageTaskList: React.FC = () => {
  const [tasks, setTasks] = useState<ImageTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [query, setQuery] = useState<TaskQueryRequest>({});
  const [remarkModalVisible, setRemarkModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<ImageTask | null>(null);
  const [remark, setRemark] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState('');
  const [refImagesModalVisible, setRefImagesModalVisible] = useState(false);
  const [viewingRefImages, setViewingRefImages] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getImageTaskList(currentPage, pageSize, query);
      setTasks(result.list);
      setTotal(result.total);
    } catch (error) {
      message.error('加载图片任务列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      message.success('提示词已复制');
    } catch (error) {
      message.error('复制失败');
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

  const handleAddRemark = async () => {
    if (!currentTask) return;
    try {
      await addImageTaskRemark(currentTask.id, remark);
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
      processing: { color: 'processing', text: '处理中' },
      completed: { color: 'success', text: '已完成' },
      failed: { color: 'error', text: '失败' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns: ColumnsType<ImageTask> = [
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          text2image: '文生图',
          image2image: '图生图',
        };
        return typeMap[type] || type;
      },
    },
    {
      title: '参考图',
      dataIndex: 'imageUrls',
      key: 'imageUrls',
      width: 90,
      render: (imageUrls: string[]) => imageUrls && imageUrls.length > 0 ? (
        <Space size="small">
          <Image.PreviewGroup>
            {imageUrls.slice(0, 3).map((url, index) => (
              <Image
                key={index}
                width={30}
                height={30}
                src={url}
                alt={`参考图${index + 1}`}
                style={{ objectFit: 'cover', borderRadius: '4px' }}
              />
            ))}
          </Image.PreviewGroup>
          {imageUrls.length > 3 && (
            <span className="text-xs text-gray-500">+{imageUrls.length - 3}</span>
          )}
        </Space>
      ) : '-',
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
      title: '结果',
      dataIndex: 'resultUrl',
      key: 'resultUrl',
      width: 70,
      render: (url: string) => url ? (
        <Image
          width={50}
          height={50}
          src={url}
          alt="结果"
          style={{ objectFit: 'cover', borderRadius: '4px' }}
        />
      ) : '-',
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
      render: (_: any, record: ImageTask) => (
        <Space size="small">
          {record.resultUrl && (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setViewingImageUrl(record.resultUrl);
                setImageModalVisible(true);
              }}
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
        <h1 className="text-2xl font-bold">图片任务列表</h1>
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
              { label: '处理中', value: 'processing' },
              { label: '已完成', value: 'completed' },
              { label: '失败', value: 'failed' },
            ]}
          />

          <Select
            placeholder="选择类型"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setQuery({ ...query, type: value })}
            options={[
              { label: '文生图', value: 'text2image' },
              { label: '图生图', value: 'image2image' },
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
          scroll={{ x: 950 }}
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

      <Modal
        title="查看图片"
        open={imageModalVisible}
        onCancel={() => {
          setImageModalVisible(false);
          setViewingImageUrl('');
        }}
        footer={[
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              const link = document.createElement('a');
              link.href = viewingImageUrl;
              link.download = `image_${Date.now()}.png`;
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            下载图片
          </Button>,
          <Button key="close" onClick={() => {
            setImageModalVisible(false);
            setViewingImageUrl('');
          }}>
            关闭
          </Button>
        ]}
        width={800}
        centered
      >
        {viewingImageUrl && (
          <div style={{ textAlign: 'center' }}>
            <img
              src={viewingImageUrl}
              alt="生成图片"
              style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ImageTaskList;