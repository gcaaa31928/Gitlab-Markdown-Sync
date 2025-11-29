import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { EditorMode, AIActionType } from '../types';
import { 
  Wand2, 
  Bold, 
  Italic, 
  List, 
  Eye, 
  Edit3, 
  Columns, 
  Loader2,
  Check
} from 'lucide-react';
import { processAIAction } from '../services/geminiService';

interface MarkdownEditorProps {
  content: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ content, onChange, readOnly = false }) => {
  const [mode, setMode] = useState<EditorMode>(EditorMode.SPLIT);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiMenuRef = useRef<HTMLDivElement>(null);

  // Close AI menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
        setShowAiMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAiAction = async (action: AIActionType) => {
    setIsAiLoading(true);
    setShowAiMenu(false);
    
    // Get selected text or full content
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const hasSelection = start !== end;
    const textToProcess = hasSelection ? content.substring(start, end) : content;

    try {
      const result = await processAIAction(textToProcess, action);
      
      if (hasSelection) {
        // Replace selection
        const newContent = content.substring(0, start) + result + content.substring(end);
        onChange(newContent);
      } else {
        // Append result (if summarization) or Replace (if fix grammar)? 
        // For simplicity in this demo: if no selection, we assume we want to improve the whole doc.
        if (action === AIActionType.SUMMARIZE) {
          onChange(content + '\n\n### AI Summary\n' + result);
        } else {
          onChange(result);
        }
      }
    } catch (error) {
      alert("AI Processing Failed. Check console for details.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = before + selectedText + after;
    const newContent = content.substring(0, start) + newText + content.substring(end);
    
    onChange(newContent);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-50">
        <div className="flex items-center gap-1">
          <button onClick={() => insertText('**', '**')} className="p-2 hover:bg-slate-200 rounded text-slate-600" title="Bold">
            <Bold className="w-4 h-4" />
          </button>
          <button onClick={() => insertText('*', '*')} className="p-2 hover:bg-slate-200 rounded text-slate-600" title="Italic">
            <Italic className="w-4 h-4" />
          </button>
          <button onClick={() => insertText('- ')} className="p-2 hover:bg-slate-200 rounded text-slate-600" title="List">
            <List className="w-4 h-4" />
          </button>
          
          <div className="h-4 w-px bg-slate-300 mx-2" />

          <div className="relative" ref={aiMenuRef}>
            <button 
              onClick={() => setShowAiMenu(!showAiMenu)}
              disabled={readOnly || isAiLoading}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isAiLoading 
                ? 'bg-blue-100 text-blue-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 shadow-sm'
              }`}
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {isAiLoading ? 'Thinking...' : 'AI Assist'}
            </button>

            {showAiMenu && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-100 z-20 py-1 animate-in fade-in slide-in-from-top-2">
                 <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                   Edit Selection
                 </div>
                 {Object.values(AIActionType).map((action) => (
                   <button
                    key={action}
                    onClick={() => handleAiAction(action)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                   >
                     {action}
                   </button>
                 ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center bg-slate-200 rounded-lg p-0.5">
          <button 
            onClick={() => setMode(EditorMode.EDIT)}
            className={`p-1.5 rounded-md ${mode === EditorMode.EDIT ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMode(EditorMode.SPLIT)}
            className={`p-1.5 rounded-md hidden md:block ${mode === EditorMode.SPLIT ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Columns className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setMode(EditorMode.PREVIEW)}
            className={`p-1.5 rounded-md ${mode === EditorMode.PREVIEW ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {(mode === EditorMode.EDIT || mode === EditorMode.SPLIT) && (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
            disabled={readOnly}
            className={`flex-1 resize-none p-6 font-mono text-sm outline-none bg-white text-slate-800 border-r border-slate-100 ${
              mode === EditorMode.SPLIT ? 'w-1/2' : 'w-full'
            }`}
            placeholder="Start writing your wiki page here..."
          />
        )}
        
        {(mode === EditorMode.PREVIEW || mode === EditorMode.SPLIT) && (
          <div className={`flex-1 overflow-y-auto p-8 prose prose-slate max-w-none bg-slate-50 ${
            mode === EditorMode.SPLIT ? 'w-1/2 hidden md:block' : 'w-full'
          }`}>
             <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;