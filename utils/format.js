export function formatContent(content) {
    if (!content) return '';
    return content.replace(/\n/g, '\n\n');
  }
  
  export function normalizeModuleName(name) {
    return name.toLowerCase().replace(/[^a-zA-Z0-9\_\-]/g, '')
  }