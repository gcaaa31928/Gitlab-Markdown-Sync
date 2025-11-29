
<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { marked } from 'marked';
import { EditorMode, AIActionType } from '../types.ts';
import { processAIAction } from '../services/geminiService.ts';
import { 
  Wand2, 
  Bold, 
  Italic, 
  List, 
  Eye, 
  Edit3, 
  Columns, 
  Loader2
} from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string;
  readOnly?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const mode = ref<EditorMode>(EditorMode.SPLIT);
const isAiLoading = ref(false);
const showAiMenu = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const aiMenuRef = ref<HTMLDivElement | null>(null);

// Computed
const parsedMarkdown = computed(() => {
  return marked.parse(props.modelValue || '', { breaks: true, gfm: true });
});

const aiActionTypes = Object.values(AIActionType);

// Methods
const updateContent = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  emit('update:modelValue', target.value);
};

const insertText = (before: string, after: string = '') => {
  const textarea = textareaRef.value;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = props.modelValue.substring(start, end);
  const newText = before + selectedText + after;
  const newContent = props.modelValue.substring(0, start) + newText + props.modelValue.substring(end);
  
  emit('update:modelValue', newContent);
  
  // Restore focus and selection
  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(start + before.length, end + before.length);
  });
};

const handleAiAction = async (action: AIActionType) => {
  isAiLoading.value = true;
  showAiMenu.value = false;
  
  const textarea = textareaRef.value;
  // If editor isn't focused/mounted, we assume whole doc processing if content exists
  
  let start = 0;
  let end = 0;
  let hasSelection = false;
  
  if (textarea) {
      start = textarea.selectionStart;
      end = textarea.selectionEnd;
      hasSelection = start !== end;
  }

  const textToProcess = hasSelection ? props.modelValue.substring(start, end) : props.modelValue;
  
  if (!textToProcess.trim()) {
      isAiLoading.value = false;
      return;
  }

  try {
    const result = await processAIAction(textToProcess, action);
    
    if (hasSelection) {
      const newContent = props.modelValue.substring(0, start) + result + props.modelValue.substring(end);
      emit('update:modelValue', newContent);
    } else {
      if (action === AIActionType.SUMMARIZE) {
        emit('update:modelValue', props.modelValue + '\n\n### AI Summary\n' + result);
      } else {
        emit('update:modelValue', result);
      }
    }
  } catch (error) {
    console.error(error);
    alert("AI Processing Failed. Please check your network or API key.");
  } finally {
    isAiLoading.value = false;
  }
};

// Click outside handler for AI menu
const handleClickOutside = (event: MouseEvent) => {
  if (aiMenuRef.value && !aiMenuRef.value.contains(event.target as Node)) {
    showAiMenu.value = false;
  }
};

watch(showAiMenu, (val) => {
  if (val) {
    document.addEventListener('mousedown', handleClickOutside);
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
  }
});

</script>

<template>
  <div class="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2 border-b bg-slate-50">
      <div class="flex items-center gap-1">
        <button @click="insertText('**', '**')" class="p-2 hover:bg-slate-200 rounded text-slate-600" title="Bold">
          <Bold class="w-4 h-4" />
        </button>
        <button @click="insertText('*', '*')" class="p-2 hover:bg-slate-200 rounded text-slate-600" title="Italic">
          <Italic class="w-4 h-4" />
        </button>
        <button @click="insertText('- ')" class="p-2 hover:bg-slate-200 rounded text-slate-600" title="List">
          <List class="w-4 h-4" />
        </button>
        
        <div class="h-4 w-px bg-slate-300 mx-2" />

        <div class="relative" ref="aiMenuRef">
          <button 
            @click="showAiMenu = !showAiMenu"
            :disabled="readOnly || isAiLoading"
            :class="`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isAiLoading 
              ? 'bg-blue-100 text-blue-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-sm'
            }`"
          >
            <Loader2 v-if="isAiLoading" class="w-4 h-4 animate-spin" />
            <Wand2 v-else class="w-4 h-4" />
            {{ isAiLoading ? 'Thinking...' : 'AI Assist' }}
          </button>

          <div v-if="showAiMenu" class="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-1">
             <div class="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
               Edit Selection / Doc
             </div>
             <button
              v-for="action in aiActionTypes"
              :key="action"
              @click="handleAiAction(action)"
              class="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
             >
               {{ action }}
             </button>
          </div>
        </div>
      </div>

      <div class="flex items-center bg-slate-200 rounded-lg p-0.5">
        <button 
          @click="mode = EditorMode.EDIT"
          :class="`p-1.5 rounded-md ${mode === EditorMode.EDIT ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`"
        >
          <Edit3 class="w-4 h-4" />
        </button>
        <button 
          @click="mode = EditorMode.SPLIT"
          :class="`p-1.5 rounded-md hidden md:block ${mode === EditorMode.SPLIT ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`"
        >
          <Columns class="w-4 h-4" />
        </button>
        <button 
          @click="mode = EditorMode.PREVIEW"
          :class="`p-1.5 rounded-md ${mode === EditorMode.PREVIEW ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`"
        >
          <Eye class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Editor/Preview Area -->
    <div class="flex-1 flex overflow-hidden relative">
      <textarea
        v-if="mode === EditorMode.EDIT || mode === EditorMode.SPLIT"
        ref="textareaRef"
        :value="modelValue"
        @input="updateContent"
        :disabled="readOnly"
        :class="`flex-1 resize-none p-6 font-mono text-sm outline-none bg-white text-slate-800 border-r border-slate-100 ${
          mode === EditorMode.SPLIT ? 'w-1/2' : 'w-full'
        }`"
        placeholder="Start writing your wiki page here..."
      ></textarea>
      
      <div 
        v-if="mode === EditorMode.PREVIEW || mode === EditorMode.SPLIT"
        :class="`flex-1 overflow-y-auto p-8 prose prose-slate max-w-none bg-slate-50 ${
          mode === EditorMode.SPLIT ? 'w-1/2 hidden md:block' : 'w-full'
        }`"
        v-html="parsedMarkdown"
      >
      </div>
    </div>
  </div>
</template>
