
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GitLabWikiListItem } from '../types.ts';
import { FileText, Plus, Search, RefreshCw } from 'lucide-vue-next';

const props = defineProps<{
  pages: GitLabWikiListItem[];
  activeSlug: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'select-page', slug: string): void;
  (e: 'create-page'): void;
  (e: 'refresh'): void;
}>();

const search = ref('');

const filteredPages = computed(() => {
  return props.pages.filter(p => 
    p.title.toLowerCase().includes(search.value.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.value.toLowerCase())
  );
});
</script>

<template>
  <div class="w-64 bg-slate-50 border-r border-slate-200 flex flex-col h-full">
    <div class="p-4 border-b border-slate-200">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-slate-700">Pages</h2>
        <div class="flex gap-1">
           <button 
            @click="$emit('refresh')"
            :class="`p-1.5 hover:bg-slate-200 rounded-md text-slate-500 transition-all ${loading ? 'animate-spin' : ''}`"
            title="Refresh List"
          >
            <RefreshCw class="w-4 h-4" />
          </button>
          <button 
            @click="$emit('create-page')"
            class="p-1.5 hover:bg-blue-100 hover:text-blue-600 rounded-md text-slate-500 transition-colors"
            title="New Page"
          >
            <Plus class="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div class="relative">
        <Search class="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter pages..."
          v-model="search"
          class="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <div v-if="loading && pages.length === 0" class="text-center py-8 text-slate-400 text-sm">
        Loading pages...
      </div>
      <div v-else-if="filteredPages.length === 0" class="text-center py-8 text-slate-400 text-sm">
        {{ search ? 'No matches found.' : 'No pages yet.' }}
      </div>
      <button
        v-else
        v-for="page in filteredPages"
        :key="page.slug"
        @click="$emit('select-page', page.slug)"
        :class="`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
          activeSlug === page.slug 
            ? 'bg-white shadow-sm border border-slate-100 text-blue-600 font-medium' 
            : 'text-slate-600 hover:bg-slate-200/50'
        }`"
      >
        <FileText class="w-4 h-4 shrink-0 opacity-70" />
        <span class="truncate">{{ page.title }}</span>
      </button>
    </div>
    
    <div class="p-4 border-t border-slate-200 text-xs text-slate-400 text-center">
      {{ pages.length }} Pages • GitLab Wiki
    </div>
  </div>
</template>
