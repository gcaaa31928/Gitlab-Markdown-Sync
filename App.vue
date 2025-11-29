
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import Sidebar from './components/Sidebar.vue';
import MarkdownEditor from './components/MarkdownEditor.vue';
import SettingsDialog from './components/SettingsDialog.vue';
import { fetchWikiList, fetchWikiPage, createWikiPage, updateWikiPage } from './services/gitlabService.ts';
import type { GitLabConfig, GitLabWikiListItem, WikiPage } from './types.ts';
import { Settings, AlertTriangle, CheckCircle, WifiOff, Save } from 'lucide-vue-next';

const LOCAL_STORAGE_CONFIG_KEY = 'gitlab_wiki_config';

// Initialize Config Synchronously
const getSavedConfig = (): GitLabConfig => {
  const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse config from local storage');
    }
  }
  return { baseUrl: 'https://gitlab.com', projectId: '', token: '' };
};

// State
const config = ref<GitLabConfig>(getSavedConfig());
const isSettingsOpen = ref(false);
const pages = ref<GitLabWikiListItem[]>([]);
const activeSlug = ref<string | null>(null);
const activePage = ref<WikiPage | null>(null);
const editedContent = ref('');
const editedTitle = ref('');
const isLoadingList = ref(false);
const isSaving = ref(false);
const statusMessage = ref<{ type: 'success' | 'error' | 'info', text: string } | null>(null);

// Lifecycle
onMounted(() => {
  // Config is already loaded. If we have credentials, load data immediately.
  if (config.value.token && config.value.projectId) {
    loadPages();
  } else {
    isSettingsOpen.value = true;
  }
});

// Persist config whenever it changes
watch(config, (newConfig) => {
  localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
}, { deep: true });

// Methods
const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
  statusMessage.value = { type, text };
  if (type !== 'error') {
    setTimeout(() => {
      statusMessage.value = null;
    }, 3000);
  }
};

const loadPages = async () => {
  if (!config.value.token) return;
  setIsLoadingList(true);
  try {
    const list = await fetchWikiList(config.value);
    pages.value = list;
  } catch (error) {
    showStatus('error', 'Failed to load page list. Check configuration.');
  } finally {
    setIsLoadingList(false);
  }
};

const handleSelectPage = async (slug: string) => {
  if (activeSlug.value === slug) return;
  
  isSaving.value = true;
  try {
    const page = await fetchWikiPage(config.value, slug);
    activePage.value = page;
    activeSlug.value = slug;
    editedContent.value = page.content;
    editedTitle.value = page.title;
    statusMessage.value = null;
  } catch (error) {
    showStatus('error', 'Could not load page content.');
  } finally {
    isSaving.value = false;
  }
};

const handleCreatePage = () => {
  const newSlug = 'new-page-' + Date.now();
  activePage.value = { slug: newSlug, title: 'New Page', format: 'markdown', content: '' };
  activeSlug.value = newSlug;
  editedContent.value = '';
  editedTitle.value = 'New Page';
};

const handleSave = async () => {
  if (!activePage.value) return;
  isSaving.value = true;
  
  try {
    const isNew = !pages.value.find(p => p.slug === activePage.value?.slug);
    
    let savedPage: WikiPage;
    if (isNew) {
      savedPage = await createWikiPage(config.value, editedTitle.value, editedContent.value);
      pages.value.push({ slug: savedPage.slug, title: savedPage.title, format: savedPage.format });
    } else {
      savedPage = await updateWikiPage(config.value, activePage.value.slug, editedTitle.value, editedContent.value);
      // Update list title if changed
      const idx = pages.value.findIndex(p => p.slug === activePage.value?.slug);
      if (idx !== -1) {
        pages.value[idx].title = savedPage.title;
      }
    }

    activePage.value = savedPage;
    activeSlug.value = savedPage.slug;
    editedTitle.value = savedPage.title;
    showStatus('success', 'Page saved to GitLab Wiki.');
  } catch (error) {
    showStatus('error', 'Failed to save changes to GitLab.');
  } finally {
    isSaving.value = false;
  }
};

const handleConfigSave = (newConfig: GitLabConfig) => {
  config.value = newConfig;
  isSettingsOpen.value = false;
  loadPages();
};
</script>

<template>
  <div class="flex flex-col h-screen bg-white text-slate-900">
    <!-- Top Header -->
    <header class="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
          V3
        </div>
        <h1 class="font-semibold text-slate-800">GitLab Wiki Sync</h1>
        <span class="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-medium">Vue</span>
      </div>

      <div class="flex items-center gap-4">
        <div v-if="statusMessage" 
          :class="`text-sm flex items-center gap-2 px-3 py-1 rounded-full transition-all ${
            statusMessage.type === 'error' ? 'bg-red-50 text-red-600' : 
            statusMessage.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-600'
          }`">
          <AlertTriangle v-if="statusMessage.type === 'error'" class="w-4 h-4" />
          <CheckCircle v-if="statusMessage.type === 'success'" class="w-4 h-4" />
          {{ statusMessage.text }}
        </div>

        <button 
          @click="isSettingsOpen = true"
          :class="`p-2 rounded-lg transition-colors ${
            !config.token ? 'bg-red-100 text-red-600 animate-pulse' : 'hover:bg-slate-100 text-slate-500'
          }`"
          title="Settings"
        >
          <Settings class="w-5 h-5" />
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex flex-1 overflow-hidden">
      <template v-if="config.token">
        <Sidebar 
          :pages="pages"
          :activeSlug="activeSlug"
          :loading="isLoadingList"
          @select-page="handleSelectPage"
          @create-page="handleCreatePage"
          @refresh="loadPages"
        />
        
        <main class="flex-1 flex flex-col h-full bg-slate-50 p-4 overflow-hidden relative">
          <template v-if="activePage">
            <div class="mb-4 flex gap-4">
              <input
                type="text"
                v-model="editedTitle"
                class="flex-1 text-2xl font-bold bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 focus:ring-0"
                placeholder="Page Title"
              />
              <button
                @click="handleSave"
                :disabled="isSaving"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span v-if="isSaving" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                <Save v-else class="w-4 h-4" />
                Save to Wiki
              </button>
            </div>
            
            <div class="flex-1 min-h-0">
              <MarkdownEditor 
                v-model="editedContent"
              />
            </div>
          </template>
          
          <div v-else class="h-full flex flex-col items-center justify-center text-slate-400">
            <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <WifiOff class="w-8 h-8 text-slate-300" />
            </div>
            <p>Select a page from the sidebar or create a new one.</p>
          </div>
        </main>
      </template>

      <div v-else class="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
         <div class="text-center max-w-md">
            <h2 class="text-xl font-bold text-slate-800 mb-2">Welcome to GitLab Wiki Sync</h2>
            <p class="text-slate-600 mb-6">Please configure your GitLab Personal Access Token to start editing your wikis collaboratively.</p>
            <button 
              @click="isSettingsOpen = true"
              class="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all"
            >
              Configure Connection
            </button>
         </div>
      </div>
    </div>

    <SettingsDialog 
      v-if="isSettingsOpen"
      :config="config"
      @close="isSettingsOpen = false"
      @save="handleConfigSave"
    />
  </div>
</template>
