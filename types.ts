
export interface GitLabConfig {
  baseUrl: string; // e.g., https://gitlab.com
  projectId: string;
  token: string;
  useProxy?: boolean;
  proxyUrl?: string; // e.g., http://localhost:8080/
}

export interface WikiPage {
  slug: string;
  title: string;
  format: string;
  content: string;
}

// Minimal shape for the GitLab API response for list
export interface GitLabWikiListItem {
  slug: string;
  title: string;
  format: string;
}

export enum EditorMode {
  EDIT = 'EDIT',
  PREVIEW = 'PREVIEW',
  SPLIT = 'SPLIT'
}

export enum AIActionType {
  FIX_GRAMMAR = 'Fix Grammar',
  SUMMARIZE = 'Summarize',
  EXPAND = 'Expand Idea',
  TRANSLATE_EN = 'Translate to English',
  TRANSLATE_ZH = 'Translate to Traditional Chinese'
}
