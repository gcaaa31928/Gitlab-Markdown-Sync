import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MarkdownEditor from './components/MarkdownEditor';
import SettingsDialog from './components/SettingsDialog';
import { fetchWikiList, fetchWikiPage, createWikiPage, updateWikiPage, deleteWikiPage } from './services/gitlabService';
import { GitLabConfig, GitLabWikiListItem, WikiPage } from './types';
import { Settings, Save, AlertTriangle, CheckCircle, WifiOff } from 'lucide-react';

const LOCAL_STORAGE_CONFIG_KEY = 'gitlab_wiki_config';

const App: React.FC = () => {
  // Configuration State
  const [config, setConfig] = useState<GitLabConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    return saved ? JSON.parse(saved) : { baseUrl: 'https://gitlab.com', projectId: '', token: '' };
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Data State
  const [pages, setPages] = useState<GitLabWikiListItem[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<WikiPage | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [editedTitle, setEditedTitle] = useState<string>('');
  
  // UI State
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

  // Save config persistence
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
  }, [config]);

  // Initial Load
  useEffect(() => {
    if (config.token && config.projectId) {
      loadPages();
    } else {
      setIsSettingsOpen(true);
    }
  }, [config]);

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    if (type !== 'error') {
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const loadPages = async () => {
    setIsLoadingList(true);
    try {
      const list = await fetchWikiList(config);
      setPages(list);
    } catch (error) {
      showStatus('error', 'Failed to load page list. Check configuration.');
    } finally {
      setIsLoadingList(false);
    }
  };

  const handleSelectPage = async (slug: string) => {
    // If unsaved changes? For simplicity, we assume auto-save isn't blocking, but we should warn or simple switch
    if (activeSlug === slug) return;
    
    setIsSaving(true); // Re-using loading spinner conceptually
    try {
      const page = await fetchWikiPage(config, slug);
      setActivePage(page);
      setActiveSlug(slug);
      setEditedContent(page.content);
      setEditedTitle(page.title);
      setStatusMessage(null);
    } catch (error) {
      showStatus('error', 'Could not load page content.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePage = () => {
    const newSlug = 'new-page-' + Date.now();
    setActivePage({ slug: newSlug, title: 'New Page', format: 'markdown', content: '' });
    setActiveSlug(newSlug);
    setEditedContent('');
    setEditedTitle('New Page');
  };

  const handleSave = async () => {
    if (!activePage) return;
    setIsSaving(true);
    
    try {
      // Check if it's a new page (not in pages list)
      const isNew = !pages.find(p => p.slug === activePage.slug);
      
      let savedPage: WikiPage;
      if (isNew) {
        savedPage = await createWikiPage(config, editedTitle, editedContent);
        setPages(prev => [...prev, { slug: savedPage.slug, title: savedPage.title, format: savedPage.format }]);
      } else {
        savedPage = await updateWikiPage(config, activePage.slug, editedTitle, editedContent);
        // Update list title if changed
        setPages(prev => prev.map(p => p.slug === activePage.slug ? { ...p, title: savedPage.title } : p));
      }

      setActivePage(savedPage);
      setActiveSlug(savedPage.slug);
      setEditedTitle(savedPage.title);
      showStatus('success', 'Page saved to GitLab Wiki.');
    } catch (error) {
      showStatus('error', 'Failed to save changes to GitLab.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            GW
          </div>
          <h1 className="font-semibold text-slate-800">GitLab Wiki Sync</h1>
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">Beta</span>
        </div>

        <div className="flex items-center gap-4">
          {statusMessage && (
            <div className={`text-sm flex items-center gap-2 px-3 py-1 rounded-full animate-fade-in ${
              statusMessage.type === 'error' ? 'bg-red-50 text-red-600' : 
              statusMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'
            }`}>
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4" />}
              {statusMessage.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {statusMessage.text}
            </div>
          )}

          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={`p-2 rounded-lg transition-colors ${
              !config.token ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-100 text-slate-500'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {config.token ? (
          <>
            <Sidebar 
              pages={pages}
              activeSlug={activeSlug}
              onSelectPage={handleSelectPage}
              onCreatePage={handleCreatePage}
              onRefresh={loadPages}
              loading={isLoadingList}
            />
            
            <main className="flex-1 flex flex-col h-full bg-slate-50 p-4 overflow-hidden relative">
              {activePage ? (
                <>
                  <div className="mb-4 flex gap-4">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedTitle(e.target.value)}
                      className="flex-1 text-2xl font-bold bg-transparent border-none outline-none text-slate-800 placeholder-slate-400"
                      placeholder="Page Title"
                    />
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSaving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Save className="w-4 h-4" />}
                      Save to Wiki
                    </button>
                  </div>
                  
                  <div className="flex-1 min-h-0">
                    <MarkdownEditor 
                      content={editedContent}
                      onChange={setEditedContent}
                    />
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <WifiOff className="w-8 h-8 text-slate-300" />
                  </div>
                  <p>Select a page from the sidebar or create a new one.</p>
                </div>
              )}
            </main>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
             <div className="text-center max-w-md">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome to GitLab Wiki Sync</h2>
                <p className="text-slate-600 mb-6">Please configure your GitLab Personal Access Token to start editing your wikis collaboratively.</p>
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all"
                >
                  Configure Connection
                </button>
             </div>
          </div>
        )}
      </div>

      <SettingsDialog 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={setConfig}
      />
    </div>
  );
};

export default App;