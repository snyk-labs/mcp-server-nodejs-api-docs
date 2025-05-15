import { z } from "zod";
import { findModuleByName } from '../services/api-docs-service.js';
import { formatContent, normalizeModuleName } from "../utils/format.js";
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
  const { name, desc, stabilityText, textRaw } = module;
  const toolName = normalizeModuleName(name);
  
  logger.info({msg: `Creating tool: ${toolName}`});

  const descFormatted = `Node.js API: ${textRaw}`

  const notFoundMotivation = `[[INSTRUCTIONS FOR NOT FOUND: If you didn't find the module or method, you should try searching in one of the other core Node.js modules ]]`;

  server.tool(
    toolName,
    descFormatted,
    { 
      class: z.string().optional(),
      method: z.string().optional()
    },
    async (params) => {
      logger.info({ msg: `Tool execution started: ${toolName}`, params });
      try {
        let content = createModuleDocumentation(module, params);
        content += `\n${notFoundMotivation}\n\n`;
        logger.info({ msg: `Tool execution successful: ${toolName}` });
        return { content: [{ type: "text", text: content }] };
      } catch (error) {
        logger.error({ err: error, params, msg: `Tool execution failed: ${toolName}` });
        throw error;
      }
    }
  );
}

export function createSearchTool(server, modules, listTools) {

  const notFoundMotivation = `[[INSTRUCTIONS FOR NOT FOUND: If you didn't find the module or method, you must try searching in one of these core Node.js modules: ${listTools.join(', ')} ]]`;

  server.tool(
    "nodejs_api_search",
    "Search for modules and methods in the Node.js API documentation",
    { module: z.string().optional() },
    async (params) => {
      const moduleName = params?.module;
      logger.info({ msg: 'Tool execution started: nodejs_api_search', params });
      
      const foundModule = moduleName ? findModuleByName(modules, moduleName) : null;
      
      if (!foundModule) {
        let listContent = 'Available Node.js core modules and their methods:\n\n';
        
        modules.forEach(module => {
          listContent += formatModuleSummary(module);
        });
        
        listContent += `\n${notFoundMotivation}\n\n`;
        return { content: [{ type: "text", text: listContent }] };
      }
      
      let content = createModuleDocumentation(foundModule);
      content += `\n${notFoundMotivation}\n\n`;
      return { content: [{ type: "text", text: content }] };
    }
  );
}

export function createListTool(server, modules) {
  server.tool(
    "nodejs-api-list",
    "List all available Node.js modules and their methods",
    {},
    async () => {
      logger.info({ msg: 'Tool execution started: nodejs-api-list' });
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