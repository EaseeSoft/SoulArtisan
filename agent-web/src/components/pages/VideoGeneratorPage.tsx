import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import VideoGenerator from '../generators/VideoGenerator';
import MyVideoHistory from '../history/MyVideoHistory';
import './VideoGeneratorPage.css';

const VideoGeneratorPage: React.FC = () => {
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);

    // 触发历史记录刷新
    const handleRefreshHistory = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="video-generator-page">
            {/* 顶部导航栏 */}
            <header className="video-page-header">
                <button onClick={() => navigate('/dashboard')} className="video-back-button">
                    ← 返回工作台
                </button>
                <h1 className="video-page-title">AI 视频生成</h1>
                <div style={{ width: '120px' }}></div>
            </header>

            {/* 主内容区域 */}
            <main className="video-page-content">
                <div className="video-content-wrapper">
                    {/* 左侧：生成表单 */}
                    <div className="video-generator-container">
                        <VideoGenerator onGenerated={handleRefreshHistory} />
                    </div>

                    {/* 右侧：历史记录 */}
                    <div className="video-history-container">
                        <MyVideoHistory key={refreshKey} />
                    </div>
                </div>
            </main>

            {/* 底部信息栏 */}
            <footer className="video-page-footer">
                <p>© 2025 AI Agent Video Platform. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default VideoGeneratorPage;
