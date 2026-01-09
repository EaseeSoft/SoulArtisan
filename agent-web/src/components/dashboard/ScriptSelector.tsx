import React, { useState, useEffect, useRef } from 'react';
import { getSimpleScriptList, createScript } from '@/api/script';
import { showWarning, showSuccess } from '@/utils/request';
import './ScriptSelector.css';

interface ScriptOption {
  id: number;
  name: string;
  style?: string;
}

interface ScriptSelectorProps {
  value: number | null;
  onChange: (scriptId: number | null, scriptName: string | null, style?: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  allowCreate?: boolean;
  disabled?: boolean;
}

const ScriptSelector: React.FC<ScriptSelectorProps> = ({
  value,
  onChange,
  placeholder = '选择剧本（可选）',
  allowClear = true,
  allowCreate = true,
  disabled = false,
}) => {
  const [scripts, setScripts] = useState<ScriptOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScriptName, setNewScriptName] = useState('');
  const [creating, setCreating] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载剧本列表
  useEffect(() => {
    loadScripts();
  }, []);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const result = await getSimpleScriptList();
      setScripts(result.data || []);
    } catch (error) {
      console.error('加载剧本列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (script: ScriptOption | null) => {
    if (script) {
      onChange(script.id, script.name, script.style);
    } else {
      onChange(null, null, undefined);
    }
    setIsOpen(false);
    setSearchKeyword('');
  };

  const handleCreateScript = async () => {
    if (!newScriptName.trim()) {
      showWarning('请输入剧本名称');
      return;
    }

    setCreating(true);
    try {
      const result = await createScript({
        name: newScriptName.trim(),
      });

      if (result.code === 200 && result.data?.id) {
        const newScript = {
          id: result.data.id as number,
          name: newScriptName.trim(),
        };
        setScripts([newScript, ...scripts]);
        onChange(newScript.id, newScript.name);
        showSuccess('剧本创建成功');
      }

      setShowCreateModal(false);
      setNewScriptName('');
      setIsOpen(false);
    } catch (error) {
      console.error('创建剧本失败:', error);
      showWarning('创建剧本失败');
    } finally {
      setCreating(false);
    }
  };

  const selectedScript = scripts.find((s) => s.id === value);
  const filteredScripts = scripts.filter((s) =>
    s.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  return (
    <div className={`ss-container ${disabled ? 'disabled' : ''}`} ref={containerRef}>
      {/* 选择触发器 */}
      <div
        className={`ss-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="ss-trigger-content">
          {selectedScript ? (
            <>
              <svg className="ss-script-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span className="ss-selected-name">{selectedScript.name}</span>
            </>
          ) : (
            <span className="ss-placeholder">{placeholder}</span>
          )}
        </div>
        <div className="ss-trigger-actions">
          {selectedScript && allowClear && (
            <button
              className="ss-clear-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(null);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg className="ss-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>

      {/* 下拉菜单 */}
      {isOpen && (
        <div className="ss-dropdown">
          {/* 搜索框 */}
          <div className="ss-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="搜索剧本..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              autoFocus
            />
          </div>

          {/* 剧本列表 */}
          <div className="ss-options">
            {loading ? (
              <div className="ss-loading">加载中...</div>
            ) : filteredScripts.length === 0 ? (
              <div className="ss-empty">
                {searchKeyword ? '未找到匹配的剧本' : '暂无剧本'}
              </div>
            ) : (
              filteredScripts.map((script) => (
                <div
                  key={script.id}
                  className={`ss-option ${script.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(script)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  <span>{script.name}</span>
                  {script.id === value && (
                    <svg className="ss-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 创建新剧本 */}
          {allowCreate && (
            <div className="ss-create" onClick={() => setShowCreateModal(true)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>创建新剧本</span>
            </div>
          )}
        </div>
      )}

      {/* 创建剧本模态框 */}
      {showCreateModal && (
        <div className="ss-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="ss-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ss-modal-header">
              <h3>创建新剧本</h3>
              <button className="ss-modal-close" onClick={() => setShowCreateModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="ss-modal-body">
              <input
                type="text"
                placeholder="输入剧本名称"
                value={newScriptName}
                onChange={(e) => setNewScriptName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateScript()}
              />
            </div>
            <div className="ss-modal-footer">
              <button className="ss-btn cancel" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button
                className="ss-btn primary"
                onClick={handleCreateScript}
                disabled={creating || !newScriptName.trim()}
              >
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptSelector;
