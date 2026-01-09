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
  Drawer,
  Descriptions,
  InputNumber,
  Radio
} from 'antd';
import { Search, Power, Key, Trash2, Edit, Coins, ArrowUpCircle, ArrowDownCircle, Plus } from 'lucide-react';
import {
  getUserList,
  updateUserStatus,
  deleteUser,
  resetUserPassword,
  updateUser,
  createUser,
  UserUpdateRequest,
  UserCreateRequest
} from '../../api/user';
import { getPointsRecordList, adjustPoints, PointsRecord, PointsAdjustRequest, sourceLabels } from '../../api/points';
import { User, UserQueryRequest } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';

const UserList: React.FC = () => {
  const { modal, message } = App.useApp();
  const { isSiteAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [query, setQuery] = useState<UserQueryRequest>({});

  // 编辑弹窗
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // 收支详情抽屉
  const [pointsDrawerVisible, setPointsDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pointsRecords, setPointsRecords] = useState<PointsRecord[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsTotal, setPointsTotal] = useState(0);
  const [pointsPage, setPointsPage] = useState(1);

  // 调整积分弹窗
  const [adjustForm] = Form.useForm();
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  // 创建用户弹窗
  const [createForm] = Form.useForm();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchUsers = async (
    page: number = currentPage,
    size: number = pageSize,
    searchQuery: UserQueryRequest = query
  ) => {
    setLoading(true);
    try {
      const result = await getUserList(page, size, searchQuery);
      setUsers(result.list);
      setTotal(result.total);
      setCurrentPage(result.page);
      setPageSize(result.pageSize);
    } catch (error) {
      message.error('加载用户列表失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPointsRecords = async (userId: number, page: number = 1) => {
    setPointsLoading(true);
    try {
      const result = await getPointsRecordList(page, 10, { userId });
      setPointsRecords(result.list);
      setPointsTotal(result.total);
      setPointsPage(page);
    } catch (error) {
      message.error('加载积分记录失败');
      console.error(error);
    } finally {
      setPointsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (values: UserQueryRequest) => {
    setQuery(values);
    fetchUsers(1, pageSize, values);
  };

  const handleReset = () => {
    searchForm.resetFields();
    setQuery({});
    fetchUsers(1, pageSize, {});
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 1 ? 0 : 1;
    const statusText = newStatus === 1 ? '启用' : '禁用';

    modal.confirm({
      title: `确认${statusText}用户`,
      content: `确定要${statusText}用户 "${user.username}" 吗？`,
      onOk: async () => {
        try {
          await updateUserStatus(user.id, newStatus);
          message.success(`${statusText}成功`);
          fetchUsers();
        } catch (error) {
          message.error(`${statusText}失败`);
        }
      }
    });
  };

  const handleResetPassword = async (user: User) => {
    let newPassword = '';
    modal.confirm({
      title: '重置用户密码',
      content: (
        <div className="mt-4">
          <Input.Password
            placeholder="请输入新密码（至少6位）"
            onChange={(e) => (newPassword = e.target.value)}
          />
        </div>
      ),
      onOk: async () => {
        if (!newPassword || newPassword.length < 6) {
          message.error('密码至少6位');
          return Promise.reject();
        }
        try {
          await resetUserPassword(user.id, newPassword);
          message.success('密码重置成功');
        } catch (error) {
          message.error('密码重置失败');
          return Promise.reject();
        }
      }
    });
  };

  const handleDelete = async (user: User) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${user.username}" 吗？此操作无法撤销。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteUser(user.id);
          message.success('删除成功');
          fetchUsers();
        } catch (error) {
          message.error('删除失败');
        }
      }
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    editForm.setFieldsValue({
      nickname: user.nickname,
      email: user.email,
      phone: user.phone
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values: UserUpdateRequest) => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await updateUser(editingUser.id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      editForm.resetFields();
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      message.error('更新失败');
    } finally {
      setSaving(false);
    }
  };

  const handleViewPoints = (user: User) => {
    setSelectedUser(user);
    setPointsDrawerVisible(true);
    fetchPointsRecords(user.id, 1);
  };

  const handleOpenAdjustModal = () => {
    if (!selectedUser) return;
    adjustForm.setFieldsValue({
      type: 1,
      points: 100,
      remark: ''
    });
    setAdjustModalVisible(true);
  };

  const handleAdjustPoints = async (values: PointsAdjustRequest) => {
    if (!selectedUser) return;
    setAdjusting(true);
    try {
      await adjustPoints({ ...values, userId: selectedUser.id });
      message.success('积分调整成功');
      setAdjustModalVisible(false);
      adjustForm.resetFields();
      // 刷新积分记录和用户列表
      fetchPointsRecords(selectedUser.id, 1);
      fetchUsers();
      // 更新selectedUser的积分
      const newPoints = values.type === 1
        ? (selectedUser.points || 0) + values.points
        : (selectedUser.points || 0) - values.points;
      setSelectedUser({ ...selectedUser, points: newPoints });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '积分调整失败';
      message.error(errorMessage);
    } finally {
      setAdjusting(false);
    }
  };

  const handleCreateUser = async (values: UserCreateRequest) => {
    setCreating(true);
    try {
      await createUser(values);
      message.success('创建用户成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchUsers(1, pageSize, query);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '创建用户失败';
      message.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handlePageChange = (page: number, size?: number) => {
    fetchUsers(page, size || pageSize, query);
  };

  const columns = [
    {
      title: '用户信息',
      key: 'userInfo',
      render: (_: unknown, record: User) => (
        <div>
          <div className="font-semibold text-gray-800">{record.username}</div>
          {record.nickname && <div className="text-xs text-gray-500">{record.nickname}</div>}
          {record.email && <div className="text-xs text-blue-500">{record.email}</div>}
          {record.phone && <div className="text-xs text-gray-400">{record.phone}</div>}
        </div>
      )
    },
    {
      title: '站点',
      dataIndex: 'siteName',
      key: 'siteName',
      width: 150,
      render: (siteName: string) => siteName || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '启用' : '禁用'}</Tag>
      )
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      render: (points: number) => <span className="font-semibold text-blue-600">{points || 0}</span>
    },
    {
      title: '统计',
      key: 'stats',
      width: 120,
      render: (_: unknown, record: User) => (
        <div className="text-sm">
          <div>项目: {record.projectCount || 0}</div>
          <div>任务: {(record.imageTaskCount || 0) + (record.videoTaskCount || 0)}</div>
        </div>
      )
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
      width: 220,
      render: (_: unknown, record: User) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<Edit size={16} />}
            onClick={() => handleEdit(record)}
            title="编辑"
          />
          <Button
            type="text"
            size="small"
            icon={<Coins size={16} />}
            onClick={() => handleViewPoints(record)}
            title="收支详情"
          />
          <Button
            type="text"
            size="small"
            icon={<Power size={16} />}
            onClick={() => handleToggleStatus(record)}
            title={record.status === 1 ? '禁用' : '启用'}
          />
          <Button
            type="text"
            size="small"
            icon={<Key size={16} />}
            onClick={() => handleResetPassword(record)}
            title="重置密码"
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 size={16} />}
            onClick={() => handleDelete(record)}
            title="删除"
          />
        </Space>
      )
    }
  ];

  const pointsColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: number) =>
        type === 1 ? (
          <Tag color="green" icon={<ArrowUpCircle size={12} className="inline mr-1" />}>
            收入
          </Tag>
        ) : (
          <Tag color="red" icon={<ArrowDownCircle size={12} className="inline mr-1" />}>
            支出
          </Tag>
        )
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 80,
      render: (points: number, record: PointsRecord) => (
        <span className={record.type === 1 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          {record.type === 1 ? '+' : '-'}
          {points}
        </span>
      )
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 80,
      render: (balance: number) => <span className="text-blue-600">{balance}</span>
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (source: string) => <Tag>{sourceLabels[source] || source}</Tag>
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (remark: string) => remark || '-'
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time: string) => <span className="text-sm text-gray-500">{time}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
          <p className="text-gray-500 text-sm mt-1">管理平台用户信息</p>
        </div>
        {isSiteAdmin() && (
          <Button
            type="primary"
            icon={<Plus size={16} />}
            onClick={() => setCreateModalVisible(true)}
          >
            创建用户
          </Button>
        )}
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm">
        <Form form={searchForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="username">
            <Input placeholder="用户名" prefix={<Search size={16} />} style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="nickname">
            <Input placeholder="昵称" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="email">
            <Input placeholder="邮箱" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select
              placeholder="状态"
              style={{ width: 120 }}
              allowClear
              options={[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
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
        dataSource={users}
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

      {/* 编辑用户弹窗 */}
      <Modal
        title="编辑用户信息"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setEditingUser(null);
        }}
        footer={null}
        width={500}
      >
        {editingUser && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-500">用户名</div>
            <div className="font-semibold">{editingUser.username}</div>
          </div>
        )}
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="nickname" label="昵称">
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setEditModalVisible(false);
                  editForm.resetFields();
                  setEditingUser(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 收支详情抽屉 */}
      <Drawer
        title="积分收支详情"
        placement="right"
        width={700}
        onClose={() => {
          setPointsDrawerVisible(false);
          setSelectedUser(null);
          setPointsRecords([]);
        }}
        open={pointsDrawerVisible}
      >
        {selectedUser && (
          <>
            <Descriptions bordered size="small" column={2} className="mb-4">
              <Descriptions.Item label="用户名">{selectedUser.username}</Descriptions.Item>
              <Descriptions.Item label="昵称">{selectedUser.nickname || '-'}</Descriptions.Item>
              <Descriptions.Item label="当前积分">
                <span className="font-semibold text-blue-600 text-lg">{selectedUser.points || 0}</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={selectedUser.status === 1 ? 'green' : 'red'}>
                  {selectedUser.status === 1 ? '启用' : '禁用'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 font-medium">积分变动记录</span>
              <Button type="primary" icon={<Plus size={16} />} onClick={handleOpenAdjustModal}>
                调整积分
              </Button>
            </div>
            <Table
              columns={pointsColumns}
              dataSource={pointsRecords}
              loading={pointsLoading}
              rowKey="id"
              size="small"
              pagination={{
                current: pointsPage,
                pageSize: 10,
                total: pointsTotal,
                onChange: (page) => fetchPointsRecords(selectedUser.id, page),
                showTotal: (total) => `共 ${total} 条`
              }}
            />
          </>
        )}
      </Drawer>

      {/* 调整积分弹窗 */}
      <Modal
        title={`调整积分 - ${selectedUser?.username || ''}`}
        open={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        footer={null}
        width={450}
      >
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <span className="text-gray-600">当前积分：</span>
          <span className="font-semibold text-blue-600 text-lg">{selectedUser?.points || 0}</span>
        </div>
        <Form
          form={adjustForm}
          layout="vertical"
          onFinish={handleAdjustPoints}
          initialValues={{ type: 1, points: 100 }}
        >
          <Form.Item
            name="type"
            label="调整类型"
            rules={[{ required: true, message: '请选择调整类型' }]}
          >
            <Radio.Group>
              <Radio value={1}>
                <span className="text-green-600">增加积分</span>
              </Radio>
              <Radio value={2}>
                <span className="text-red-600">扣减积分</span>
              </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="points"
            label="积分值"
            rules={[
              { required: true, message: '请输入积分值' },
              { type: 'number', min: 1, message: '积分值必须大于0' }
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入积分值" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="可选备注信息" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setAdjustModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={adjusting}>
                确认调整
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建用户弹窗 */}
      <Modal
        title="创建用户"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateUser}
          initialValues={{ points: 0 }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' }
            ]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="nickname" label="昵称">
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item
            name="points"
            label="初始积分"
            rules={[{ type: 'number', min: 0, message: '积分不能为负数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入初始积分" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setCreateModalVisible(false);
                  createForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={creating}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
