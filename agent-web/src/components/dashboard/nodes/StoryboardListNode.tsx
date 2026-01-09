import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { useWorkflowStore } from '../hooks/useWorkflowStore';
import { showSuccess, showWarning, showError } from '../../../utils/request';
import { getCameraPrompt } from '../../../api/playbook';
import './StoryboardListNode.css';

interface ShotItem {
  shot_number: number;
  duration: string;
  camera: string;
  environment: string;
  characters_present: string[];
  spatial_relation: string;
  detailed_action: string;
  dialogue: string;
  vfx: string;
}

interface StoryboardListNodeProps {
  data: {
    label: string;
    cameraList?: {
      shots: ShotItem[];
    };
  };
  id: string;
}

const StoryboardListNode: React.FC<StoryboardListNodeProps> = ({ data, id }) => {
  const { getNodes, setNodes, getEdges, setEdges } = useReactFlow();
  const getEnumsCache = useWorkflowStore((state) => state.getEnumsCache);
  const currentProjectStyle = useWorkflowStore((state) => state.currentProjectStyle);

  // 选中的分镜索引
  const [selectedShots, setSelectedShots] = useState<Set<number>>(new Set());

  // 编辑状态
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingShot, setEditingShot] = useState<ShotItem | null>(null);

  // 生成参数
  const [style, setStyle] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // 枚举数据
  const [enums, setEnums] = useState<{
    styles: { value: string | number; label: string }[];
    aspectRatios: { value: string | number; label: string }[];
  }>({
    styles: [],
    aspectRatios: []
  });

  // 从缓存加载枚举数据
  useEffect(() => {
    const cachedEnums = getEnumsCache();
    if (cachedEnums) {
      setEnums({
        styles: cachedEnums.styles || [],
        aspectRatios: cachedEnums.videoAspectRatios || []
      });
    } else {
      const timer = setTimeout(() => {
        const retryCache = getEnumsCache();
        if (retryCache) {
          setEnums({
            styles: retryCache.styles || [],
            aspectRatios: retryCache.videoAspectRatios || []
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [getEnumsCache]);

  // 默认使用项目风格
  useEffect(() => {
    if (currentProjectStyle && !style) {
      setStyle(currentProjectStyle);
    }
  }, [currentProjectStyle]);

  const shots = data.cameraList?.shots || [];

  // 切换选中状态
  const toggleShot = (index: number) => {
    const newSelected = new Set(selectedShots);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedShots(newSelected);
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedShots.size === shots.length) {
      setSelectedShots(new Set());
    } else {
      setSelectedShots(new Set(shots.map((_, i) => i)));
    }
  };

  // 开始编辑分镜
  const startEditing = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingIndex(index);
    setEditingShot({ ...shots[index] });
  };

  // 保存编辑
  const saveEditing = () => {
    if (editingIndex === null || !editingShot) return;

    // 更新节点数据中的 shots
    const newShots = [...shots];
    newShots[editingIndex] = editingShot;

    const nodes = getNodes();
    setNodes(
      nodes.map((node) =>
        node.id === id
          ? {
              ...node,
              data: {
                ...node.data,
                cameraList: {
                  ...node.data.cameraList,
                  shots: newShots,
                },
              },
            }
          : node
      )
    );

    setEditingIndex(null);
    setEditingShot(null);
    showSuccess('保存成功');
  };

  // 取消编辑
  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingShot(null);
  };

  // 更新编辑中的字段
  const updateEditingField = (field: keyof ShotItem, value: string | string[]) => {
    if (!editingShot) return;
    setEditingShot({ ...editingShot, [field]: value });
  };

  // 构建单个分镜的描述
  const buildShotDescription = (shot: ShotItem): string => {
    const parts: string[] = [];

    if (shot.duration) parts.push(`时长：${shot.duration}`);
    if (shot.camera) parts.push(`镜头：${shot.camera}`);
    if (shot.environment) parts.push(`场景：${shot.environment}`);
    if (shot.spatial_relation) parts.push(`空间关系：${shot.spatial_relation}`);
    if (shot.detailed_action) parts.push(`动作：${shot.detailed_action}`);
    if (shot.dialogue) parts.push(`对白：${shot.dialogue}`);
    if (shot.vfx) parts.push(`特效：${shot.vfx}`);

    // 添加角色引用
    if (shot.characters_present && shot.characters_present.length > 0) {
      const charRefs = shot.characters_present.map(c => c.startsWith('@') ? `[${c}  ]` : `[@${c}  ]`).join(' ');
      parts.push(`角色：${charRefs}`);
    }

    return parts.join('，');
  };

  // 生成分镜图提示词
  const handleGenerateImagePrompt = async () => {
    if (selectedShots.size === 0) {
      showWarning('请至少选择一个分镜');
      return;
    }

    setIsGeneratingImage(true);

    try {
      const nodes = getNodes();
      const edges = getEdges();
      const currentNode = nodes.find(n => n.id === id);
      const startX = currentNode ? currentNode.position.x + 500 : 600;
      const startY = currentNode ? currentNode.position.y : 100;

      // 按顺序获取选中的分镜
      const sortedSelectedIndices = Array.from(selectedShots).sort((a, b) => a - b);

      // 拼接所有选中分镜的提示词
      const promptParts: string[] = [];
      sortedSelectedIndices.forEach((shotIndex, orderIndex) => {
        const shot = shots[shotIndex];
        const shotDesc = buildShotDescription(shot);
        promptParts.push(`【第${orderIndex + 1}镜】${shotDesc}`);
      });

      const scriptScript = promptParts.join('\n');

      // 调用 gemini 接口获取分镜图提示词
      const result = await getCameraPrompt(scriptScript);

      if (result.code !== 200) {
        showError(`获取提示词失败: ${result.msg}`);
        return;
      }

      const imagePrompt = result.data;

      // 获取选中分镜的编号列表
      const selectedShotNumbers = sortedSelectedIndices.map(idx => shots[idx].shot_number);
      const shotNumbersStr = selectedShotNumbers.map(n => `#${n}`).join(', ');

      // 创建分镜图生成节点，保存分镜脚本文案和 gemini 返回的提示词
      const imageNodeId = `storyboard-image-${Date.now()}`;
      const imageNode = {
        id: imageNodeId,
        type: 'storyboardImageNode',
        position: {
          x: startX,
          y: startY,
        },
        data: {
          label: `分镜图生成 (${shotNumbersStr})`,
          shotNumbers: selectedShotNumbers, // 分镜编号数组
          scriptScript: scriptScript, // 分镜脚本文案（选中的分镜项文本）
          prompt: imagePrompt, // gemini 获取的提示词
          style: style,
          size: aspectRatio,
        },
      };

      const edge = {
        id: `edge-${id}-${imageNodeId}`,
        source: id,
        target: imageNodeId,
        animated: true,
      };

      setNodes([...nodes, imageNode]);
      setEdges([...edges, edge]);
      showSuccess('已生成分镜图提示词');
    } catch (error: any) {
      showError(`生成失败: ${error.message || '未知错误'}`);
      console.error('生成分镜图提示词失败:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // 渲染分镜项
  const renderShotItem = (shot: ShotItem, index: number) => {
    const isSelected = selectedShots.has(index);
    const isEditing = editingIndex === index;

    // 编辑模式
    if (isEditing && editingShot) {
      return (
        <div key={index} className="shot-item editing nodrag">
          <div className="shot-edit-form nowheel">
            <div className="edit-row">
              <label>时长:</label>
              <input
                type="text"
                value={editingShot.duration}
                onChange={(e) => updateEditingField('duration', e.target.value)}
                className="edit-input nodrag"
              />
            </div>
            <div className="edit-row">
              <label>镜头:</label>
              <input
                type="text"
                value={editingShot.camera}
                onChange={(e) => updateEditingField('camera', e.target.value)}
                className="edit-input nodrag"
              />
            </div>
            <div className="edit-row">
              <label>场景:</label>
              <input
                type="text"
                value={editingShot.environment}
                onChange={(e) => updateEditingField('environment', e.target.value)}
                className="edit-input nodrag"
              />
            </div>
            <div className="edit-row">
              <label>空间:</label>
              <textarea
                value={editingShot.spatial_relation}
                onChange={(e) => updateEditingField('spatial_relation', e.target.value)}
                className="edit-textarea nodrag nowheel"
                rows={2}
              />
            </div>
            <div className="edit-row">
              <label>动作:</label>
              <textarea
                value={editingShot.detailed_action}
                onChange={(e) => updateEditingField('detailed_action', e.target.value)}
                className="edit-textarea nodrag nowheel"
                rows={3}
              />
            </div>
            <div className="edit-row">
              <label>对白:</label>
              <input
                type="text"
                value={editingShot.dialogue}
                onChange={(e) => updateEditingField('dialogue', e.target.value)}
                className="edit-input nodrag"
              />
            </div>
            <div className="edit-row">
              <label>特效:</label>
              <input
                type="text"
                value={editingShot.vfx}
                onChange={(e) => updateEditingField('vfx', e.target.value)}
                className="edit-input nodrag"
              />
            </div>
            <div className="edit-actions">
              <button className="edit-save-btn" onClick={saveEditing}>✓ 保存</button>
              <button className="edit-cancel-btn" onClick={cancelEditing}>✕ 取消</button>
            </div>
          </div>
        </div>
      );
    }

    // 展示模式
    return (
      <div
        key={index}
        className={`shot-item ${isSelected ? 'selected' : ''}`}
        onClick={() => toggleShot(index)}
      >
        <div className="shot-checkbox">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleShot(index)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="shot-content">
          <div className="shot-header">
            <span className="shot-number">#{shot.shot_number}</span>
            <span className="shot-duration">{shot.duration}</span>
            <button className="shot-edit-btn" onClick={(e) => startEditing(index, e)} title="编辑">✎</button>
          </div>
          <div className="shot-details">
            {shot.camera && (
              <div className="shot-field">
                <span className="field-label">镜头:</span>
                <span className="field-value">{shot.camera}</span>
              </div>
            )}
            {shot.environment && (
              <div className="shot-field">
                <span className="field-label">场景:</span>
                <span className="field-value">{shot.environment}</span>
              </div>
            )}
            {shot.spatial_relation && (
              <div className="shot-field">
                <span className="field-label">空间:</span>
                <span className="field-value">{shot.spatial_relation}</span>
              </div>
            )}
            {shot.detailed_action && (
              <div className="shot-field">
                <span className="field-label">动作:</span>
                <span className="field-value">{shot.detailed_action}</span>
              </div>
            )}
            {shot.dialogue && (
              <div className="shot-field dialogue">
                <span className="field-label">对白:</span>
                <span className="field-value">"{shot.dialogue}"</span>
              </div>
            )}
            {shot.vfx && (
              <div className="shot-field">
                <span className="field-label">特效:</span>
                <span className="field-value vfx">{shot.vfx}</span>
              </div>
            )}
            {shot.characters_present && shot.characters_present.length > 0 && (
              <div className="shot-field">
                <span className="field-label">角色:</span>
                <span className="field-value characters">
                  {shot.characters_present.join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="storyboard-list-node">
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />

      <div className="node-header">
        <strong>📋 {data.label}</strong>
        <span className="selected-count">
          {selectedShots.size}/{shots.length}
        </span>
      </div>

      <div className="node-body">
        {/* 全选按钮 */}
        {shots.length > 0 && (
          <div className="select-all-row">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={selectedShots.size === shots.length && shots.length > 0}
                onChange={toggleSelectAll}
              />
              全选
            </label>
          </div>
        )}

        {/* 分镜列表 */}
        <div className="shots-list nodrag nowheel">
          {shots.length === 0 ? (
            <div className="empty-list">暂无分镜数据</div>
          ) : (
            shots.map((shot, index) => renderShotItem(shot, index))
          )}
        </div>

        {/* 生成参数 */}
        {shots.length > 0 && (
          <div className="generation-options">
            <div className="options-row">
              <div className="option-item style-item">
                <label className="option-label">风格</label>
                <select
                  className="option-select nodrag"
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  disabled={isGeneratingImage}
                >
                  <option value="">无</option>
                  {enums.styles.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="option-item ratio-item">
                <label className="option-label">尺寸</label>
                <select
                  className="option-select nodrag"
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  disabled={isGeneratingImage}
                >
                  {enums.aspectRatios.length > 0 ? (
                    enums.aspectRatios.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="16:9">16:9</option>
                      <option value="9:16">9:16</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <button
              className="generate-image-btn"
              onClick={handleGenerateImagePrompt}
              disabled={isGeneratingImage || selectedShots.size === 0}
            >
              {isGeneratingImage ? '生成中...' : `🎨 生成分镜图`}
            </button>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: '#667eea', width: 10, height: 10 }}
      />
    </div>
  );
};

export default StoryboardListNode;
