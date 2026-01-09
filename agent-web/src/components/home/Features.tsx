import React from 'react';
import './Features.css';

const Features: React.FC = () => {
  const features = [
    {
      icon: '🎬',
      title: '文生视频',
      description: '通过自然语言描述生成高质量视频内容，支持多种风格和场景。',
      link: '#'
    },
    {
      icon: '🎨',
      title: '智能编辑',
      description: 'AI辅助视频剪辑和特效制作，自动优化视频节奏和视觉效果。',
      link: '#'
    },
    {
      icon: '⚡',
      title: '快速生成',
      description: '高速渲染引擎，分钟级生成视频，大幅提升创作效率。',
      link: '#'
    },
    {
      icon: '🌐',
      title: '云端协作',
      description: '支持多人实时协作，随时随地共享和编辑视频项目。',
      link: '#'
    }
  ];

  return (
    <section className="features">
      <div className="features-container">
        <div className="section-title">
          <h2>核心功能</h2>
          <p>我们提供全方位的AI视频创作解决方案，助您轻松实现创意构想</p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <a href={feature.link} className="feature-link">
                了解更多 →
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;