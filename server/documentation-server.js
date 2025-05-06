import { fetchNodeApiDocs } from '../services/api-docs-service.js';
import { createModuleTool, createSearchTool, createListTool } from '../tools/documentation-tools.js';
import { initLogger } from '../utils/logger.js';

const logger = initLogger();

export async function initializeDocumentationServer(server) {
  logger.info({ msg: 'Initializing documentation server...' });
  
  const apiDocs = await fetchNodeApiDocs();
  
  // Remove entries without Class or Method
  const originalCount = apiDocs.modules?.length;
  apiDocs.modules = apiDocs.modules.filter(module => 
    module?.classes?.length > 0 || module?.methods?.length > 0
  );
  logger.info({ msg: 'Filtered modules', originalCount, filteredCount: apiDocs.modules?.length });
  
  // Create tools for each module
  apiDocs.modules.forEach(module => {
    createModuleTool(server, module);
  });
  logger.info({ msg: `Created ${apiDocs.modules?.length} module tools.` });
  
  // Create search and list tools
  createSearchTool(server, apiDocs.modules);
  createListTool(server, apiDocs.modules);
}