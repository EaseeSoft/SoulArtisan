import React from 'react';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import './Footer.css';

const Footer: React.FC = () => {
  const { config } = useSiteConfig();

  // 获取显示名称
  const displayName = config?.displayName || config?.siteName || 'AI Agent Video';
  // 获取描述
  const description = config?.description || '利用人工智能技术，为您提供最先进的视频创作解决方案。让创意无限延伸，让视频制作变得简单高效。';
  // 获取页脚文字
  const footerText = config?.footerText;
  // 获取版权信息
  const copyright = config?.copyright || `© ${new Date().getFullYear()} ${displayName}. 保留所有权利。`;

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>{displayName}</h3>
          <p>{description}</p>
          <div className="social-links">
            <a href="#" className="social-link">📘</a>
            <a href="#" className="social-link">🐦</a>
            <a href="#" className="social-link">📸</a>
            <a href="#" className="social-link">▶️</a>
          </div>
        </div>

        <div className="footer-section">
          <h3>产品功能</h3>
          <ul className="footer-links">
            <li><a href="#"><span>»</span> 文生视频</a></li>
            <li><a href="#"><span>»</span> 智能剪辑</a></li>
            <li><a href="#"><span>»</span> 风格转换</a></li>
            <li><a href="#"><span>»</span> 自动字幕</a></li>
            <li><a href="#"><span>»</span> 背景音乐</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h3>联系我们</h3>
          <div className="contact-info">
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <span>郑州市二七区</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <span>+86 18137829289</span>
            </div>
            <div className="contact-item">
              <span className="contact-icon">✉️</span>
              <span>matuto@qq.com</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        {footerText && <p className="footer-text">{footerText}</p>}
        <p>{copyright}</p>
      </div>
    </footer>
  );
};

export default Footer;