import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, message } from 'antd';
import { UserOutlined, FileImageOutlined, VideoCameraOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';
import { getUserStatistics, getContentStatistics } from '../../api/stats';
import { UserStatistics, ContentStatistics } from '../../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const StatisticsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [contentStats, setContentStats] = useState<ContentStatistics | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userStatsData, contentStatsData] = await Promise.all([
        getUserStatistics(),
        getContentStatistics(),
      ]);
      setUserStats(userStatsData);
      setContentStats(contentStatsData);
    } catch (error) {
      message.error('加载统计数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" tip="加载统计数据中..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">数据统计与分析</h1>

      {/* 用户统计 */}
      {userStats && (
        <>
          <Card title="用户统计" className="shadow">
            <Row gutter={16} className="mb-6">
              <Col span={6}>
                <Card>
                  <Statistic
                    title="用户总数"
                    value={userStats.totalUsers}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="启用用户"
                    value={userStats.activeUsers}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="今日新增"
                    value={userStats.todayNewUsers}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="本月新增"
                    value={userStats.monthNewUsers}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            <h3 className="text-lg font-semibold mb-4">用户增长趋势（最近30天）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userStats.userGrowthTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="新增用户" />
              </LineChart>
            </ResponsiveContainer>

            {userStats.userDistributionBySite && userStats.userDistributionBySite.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-4">用户站点分布</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={userStats.userDistributionBySite}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.siteName}: ${entry.userCount}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="userCount"
                    >
                      {userStats.userDistributionBySite.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>
        </>
      )}

      {/* 内容统计 */}
      {contentStats && (
        <>
          {/* 图片任务统计 */}
          <Card title="图片任务统计" className="shadow">
            <Row gutter={16} className="mb-6">
              <Col span={4}>
                <Card>
                  <Statistic
                    title="任务总数"
                    value={contentStats.imageTaskStats.totalTasks}
                    prefix={<FileImageOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="今日新增"
                    value={contentStats.imageTaskStats.todayNewTasks}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="已完成"
                    value={contentStats.imageTaskStats.completedTasks}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="失败"
                    value={contentStats.imageTaskStats.failedTasks}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="完成率"
                    value={contentStats.imageTaskStats.completionRate.toFixed(2)}
                    suffix="%"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="失败率"
                    value={contentStats.imageTaskStats.failureRate.toFixed(2)}
                    suffix="%"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>

            <h3 className="text-lg font-semibold mb-4">图片任务创建趋势（最近30天）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentStats.imageTaskStats.creationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" name="任务数量" />
              </BarChart>
            </ResponsiveContainer>

            {contentStats.imageTaskStats.errorAnalysis && contentStats.imageTaskStats.errorAnalysis.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-4">错误分析（Top 10）</h3>
                <Table
                  dataSource={contentStats.imageTaskStats.errorAnalysis}
                  rowKey="errorMessage"
                  pagination={false}
                  columns={[
                    {
                      title: '错误消息',
                      dataIndex: 'errorMessage',
                      key: 'errorMessage',
                    },
                    {
                      title: '出现次数',
                      dataIndex: 'count',
                      key: 'count',
                      width: 120,
                    },
                    {
                      title: '占比',
                      dataIndex: 'percentage',
                      key: 'percentage',
                      width: 100,
                      render: (percentage: number) => `${percentage.toFixed(2)}%`,
                    },
                  ]}
                />
              </>
            )}
          </Card>

          {/* 视频任务统计 */}
          <Card title="视频任务统计" className="shadow">
            <Row gutter={16} className="mb-6">
              <Col span={4}>
                <Card>
                  <Statistic
                    title="任务总数"
                    value={contentStats.videoTaskStats.totalTasks}
                    prefix={<VideoCameraOutlined />}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="今日新增"
                    value={contentStats.videoTaskStats.todayNewTasks}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="已完成"
                    value={contentStats.videoTaskStats.completedTasks}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="失败"
                    value={contentStats.videoTaskStats.failedTasks}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="完成率"
                    value={contentStats.videoTaskStats.completionRate.toFixed(2)}
                    suffix="%"
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col span={4}>
                <Card>
                  <Statistic
                    title="失败率"
                    value={contentStats.videoTaskStats.failureRate.toFixed(2)}
                    suffix="%"
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
            </Row>

            <h3 className="text-lg font-semibold mb-4">视频任务创建趋势（最近30天）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={contentStats.videoTaskStats.creationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="任务数量" />
              </BarChart>
            </ResponsiveContainer>

            {contentStats.videoTaskStats.popularModels && contentStats.videoTaskStats.popularModels.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-4">热门模型统计</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={contentStats.videoTaskStats.popularModels}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.model}: ${entry.count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {contentStats.videoTaskStats.popularModels.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}

            {contentStats.videoTaskStats.errorAnalysis && contentStats.videoTaskStats.errorAnalysis.length > 0 && (
              <>
                <h3 className="text-lg font-semibold mt-6 mb-4">错误分析（Top 10）</h3>
                <Table
                  dataSource={contentStats.videoTaskStats.errorAnalysis}
                  rowKey="errorMessage"
                  pagination={false}
                  columns={[
                    {
                      title: '错误消息',
                      dataIndex: 'errorMessage',
                      key: 'errorMessage',
                    },
                    {
                      title: '出现次数',
                      dataIndex: 'count',
                      key: 'count',
                      width: 120,
                    },
                    {
                      title: '占比',
                      dataIndex: 'percentage',
                      key: 'percentage',
                      width: 100,
                      render: (percentage: number) => `${percentage.toFixed(2)}%`,
                    },
                  ]}
                />
              </>
            )}
          </Card>

          {/* 项目与角色统计 */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="项目统计" className="shadow">
                <Row gutter={16}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="项目总数"
                        value={contentStats.projectStats.totalProjects}
                        prefix={<ProjectOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="今日新增"
                        value={contentStats.projectStats.todayNewProjects}
                      />
                    </Card>
                  </Col>
                </Row>
                <Row gutter={16} className="mt-4">
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="本周新增"
                        value={contentStats.projectStats.weekNewProjects}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="本月新增"
                        value={contentStats.projectStats.monthNewProjects}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="角色统计" className="shadow">
                <Row gutter={16}>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="角色总数"
                        value={contentStats.characterStats.totalCharacters}
                        prefix={<TeamOutlined />}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="今日新增"
                        value={contentStats.characterStats.todayNewCharacters}
                      />
                    </Card>
                  </Col>
                </Row>
                <Row gutter={16} className="mt-4">
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="本周新增"
                        value={contentStats.characterStats.weekNewCharacters}
                      />
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card>
                      <Statistic
                        title="本月新增"
                        value={contentStats.characterStats.monthNewCharacters}
                      />
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default StatisticsPage;
