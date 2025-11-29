import React, { useState, useEffect } from 'react';
import { GitLabConfig } from '../types';
import { Settings, X, Save, AlertCircle } from 'lucide-react';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: GitLabConfig;
  onSave: (config: GitLabConfig) => void;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<GitLabConfig>(config);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setError(null);
    }
  }, [isOpen, config]);

  const handleChange = (field: keyof GitLabConfig, value: string) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localConfig.baseUrl || !localConfig.projectId || !localConfig.token) {
      setError("All fields are required.");
      return;
    }
    onSave(localConfig);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="flex items-center justify-between p-4 border-b bg-slate-50">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
            <Settings className="w-5 h-5" />
            GitLab Connection
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">GitLab URL</label>
            <input
              type="url"
              value={localConfig.baseUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('baseUrl', e.target.value)}
              placeholder="https://gitlab.com"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Project ID</label>
            <input
              type="text"
              value={localConfig.projectId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('projectId', e.target.value)}
              placeholder="e.g. 12345678"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <p className="text-xs text-slate-500">Found in Project Overview.</p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Personal Access Token</label>
            <input
              type="password"
              value={localConfig.token}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('token', e.target.value)}
              placeholder="glpat-..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <p className="text-xs text-slate-500">Requires <code>api</code> scope.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Connection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsDialog;