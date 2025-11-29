import React, { useState } from 'react';
import { GitLabWikiListItem } from '../types';
import { FileText, Plus, Search, Trash2, RefreshCw } from 'lucide-react';

interface SidebarProps {
  pages: GitLabWikiListItem[];
  activeSlug: string | null;
  onSelectPage: (slug: string) => void;
  onCreatePage: () => void;
  onRefresh: () => void;
  loading: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  pages, 
  activeSlug, 
  onSelectPage, 
  onCreatePage,
  onRefresh,
  loading 
}) => {
  const [search, setSearch] = useState('');

  const filteredPages = pages.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-700">Pages</h2>
          <div className="flex gap-1">
             <button 
              onClick={onRefresh}
              className={`p-1.5 hover:bg-slate-200 rounded-md text-slate-500 transition-all ${loading ? 'animate-spin' : ''}`}
              title="Refresh List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button 
              onClick={onCreatePage}
              className="p-1.5 hover:bg-blue-100 hover:text-blue-600 rounded-md text-slate-500 transition-colors"
              title="New Page"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Filter pages..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && pages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Loading pages...
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            {search ? 'No matches found.' : 'No pages yet.'}
          </div>
        ) : (
          filteredPages.map((page) => (
            <button
              key={page.slug}
              onClick={() => onSelectPage(page.slug)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                activeSlug === page.slug 
                  ? 'bg-white shadow-sm border border-slate-100 text-blue-600 font-medium' 
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0 opacity-70" />
              <span className="truncate">{page.title}</span>
            </button>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center">
        {pages.length} Pages • GitLab Wiki
      </div>
    </div>
  );
};

export default Sidebar;