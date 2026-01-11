import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { getApiConfig, saveApiConfig, ApiConfig, AVAILABLE_MODELS } from '../services/config';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ApiConfig>({ baseUrl: '', apiKey: '', model: 'gemini-3-pro-image-preview' });

  useEffect(() => {
    if (isOpen) {
      setConfig(getApiConfig());
    }
  }, [isOpen]);

  const handleSave = () => {
    saveApiConfig(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-lg">API 配置</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">中转地址</label>
            <input
              type="text"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="https://api.example.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">例如: https://api.example.com</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">模型</label>
            <select
              value={config.model}
              onChange={(e) => setConfig({ ...config, model: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300 transition-all bg-white"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-black text-white rounded-xl hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Save size={14} />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
