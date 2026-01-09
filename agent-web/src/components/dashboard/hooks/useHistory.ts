import { useState, useCallback, useRef } from 'react';
import type { Node, Edge } from 'reactflow';

export interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export interface UseHistoryOptions {
  maxHistory?: number;
  debounceMs?: number;
}

export interface UseHistoryReturn {
  pushHistory: (state: HistoryState) => void;
  undo: (currentState: HistoryState) => HistoryState | null;
  redo: (currentState: HistoryState) => HistoryState | null;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
  historyLength: number;
  futureLength: number;
}

/**
 * 工作流历史记录管理 Hook
 * 支持撤销/重做操作
 */
export function useHistory(options: UseHistoryOptions = {}): UseHistoryReturn {
  const { maxHistory = 50, debounceMs = 300 } = options;

  // 历史栈（过去的状态）
  const [past, setPast] = useState<HistoryState[]>([]);
  // 未来栈（撤销后可重做的状态）
  const [future, setFuture] = useState<HistoryState[]>([]);

  // 防抖相关
  const lastPushTimeRef = useRef<number>(0);
  const pendingStateRef = useRef<HistoryState | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 深拷贝状态
  const cloneState = useCallback((state: HistoryState): HistoryState => {
    return {
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      edges: JSON.parse(JSON.stringify(state.edges)),
    };
  }, []);

  // 比较两个状态是否相同
  const isStateEqual = useCallback((a: HistoryState, b: HistoryState): boolean => {
    return JSON.stringify(a) === JSON.stringify(b);
  }, []);

  // 推入历史记录（带防抖）
  const pushHistory = useCallback((state: HistoryState) => {
    const now = Date.now();
    const clonedState = cloneState(state);

    // 清除之前的防抖定时器
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 如果距离上次推入时间小于防抖间隔，暂存状态
    if (now - lastPushTimeRef.current < debounceMs) {
      pendingStateRef.current = clonedState;
      debounceTimerRef.current = setTimeout(() => {
        if (pendingStateRef.current) {
          setPast((prev) => {
            // 跳过重复状态
            if (prev.length > 0 && isStateEqual(prev[prev.length - 1], pendingStateRef.current!)) {
              return prev;
            }
            const newPast = [...prev, pendingStateRef.current!];
            // 限制历史记录数量
            if (newPast.length > maxHistory) {
              newPast.shift();
            }
            return newPast;
          });
          setFuture([]); // 新操作清空未来栈
          pendingStateRef.current = null;
          lastPushTimeRef.current = Date.now();
        }
      }, debounceMs);
      return;
    }

    // 直接推入
    setPast((prev) => {
      // 跳过重复状态
      if (prev.length > 0 && isStateEqual(prev[prev.length - 1], clonedState)) {
        return prev;
      }
      const newPast = [...prev, clonedState];
      // 限制历史记录数量
      if (newPast.length > maxHistory) {
        newPast.shift();
      }
      return newPast;
    });
    setFuture([]); // 新操作清空未来栈
    lastPushTimeRef.current = now;
  }, [cloneState, isStateEqual, maxHistory, debounceMs]);

  // 执行撤销并返回要恢复的状态，同时保存当前状态到未来栈
  const performUndo = useCallback((currentState: HistoryState): HistoryState | null => {
    if (past.length === 0) return null;

    // 立即处理待推入的状态
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const newPast = [...past];
    const previousState = newPast.pop()!;

    setPast(newPast);
    setFuture((prev) => [...prev, cloneState(currentState)]);

    return cloneState(previousState);
  }, [past, cloneState]);

  // 执行重做并返回要恢复的状态，同时保存当前状态到历史栈
  const performRedo = useCallback((currentState: HistoryState): HistoryState | null => {
    if (future.length === 0) return null;

    const newFuture = [...future];
    const nextState = newFuture.pop()!;

    setFuture(newFuture);
    setPast((prev) => [...prev, cloneState(currentState)]);

    return cloneState(nextState);
  }, [future, cloneState]);

  // 清空历史
  const clearHistory = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingStateRef.current = null;
    setPast([]);
    setFuture([]);
  }, []);

  return {
    pushHistory,
    undo: performUndo,
    redo: performRedo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    clearHistory,
    historyLength: past.length,
    futureLength: future.length,
  };
}

/**
 * 使用说明:
 *
 * const { pushHistory, undo, redo, canUndo, canRedo } = useHistory();
 *
 * // 在操作前保存当前状态
 * pushHistory({ nodes, edges });
 *
 * // 撤销：传入当前状态，返回要恢复的状态
 * const previousState = undo({ nodes, edges });
 * if (previousState) {
 *   setNodes(previousState.nodes);
 *   setEdges(previousState.edges);
 * }
 *
 * // 重做：传入当前状态，返回要恢复的状态
 * const nextState = redo({ nodes, edges });
 * if (nextState) {
 *   setNodes(nextState.nodes);
 *   setEdges(nextState.edges);
 * }
 */
