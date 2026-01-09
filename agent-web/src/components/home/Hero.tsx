import React from 'react';
import './Hero.css';

const Hero: React.FC = () => {
  const handleExperienceClick = () => {
    // 开始体验逻辑
  };

  return (
    <section className="hero">
      <div className="hero-content">
        <h1>AI驱动的智能视频创作平台</h1>
        <p>
          利用最先进的人工智能技术，将您的创意瞬间转化为震撼的视频作品。
          无需专业技能，只需简单描述，即可生成高质量视频内容。
        </p>
        <button className="cta-button" onClick={handleExperienceClick}>
          立即体验
        </button>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎬</div>
            <h3>文生视频</h3>
            <p>通过自然语言描述生成高质量视频内容</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>智能编辑</h3>
            <p>AI辅助视频剪辑和特效制作</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>快速生成</h3>
            <p>高速渲染引擎，分钟级生成视频</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;