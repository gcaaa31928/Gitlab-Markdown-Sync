
import { GitLabConfig, WikiPage, GitLabWikiListItem } from '../types.ts';

/**
 * Helper to construct headers for JSON mutations (POST/PUT)
 */
const getJsonHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'PRIVATE-TOKEN': token,
});

/**
 * Helper to construct headers for READ operations (GET)
 * Note: Do NOT send Content-Type for GET requests to avoid triggering preflight OPTIONS
 * on some strict proxies, although cors-anywhere handles it well.
 */
const getReadHeaders = (token: string) => ({
  'PRIVATE-TOKEN': token,
});

/**
 * Helper to normalize and construct the API URL
 * Supports routing through a CORS proxy if configured
 */
const getApiUrl = (config: GitLabConfig, path: string = '') => {
  let base = config.baseUrl.trim().replace(/\/$/, '');
  // Ensure protocol is present
  if (!base.startsWith('http')) {
    base = `https://${base}`;
  }
  
  // Construct target GitLab API URL
  const targetPath = `/api/v4/projects/${encodeURIComponent(config.projectId)}/wikis${path}`;
  const fullTargetUrl = `${base}${targetPath}`;

  // If proxy is enabled, prepend the proxy URL
  if (config.useProxy && config.proxyUrl) {
    const proxy = config.proxyUrl.trim().replace(/\/$/, '');
    // Standard cors-anywhere format: proxyUrl + fullTargetUrl
    // Example: http://localhost:8080/https://gitlab.com/api/v4/...
    return `${proxy}/${fullTargetUrl}`;
  }

  return fullTargetUrl;
};

export const fetchWikiList = async (config: GitLabConfig): Promise<GitLabWikiListItem[]> => {
  if (!config.token || !config.projectId) return [];
  
  try {
    const url = new URL(getApiUrl(config));
    // GitLab API: don't fetch content for list view to save bandwidth
    url.searchParams.append('with_content', '0');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getReadHeaders(config.token),
    });

    if (!response.ok) {
      let details = '';
      try {
        const errBody = await response.json();
        details = errBody.message || errBody.error || '';
      } catch (e) { /* ignore */ }
      
      throw new Error(`${response.status} ${response.statusText} ${details ? '- ' + details : ''}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GitLab API Error (List):', error);
    throw error;
  }
};

export const fetchWikiPage = async (config: GitLabConfig, slug: string): Promise<WikiPage> => {
  try {
    // Note: We pass the slug path to getApiUrl
    const url = getApiUrl(config, `/${encodeURIComponent(slug)}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: getReadHeaders(config.token),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GitLab API Error (Page):', error);
    throw error;
  }
};

export const createWikiPage = async (config: GitLabConfig, title: string, content: string): Promise<WikiPage> => {
  try {
    const url = getApiUrl(config);
    const response = await fetch(url, {
      method: 'POST',
      headers: getJsonHeaders(config.token),
      body: JSON.stringify({
        title,
        content,
        format: 'markdown'
      }),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GitLab API Error (Create):', error);
    throw error;
  }
};

export const updateWikiPage = async (config: GitLabConfig, slug: string, title: string, content: string): Promise<WikiPage> => {
  try {
    const url = getApiUrl(config, `/${encodeURIComponent(slug)}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers: getJsonHeaders(config.token),
      body: JSON.stringify({
        title,
        content,
        format: 'markdown'
      }),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GitLab API Error (Update):', error);
    throw error;
  }
};

export const deleteWikiPage = async (config: GitLabConfig, slug: string): Promise<void> => {
  try {
    const url = getApiUrl(config, `/${encodeURIComponent(slug)}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getReadHeaders(config.token),
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('GitLab API Error (Delete):', error);
    throw error;
  }
};
