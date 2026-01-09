/**
 * 图像生成页面
 * 包装 ImageGenerator 组件，提供页面布局和导航
 */

import React from 'react';
import {useNavigate} from 'react-router-dom';
import ImageGenerator from '../generators/ImageGenerator';
import './ImageGeneratorPage.css';

const ImageGeneratorPage: React.FC = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/dashboard');
    };

    return (
        <div className="image-generator-page">
            {/* 顶部导航栏 */}
            <header className="page-header">
                <button onClick={handleBack} className="image-back-button">
                    ← 返回工作台
                </button>
                <h1 className="page-title">AI 图像生成</h1>
                <div style={{ width: '120px' }}></div>
            </header>

            {/* 主内容区域 */}
            <main className="page-content">
                <div className="content-wrapper">
                    <ImageGenerator
                        onGenerated={(imageUrl) => {
                            console.log('图片生成成功:', imageUrl);
                            // 可以在这里添加额外的处理逻辑
                        }}
                    />
                </div>
            </main>

            {/* 底部信息栏（可选） */}
            <footer className="page-footer">
                <p>© 2025 AI Agent Video Platform. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default ImageGeneratorPage;
