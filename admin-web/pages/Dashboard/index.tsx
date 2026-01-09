import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import { Users, FileText, Image, Video, FolderOpen, UserCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { Spin, message } from 'antd';
import { getDashboardStats, getDashboardTrend } from '../../api/dashboard';
import { DashboardStatsData, DashboardTrend } from '../../types';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#6366F1'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [trend, setTrend] = useState<DashboardTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [trendDays, setTrendDays] = useState(7);

  useEffect(() => {
    loadDashboardData();
  }, [trendDays]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, trendData] = await Promise.all([
        getDashboardStats(),
        getDashboardTrend(trendDays)
      ]);
      setStats(statsData);
      setTrend(trendData);
    } catch (error) {
      message.error('加载 Dashboard 数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats || !trend) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // 转换趋势数据格式用于图表
  const trendChartData = trend.dates.map((date, index) => ({
    date: date.substring(5), // 只显示 MM-DD
    用户: trend.userGrowth[index],
    图片任务: trend.imageTasks[index],
    视频任务: trend.videoTasks[index],
    项目: trend.projects[index],
  }));

  // 任务完成率数据
  const taskCompletionData = [
    { name: '图片任务完成率', value: stats.imageTaskCompletionRate },
    { name: '视频任务完成率', value: stats.videoTaskCompletionRate },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">仪表盘概览</h1>
        <div className="flex items-center gap-4">
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            value={trendDays}
            onChange={(e) => setTrendDays(Number(e.target.value))}
          >
            <option value={7}>近 7 天</option>
            <option value={30}>近 30 天</option>
          </select>
          <div className="text-sm text-gray-500">最后更新：刚刚</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-blue-500 bg-opacity-10">
              <Users size={24} className="text-blue-500" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
              今日 +{stats.todayNewUsers}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.totalUsers.toLocaleString()}</h3>
          <p className="text-sm text-gray-500">总用户数</p>
          <p className="text-xs text-gray-400 mt-2">启用: {stats.enabledUsers} / 禁用: {stats.disabledUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-green-500 bg-opacity-10">
              <Image size={24} className="text-green-500" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
              今日 +{stats.todayNewImageTasks}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.totalImageTasks.toLocaleString()}</h3>
          <p className="text-sm text-gray-500">图片任务总数</p>
          <p className="text-xs text-gray-400 mt-2">完成率: {stats.imageTaskCompletionRate.toFixed(1)}%</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-purple-500 bg-opacity-10">
              <Video size={24} className="text-purple-500" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
              今日 +{stats.todayNewVideoTasks}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.totalVideoTasks.toLocaleString()}</h3>
          <p className="text-sm text-gray-500">视频任务总数</p>
          <p className="text-xs text-gray-400 mt-2">完成率: {stats.videoTaskCompletionRate.toFixed(1)}%</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-orange-500 bg-opacity-10">
              <FolderOpen size={24} className="text-orange-500" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-700">
              今日 +{stats.todayNewProjects}
            </span>
          </div>
          <h3 className="text-3xl font-bold text-gray-800 mb-1">{stats.totalProjects.toLocaleString()}</h3>
          <p className="text-sm text-gray-500">项目总数</p>
          <p className="text-xs text-gray-400 mt-2">角色总数: {stats.totalCharacters}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">数据增长趋势</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#6B7280', fontSize: 12}}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{fill: '#6B7280', fontSize: 12}}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="用户"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="图片任务"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="视频任务"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="项目"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Completion Rate Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">任务完成率</h3>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskCompletionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ value }) => `${value.toFixed(1)}%`}
                >
                  {taskCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;