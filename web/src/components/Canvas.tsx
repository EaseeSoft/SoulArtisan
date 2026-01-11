import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Line, Group, Text } from 'react-konva';
import { CanvasItem } from '../types';
import { removeBackground } from '@imgly/background-removal';
import {
  Loader2, PenTool, Type, ChevronDown, Download,
  MessageSquarePlus, Scissors, Maximize2, Video,
  Eraser, Sliders, Edit3, Square, Scan, Undo, Redo, X,
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown
} from 'lucide-react';

interface CanvasProps {
  items: CanvasItem[];
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  onItemUpdate: (id: string, updates: Partial<CanvasItem>) => void;
  onItemDelete: (id: string) => void;
  onItemDeleteMultiple: (ids: string[]) => void;
  onItemAdd: (item: CanvasItem) => void;
  onItemReorder: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
}

// 图片节点组件
const ImageNode: React.FC<{
  item: CanvasItem;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (e: any) => void;
  onChange: (attrs: Partial<CanvasItem>) => void;
}> = ({ item, isSelected, isEditing, onSelect, onChange }) => {
  const imageRef = useRef<any>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (item.content && item.status === 'completed') {
      const img = new window.Image();
      img.src = item.content;
      img.onload = () => setImage(img);
    }
  }, [item.content, item.status]);

  if (item.status === 'loading' || !image) {
    return (
      <Group x={item.x} y={item.y}>
        <Rect
          width={item.width}
          height={item.height}
          fill="#f9fafb"
          cornerRadius={12}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.1}
        />
      </Group>
    );
  }

  return (
    <KonvaImage
      ref={imageRef}
      id={item.id}
      image={image}
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      draggable={!isEditing}
      onClick={onSelect}
      onTap={onSelect}
      cornerRadius={12}
      shadowColor="black"
      shadowBlur={isSelected ? 20 : 10}
      shadowOpacity={isSelected ? 0.2 : 0.1}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(50, node.width() * scaleX),
          height: Math.max(50, node.height() * scaleY),
        });
      }}
    />
  );
};

// 文本节点组件
const TextNode: React.FC<{
  item: CanvasItem;
  isSelected: boolean;
  onSelect: (e: any) => void;
  onChange: (attrs: Partial<CanvasItem>) => void;
  onDoubleClick: () => void;
}> = ({ item, isSelected, onSelect, onChange, onDoubleClick }) => {
  const textRef = useRef<any>(null);

  return (
    <Text
      ref={textRef}
      id={item.id}
      text={item.content || '双击编辑文本'}
      x={item.x}
      y={item.y}
      width={item.width}
      fontSize={16}
      fontFamily="sans-serif"
      fill="#333"
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDoubleClick}
      onDblTap={onDoubleClick}
      onDragEnd={(e) => {
        onChange({ x: e.target.x(), y: e.target.y() });
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(50, node.width() * scaleX),
        });
      }}
    />
  );
};

const Canvas: React.FC<CanvasProps> = ({
  items, zoom, onZoomChange, pan, onPanChange, onItemUpdate, onItemDelete, onItemDeleteMultiple, onItemAdd, onItemReorder, selectedIds, setSelectedIds
}) => {
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });

  // 编辑模式状态
  const [editMode, setEditMode] = useState<'none' | 'eraser' | 'inpaint'>('none');
  const [editTool, setEditTool] = useState<'brush' | 'eraser' | 'rect'>('brush');
  const [brushSize, setBrushSize] = useState(30);
  const [inpaintPrompt, setInpaintPrompt] = useState('');

  // 蒙版绘制状态
  const [isDrawing, setIsDrawing] = useState(false);
  const [lines, setLines] = useState<{ points: number[]; tool: string; strokeWidth: number }[]>([]);
  const [lineHistory, setLineHistory] = useState<{ points: number[]; tool: string; strokeWidth: number }[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 框选状态
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);

  // 自定义光标位置
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // 抠图状态
  const [isSegmenting, setIsSegmenting] = useState(false);
  const [maskImage, setMaskImage] = useState<HTMLImageElement | null>(null);

  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);

  // 文本编辑状态
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextValue, setEditingTextValue] = useState('');
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // 获取选中的单个图片项
  const selectedItem = selectedIds.length === 1 ? items.find(i => i.id === selectedIds[0]) : null;

  // 更新舞台尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setStageSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 更新 Transformer
  useEffect(() => {
    if (transformerRef.current && stageRef.current && editMode === 'none') {
      const nodes = selectedIds
        .map(id => stageRef.current.findOne(`#${id}`))
        .filter(Boolean);
      transformerRef.current.nodes(nodes);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedIds, items, editMode]);

  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0 && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        onItemDeleteMultiple(selectedIds);
      }
      if (e.key === 'Escape') {
        setEditMode('none');
        setLines([]);
        setContextMenu(null);
        setEditingTextId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, onItemDeleteMultiple]);

  // 点击其他地方关闭右键菜单
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // 滚轮缩放
  const handleWheel = useCallback((e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    if (e.evt.ctrlKey) {
      // Ctrl + 滚轮缩放
      const oldScale = zoom;
      const pointer = stage.getPointerPosition();
      const scaleBy = 1.05;
      const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
      const clampedScale = Math.min(Math.max(0.1, newScale), 5);

      const mousePointTo = {
        x: (pointer.x - pan.x) / oldScale,
        y: (pointer.y - pan.y) / oldScale,
      };

      onZoomChange(clampedScale);
      onPanChange({
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      });
    } else {
      // 普通滚轮平移
      const dx = e.evt.shiftKey ? -e.evt.deltaY : 0;
      const dy = e.evt.shiftKey ? 0 : -e.evt.deltaY;
      onPanChange({ x: pan.x + dx, y: pan.y + dy });
    }
  }, [zoom, pan, onZoomChange, onPanChange]);

  // 获取相对于选中图片的坐标
  const getRelativePointerPosition = (stage: any) => {
    const pointer = stage.getPointerPosition();
    if (!pointer || !selectedItem) return null;
    return {
      x: (pointer.x - pan.x) / zoom - selectedItem.x,
      y: (pointer.y - pan.y) / zoom - selectedItem.y,
    };
  };

  // 鼠标按下
  const handleMouseDown = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    // 右键点击 - 显示上下文菜单
    if (e.evt.button === 2) {
      e.evt.preventDefault();
      const clickedNode = e.target;
      if (clickedNode !== stage) {
        const itemId = clickedNode.id();
        if (itemId) {
          setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, itemId });
          if (!selectedIds.includes(itemId)) {
            setSelectedIds([itemId]);
          }
        }
      }
      return;
    }

    // 编辑模式下
    if (editMode !== 'none' && selectedItem) {
      const pos = getRelativePointerPosition(stage);
      // 点击在图片区域内 - 开始绘制
      if (pos && pos.x >= 0 && pos.x <= selectedItem.width && pos.y >= 0 && pos.y <= selectedItem.height) {
        setIsDrawing(true);
        setLines([...lines, { points: [pos.x, pos.y], tool: editTool, strokeWidth: brushSize }]);
      }
      // 编辑模式下不执行其他操作
      return;
    }

    // 点击空白区域开始框选
    const clickedOnEmpty = e.target === stage;
    if (clickedOnEmpty && e.evt.button === 0) {
      setSelectedIds([]);
      const pointer = stage.getPointerPosition();
      const pos = {
        x: (pointer.x - pan.x) / zoom,
        y: (pointer.y - pan.y) / zoom,
      };
      selectionStartRef.current = pos;
      setIsSelecting(true);
      setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
    }
  };

  // 鼠标移动
  const handleMouseMove = (e: any) => {
    const stage = stageRef.current;
    if (!stage) return;

    // 更新自定义光标位置 - 使用视口坐标
    if (editMode !== 'none' && selectedItem) {
      setCursorPos({ x: e.evt.clientX, y: e.evt.clientY });
    }

    // 绘制蒙版
    if (isDrawing && editMode !== 'none' && selectedItem) {
      const pos = getRelativePointerPosition(stage);
      if (pos) {
        const lastLine = lines[lines.length - 1];
        lastLine.points = lastLine.points.concat([pos.x, pos.y]);
        setLines([...lines.slice(0, -1), lastLine]);
      }
      return;
    }

    // 框选
    if (isSelecting && selectionStartRef.current) {
      const pointer = stage.getPointerPosition();
      const pos = {
        x: (pointer.x - pan.x) / zoom,
        y: (pointer.y - pan.y) / zoom,
      };
      const start = selectionStartRef.current;
      setSelectionRect({
        x: Math.min(start.x, pos.x),
        y: Math.min(start.y, pos.y),
        width: Math.abs(pos.x - start.x),
        height: Math.abs(pos.y - start.y),
      });
    }
  };

  // 鼠标抬起
  const handleMouseUp = () => {
    // 结束绘制
    if (isDrawing) {
      setIsDrawing(false);
      // 保存历史
      const newHistory = lineHistory.slice(0, historyIndex + 1);
      newHistory.push([...lines]);
      setLineHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    // 结束框选
    if (isSelecting && selectionRect) {
      const selected = items.filter(item => {
        return (
          item.x < selectionRect.x + selectionRect.width &&
          item.x + item.width > selectionRect.x &&
          item.y < selectionRect.y + selectionRect.height &&
          item.y + item.height > selectionRect.y
        );
      }).map(i => i.id);
      setSelectedIds(selected);
      setSelectionRect(null);
      setIsSelecting(false);
      selectionStartRef.current = null;
    }
  };

  // 撤销/重做
  const undoMask = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLines(lineHistory[historyIndex - 1] || []);
    } else if (historyIndex === 0) {
      setHistoryIndex(-1);
      setLines([]);
    }
  };

  const redoMask = () => {
    if (historyIndex < lineHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLines(lineHistory[historyIndex + 1]);
    }
  };

  const exitEditMode = () => {
    setEditMode('none');
    setEditTool('brush');
    setInpaintPrompt('');
    setLines([]);
    setLineHistory([]);
    setHistoryIndex(-1);
    setMaskImage(null);
  };

  // 开始编辑文本
  const startEditingText = (item: CanvasItem) => {
    setEditingTextId(item.id);
    setEditingTextValue(item.content || '');
    setTimeout(() => textInputRef.current?.focus(), 0);
  };

  // 完成文本编辑
  const finishEditingText = () => {
    if (editingTextId) {
      onItemUpdate(editingTextId, { content: editingTextValue });
      setEditingTextId(null);
      setEditingTextValue('');
    }
  };

  // 抠图 - 使用 imgly 进行精准主体分割
  const handleSegmentation = async () => {
    if (!selectedItem || !selectedItem.content) return;

    setIsSegmenting(true);
    try {
      // 将 base64 转换为 Blob
      const response = await fetch(selectedItem.content);
      const blob = await response.blob();

      // 使用 imgly 进行背景移除，获取蒙版
      const maskBlob = await removeBackground(blob, {
        output: { format: 'image/png', type: 'mask' }
      });

      // 创建蒙版图像
      const maskUrl = URL.createObjectURL(maskBlob);
      const maskImg = new window.Image();
      maskImg.src = maskUrl;
      await new Promise((resolve) => { maskImg.onload = resolve; });

      // 创建带颜色的蒙版
      const canvas = document.createElement('canvas');
      canvas.width = selectedItem.width;
      canvas.height = selectedItem.height;
      const ctx = canvas.getContext('2d')!;

      // 绘制缩放后的蒙版
      ctx.drawImage(maskImg, 0, 0, selectedItem.width, selectedItem.height);
      const imageData = ctx.getImageData(0, 0, selectedItem.width, selectedItem.height);

      // 将白色区域转换为半透明蓝色蒙版
      for (let i = 0; i < imageData.data.length; i += 4) {
        const brightness = imageData.data[i]; // 蒙版是灰度图
        if (brightness > 128) {
          imageData.data[i] = 59;      // R
          imageData.data[i + 1] = 130; // G
          imageData.data[i + 2] = 246; // B
          imageData.data[i + 3] = 128; // A (半透明)
        } else {
          imageData.data[i + 3] = 0;   // 透明
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // 转换为图像
      const coloredMaskImg = new window.Image();
      coloredMaskImg.src = canvas.toDataURL();
      await new Promise((resolve) => { coloredMaskImg.onload = resolve; });

      setMaskImage(coloredMaskImg);
      setEditMode('inpaint');
      setLines([]); // 清空手绘线条

      URL.revokeObjectURL(maskUrl);
    } catch (error) {
      console.error('Segmentation failed:', error);
    } finally {
      setIsSegmenting(false);
    }
  };

  // 选择节点
  const handleSelect = (e: any, id: string) => {
    if (editMode !== 'none') return;
    e.cancelBubble = true;
    if (e.evt.shiftKey) {
      setSelectedIds(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
    } else {
      setSelectedIds([id]);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden canvas-grid bg-[#f5f5f5]"
      style={{ cursor: editMode !== 'none' ? 'none' : 'default' }}
      onMouseLeave={() => setCursorPos(null)}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={zoom}
        scaleY={zoom}
        x={pan.x}
        y={pan.y}
        draggable={false}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.evt.preventDefault()}
      >
        {/* 图片层 */}
        <Layer>
          {items.filter(item => item.type === 'image').map((item) => (
            <ImageNode
              key={item.id}
              item={item}
              isSelected={selectedIds.includes(item.id)}
              isEditing={editMode !== 'none' && selectedIds.includes(item.id)}
              onSelect={(e) => handleSelect(e, item.id)}
              onChange={(attrs) => onItemUpdate(item.id, attrs)}
            />
          ))}
          {items.filter(item => item.type === 'text').map((item) => (
            <TextNode
              key={item.id}
              item={item}
              isSelected={selectedIds.includes(item.id)}
              onSelect={(e) => handleSelect(e, item.id)}
              onChange={(attrs) => onItemUpdate(item.id, attrs)}
              onDoubleClick={() => startEditingText(item)}
            />
          ))}
        </Layer>

        {/* 蒙版绘制层 - 相对于选中图片 */}
        {editMode !== 'none' && selectedItem && (
          <Layer>
            <Group x={selectedItem.x} y={selectedItem.y} clipWidth={selectedItem.width} clipHeight={selectedItem.height}>
              {/* AI 生成的蒙版图像 */}
              {maskImage && (
                <KonvaImage
                  image={maskImage}
                  width={selectedItem.width}
                  height={selectedItem.height}
                />
              )}
              {/* 手绘线条 */}
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.tool === 'eraser' ? 'black' : 'rgba(59, 130, 246, 0.5)'}
                  strokeWidth={line.strokeWidth}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={line.tool === 'eraser' ? 'destination-out' : 'source-over'}
                />
              ))}
            </Group>
          </Layer>
        )}

        {/* 框选矩形 */}
        {selectionRect && (
          <Layer>
            <Rect
              x={selectionRect.x}
              y={selectionRect.y}
              width={selectionRect.width}
              height={selectionRect.height}
              fill="rgba(99, 102, 241, 0.1)"
              stroke="#6366f1"
              strokeWidth={1 / zoom}
            />
          </Layer>
        )}

        {/* 变换控件层 */}
        {editMode === 'none' && (
          <Layer>
            <Transformer
              ref={transformerRef}
              keepRatio={true}
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 50 || newBox.height < 50) return oldBox;
                return newBox;
              }}
              anchorFill="white"
              anchorStroke="#6366f1"
              anchorSize={8}
              borderStroke="#6366f1"
              borderStrokeWidth={2}
            />
          </Layer>
        )}
      </Stage>

      {/* 顶部工具栏 - 选中图片且不在编辑模式时显示 */}
      {selectedItem && editMode === 'none' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1001] flex items-center gap-1 bg-white rounded-xl shadow-lg px-2 py-1.5 border border-gray-200">
          <button
            onClick={() => { setEditMode('inpaint'); setLines([]); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Edit3 size={16} />
            <span>局部重绘</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Maximize2 size={16} />
            <span>超清</span>
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleSegmentation}
            disabled={isSegmenting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSegmenting ? <Loader2 size={16} className="animate-spin" /> : <Scissors size={16} />}
            <span>{isSegmenting ? '识别中...' : '抠图'}</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Scan size={16} />
            <span>扩图</span>
          </button>
          <button
            onClick={() => { setEditMode('eraser'); setLines([]); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Eraser size={16} />
            <span>消除笔</span>
          </button>
        </div>
      )}

      {/* 图片上方快捷操作栏 */}
      {selectedItem && editMode === 'none' && (
        <div
          className="absolute z-[1001] flex items-center gap-1 bg-white rounded-lg shadow-lg px-2 py-1 border border-gray-200"
          style={{
            left: selectedItem.x * zoom + pan.x + (selectedItem.width * zoom) / 2,
            top: selectedItem.y * zoom + pan.y - 48,
            transform: 'translateX(-50%)'
          }}
        >
          <button className="flex items-center gap-1.5 px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors whitespace-nowrap">
            <MessageSquarePlus size={16} />
            <span>添加到对话</span>
          </button>
          <button className="p-1.5 text-gray-700 hover:bg-gray-100 rounded transition-colors">
            <Download size={16} />
          </button>
        </div>
      )}

      {/* 编辑模式工具栏 - 跟随图片底部 */}
      {editMode !== 'none' && selectedItem && (
        <div
          className="absolute z-[1001] flex flex-col items-center gap-2"
          style={{
            left: selectedItem.x * zoom + pan.x + (selectedItem.width * zoom) / 2,
            top: selectedItem.y * zoom + pan.y + selectedItem.height * zoom + 12,
            transform: 'translateX(-50%)'
          }}
        >
          {/* 工具栏 */}
          <div className="flex items-center gap-1 bg-white rounded-xl shadow-lg px-3 py-2 border border-gray-200 whitespace-nowrap">
            <button
              onClick={() => setEditTool('brush')}
              className={`p-2 rounded-lg transition-colors ${editTool === 'brush' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="画笔"
            >
              <PenTool size={18} />
            </button>
            <button
              onClick={() => setEditTool('eraser')}
              className={`p-2 rounded-lg transition-colors ${editTool === 'eraser' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="橡皮擦"
            >
              <Eraser size={18} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2 px-2">
              <span className="text-xs text-gray-500">笔刷</span>
              <input
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 h-1 accent-indigo-500"
              />
              <span className="text-xs text-gray-500 w-6">{brushSize}</span>
            </div>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={() => setEditTool('rect')}
              className={`p-2 rounded-lg transition-colors ${editTool === 'rect' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="框选"
            >
              <Square size={18} />
            </button>
            <button className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors" title="自动识别">
              <Scan size={18} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            <button
              onClick={undoMask}
              disabled={historyIndex < 0}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30"
              title="撤销"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={redoMask}
              disabled={historyIndex >= lineHistory.length - 1}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-30"
              title="重做"
            >
              <Redo size={18} />
            </button>
            <div className="w-px h-6 bg-gray-200 mx-1" />
            {editMode === 'eraser' && (
              <button className="px-3 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors">
                消除
              </button>
            )}
            <button
              onClick={exitEditMode}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              title="退出编辑"
            >
              <X size={18} />
            </button>
          </div>
          {/* 局部重绘输入框 */}
          {editMode === 'inpaint' && (
            <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-4 py-2 border border-gray-200">
              <input
                type="text"
                value={inpaintPrompt}
                onChange={(e) => setInpaintPrompt(e.target.value)}
                placeholder="描述你想如何修改图片"
                className="w-72 px-3 py-1.5 text-sm border-none outline-none bg-transparent"
              />
              <button className="px-4 py-1.5 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors">
                生成
              </button>
            </div>
          )}
        </div>
      )}

      {/* 自定义圆形光标 */}
      {editMode !== 'none' && cursorPos && (
        <div
          className="pointer-events-none fixed z-[9999] rounded-full border-2 border-indigo-500"
          style={{
            left: cursorPos.x,
            top: cursorPos.y,
            width: brushSize * zoom,
            height: brushSize * zoom,
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(59, 130, 246, 0.2)'
          }}
        />
      )}

      {/* 右键上下文菜单 */}
      {contextMenu && (
        <div
          className="fixed z-[9999] bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[140px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { onItemReorder(contextMenu.itemId, 'top'); setContextMenu(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <ChevronsUp size={16} /> 置于顶层
          </button>
          <button
            onClick={() => { onItemReorder(contextMenu.itemId, 'up'); setContextMenu(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <ArrowUp size={16} /> 上移一层
          </button>
          <button
            onClick={() => { onItemReorder(contextMenu.itemId, 'down'); setContextMenu(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <ArrowDown size={16} /> 下移一层
          </button>
          <button
            onClick={() => { onItemReorder(contextMenu.itemId, 'bottom'); setContextMenu(null); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <ChevronsDown size={16} /> 置于底层
          </button>
        </div>
      )}

      {/* 文本编辑输入框 */}
      {editingTextId && (() => {
        const editingItem = items.find(i => i.id === editingTextId);
        if (!editingItem) return null;
        return (
          <textarea
            ref={textInputRef}
            value={editingTextValue}
            onChange={(e) => setEditingTextValue(e.target.value)}
            onBlur={finishEditingText}
            onKeyDown={(e) => { if (e.key === 'Escape') { setEditingTextId(null); } }}
            className="fixed z-[9999] bg-transparent border-2 border-indigo-500 rounded outline-none resize-none p-1 text-base"
            style={{
              left: editingItem.x * zoom + pan.x,
              top: editingItem.y * zoom + pan.y,
              width: editingItem.width * zoom,
              minHeight: 40,
              fontFamily: 'sans-serif',
            }}
          />
        );
      })()}
    </div>
  );
};

export default Canvas;
