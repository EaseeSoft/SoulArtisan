/**
 * 站点关闭页面
 * 当站点配置接口返回500错误时显示
 */
import React from 'react';

const SiteClosed: React.FC = () => {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.iconWrapper}>
          <svg
            style={styles.icon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 8V12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 16H12.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 style={styles.title}>站点已关闭</h1>
        <p style={styles.message}>
          抱歉，当前站点暂时无法访问。
        </p>
        <p style={styles.subMessage}>
          请稍后再试或联系管理员。
        </p>
        <button
          style={styles.retryButton}
          onClick={() => window.location.reload()}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
          }}
        >
          重新加载
        </button>
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
  },
  content: {
    textAlign: 'center',
    color: '#fff',
    maxWidth: '400px',
  },
  iconWrapper: {
    marginBottom: '24px',
  },
  icon: {
    width: '80px',
    height: '80px',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  message: {
    fontSize: '18px',
    marginBottom: '8px',
    opacity: 0.95,
  },
  subMessage: {
    fontSize: '16px',
    opacity: 0.8,
    marginBottom: '32px',
  },
  retryButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: '2px solid rgba(255, 255, 255, 0.5)',
    color: '#fff',
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
  },
};

export default SiteClosed;
