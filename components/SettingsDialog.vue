
<script setup lang="ts">
import { ref, watch } from 'vue';
import type { GitLabConfig } from '../types.ts';
import { Settings, X, Save, AlertCircle, Server } from 'lucide-vue-next';

const props = defineProps<{
  config: GitLabConfig;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', config: GitLabConfig): void;
}>();

const localConfig = ref<GitLabConfig>({ 
  ...props.config,
  useProxy: props.config.useProxy ?? false,
  proxyUrl: props.config.proxyUrl ?? 'http://localhost:8080/'
});
const error = ref<string | null>(null);

watch(() => props.config, (newVal) => {
  localConfig.value = { 
    ...newVal,
    useProxy: newVal.useProxy ?? false,
    proxyUrl: newVal.proxyUrl ?? 'http://localhost:8080/'
  };
  error.value = null;
});

const handleSubmit = (e: Event) => {
  e.preventDefault();
  if (!localConfig.value.baseUrl || !localConfig.value.projectId || !localConfig.value.token) {
    error.value = "All fields are required.";
    return;
  }
  emit('save', localConfig.value);
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div class="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
      <div class="flex items-center justify-between p-4 border-b bg-slate-50">
        <h2 class="text-lg font-semibold flex items-center gap-2 text-slate-800">
          <Settings class="w-5 h-5" />
          GitLab Connection
        </h2>
        <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit="handleSubmit" class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
        <div v-if="error" class="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle class="w-4 h-4" />
          {{ error }}
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700">GitLab URL</label>
          <input
            type="url"
            v-model="localConfig.baseUrl"
            placeholder="https://gitlab.com"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700">Project ID</label>
          <input
            type="text"
            v-model="localConfig.projectId"
            placeholder="e.g. 12345678"
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <p class="text-xs text-slate-500">Found in Project Overview.</p>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-slate-700">Personal Access Token</label>
          <input
            type="password"
            v-model="localConfig.token"
            placeholder="glpat-..."
            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <p class="text-xs text-slate-500">Requires <code>api</code> scope.</p>
        </div>

        <!-- CORS Proxy Section -->
        <div class="pt-4 border-t border-slate-100">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Server class="w-4 h-4 text-slate-500" />
              Use CORS Proxy
            </label>
            <button 
              type="button"
              @click="localConfig.useProxy = !localConfig.useProxy"
              :class="`w-10 h-5 rounded-full transition-colors relative ${localConfig.useProxy ? 'bg-blue-600' : 'bg-slate-300'}`"
            >
              <span :class="`absolute top-1 left-1 bg-white w-3 h-3 rounded-full transition-transform ${localConfig.useProxy ? 'translate-x-5' : ''}`"></span>
            </button>
          </div>
          
          <div v-if="localConfig.useProxy" class="space-y-1 animate-in slide-in-from-top-2 fade-in">
             <input
              type="url"
              v-model="localConfig.proxyUrl"
              placeholder="e.g. http://localhost:8080/"
              class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-slate-50 text-sm"
            />
            <p class="text-xs text-slate-500 leading-relaxed">
              Required for GitLab.com to bypass CORS. 
              <br/>Run <code>node proxy-server.js</code> locally or use a service like <code>https://cors-anywhere.herokuapp.com/</code>.
            </p>
          </div>
        </div>

        <div class="pt-4 flex justify-end gap-3">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save class="w-4 h-4" />
            Save Connection
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
