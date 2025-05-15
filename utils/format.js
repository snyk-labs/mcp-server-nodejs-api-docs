export function formatContent(content) {
    if (!content) return '';
    return content.replace(/\n/g, '\n\n');
  }
  
  export function normalizeModuleName(name) {
    const toolName = `get_api_for-${name.toLowerCase().replace(/[^a-zA-Z0-9\_\-]/g, '')}`;
    return toolName.length > 64 ? toolName.slice(0, 63) : toolName;
  }