import { z } from "zod";
import { formatContent, findModuleByName } from '../services/api-docs-service.js';
import { initLogger } from '../utils/logger.js';

const logger = initLogger();

function createModuleDocumentation(module, { class: classQuery, method: methodQuery } = {}) {
  let content = `# ${module.textRaw}\n\n`;
  
  if (module.desc) {
    content += `## Description\n${formatContent(module.desc)}\n\n`;
  }

  const formatItems = (items, title, query) => {
    if (!items || items.length === 0) return '';
    
    const filteredItems = query 
      ? items.filter(item => 
          item.textRaw.toLowerCase().includes(query.toLowerCase()) ||
          (item.desc && item.desc.toLowerCase().includes(query.toLowerCase()))
        )
      : items;

    if (filteredItems.length === 0) return '';

    let sectionContent = `## ${title}\n\n`;
    filteredItems.forEach(item => {
      sectionContent += `### ${item.textRaw}\n`;
      if (item.desc) sectionContent += `${formatContent(item.desc)}\n\n`;
    });
    return sectionContent;
  };

  content += formatItems(module.classes, 'Classes', classQuery);
  content += formatItems(module.methods, 'Methods', methodQuery);
  content += formatItems(module.modules, 'Submodules');

  return content;
}

export function createModuleTool(server, module) {
  const { name, textRaw } = module;
  const toolName = `node-${name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}`;
  
  server.tool(
    toolName,
    { 
      class: z.string().optional(),
      method: z.string().optional()
    },
    async (params) => {
      logger.info({ msg: `Tool execution started: ${toolName}`, params });
      try {
        const content = createModuleDocumentation(module, params);
        logger.info({ msg: `Tool execution successful: ${toolName}` });
        return { content: [{ type: "text", text: content }] };
      } catch (error) {
        logger.error({ err: error, params, msg: `Tool execution failed: ${toolName}` });
        throw error;
      }
    }
  );
}

export function createSearchTool(server, modules) {
  server.tool(
    "node-search",
    { module: z.string().optional() },
    async (params) => {
      const moduleName = params?.module;
      logger.info({ msg: 'Tool execution started: node-search', params });
      
      const foundModule = moduleName ? findModuleByName(modules, moduleName) : null;
      
      if (!foundModule) {
        let listContent = moduleName ? 
          `# Module "${moduleName}" not found.\n\n` : 
          'Available Node.js core modules and their methods:\n\n';
        
        modules.forEach(module => {
          listContent += formatModuleSummary(module);
        });
        
        return { content: [{ type: "text", text: listContent }] };
      }
      
      const content = createModuleDocumentation(foundModule);
      return { content: [{ type: "text", text: content }] };
    }
  );
}

export function createListTool(server, modules) {
  server.tool(
    "node-list",
    {},
    async () => {
      logger.info({ msg: 'Tool execution started: node-list' });
      const content = formatModulesList(modules);
      return { content: [{ type: "text", text: content }] };
    }
  );
}

function formatModuleSummary(module) {
  let content = `## ${module.displayName || module.textRaw} (${module.name})\n`;
  if (module.methods && module.methods.length > 0) {
    content += `### Methods\n`;
    module.methods.forEach(method => {
      content += `- ${method.textRaw}\n`;
    });
  } else {
    content += `_No methods found_\n`;
  }
  return content + '\n';
}

function formatModulesList(modules) {
  const modulesList = modules.map(module => ({
    name: module.name,
    displayName: module.displayName || module.textRaw,
    description: module.desc || 'No description available'
  }));

  return `# Available Node.js Modules\n\n${modulesList.map(m => 
    `## ${m.displayName}\n*Name:* ${m.name}\n*Description:* ${formatContent(m.description)}\n`
  ).join('\n')}`;
}