import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from 'node-fetch';
import pino from 'pino';

// --- Logging Setup ---
// Initialize pino logger to write to /tmp/mcp.log
const logger = pino('/tmp/mcp.log');
// --- End Logging Setup ---


// Create an MCP server
const server = new McpServer({
  name: "Node.js API Documentation",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});
logger.info('MCP Server instance created', { name: server.name, version: server.version });

// Function to fetch Node.js API documentation
async function fetchNodeApiDocs() {
  logger.info('Fetching Node.js API documentation...');
  const url = 'https://nodejs.org/docs/latest/api/all.json';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    logger.info('Successfully fetched Node.js API documentation', { url });
    logger.debug('API Docs data sample', { modulesCount: data?.modules?.length }); // Log a debug sample
    return data;
  } catch (error) {
    // Pino automatically logs error objects well
    logger.error({ err: error }, `Failed to fetch Node.js API documentation: ${url}`);
    throw error; // Re-throw to be caught by initializeServer
  }
}

// Function to format documentation content
function formatContent(content) {
  if (!content) return '';
  return content.replace(/\n/g, '\n\n');
}

// Function to create documentation for a module
function createModuleDocumentation(module, { class: classQuery, method: methodQuery } = {}) {
  let content = `# ${module.textRaw}\n\n`;
  
  // Add module description
  if (module.desc) {
    content += `## Description\n${formatContent(module.desc)}\n\n`;
  }

  // Helper function to filter and format items
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

  // Add classes
  content += formatItems(module.classes, 'Classes', classQuery);

  // Add methods
  content += formatItems(module.methods, 'Methods', methodQuery);

  // Add nested modules (always show all submodules)
  content += formatItems(module.modules, 'Submodules');

  return content;
}

// Function to create a tool for a specific module
function createModuleTool(module) {
  const { name, textRaw } = module;

  // Replace any non-alphanumeric character with a dash
  const toolName = `node-${name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}`;
  logger.debug('Creating tool for module:', { toolName });

  server.tool(
    toolName,
    { 
      class: z.string().optional(),
      method: z.string().optional()
    },
    async (params) => {
      const moduleNameParam = params?.module;
      logger.info(`Tool execution started: ${toolName}`, { params });
      try {
        const content = createModuleDocumentation(module);
        logger.info(`Tool execution successful: ${toolName}`);
        return { content: [{ type: "text", text: content }] };
      } catch (error) {
        logger.error({ err: error, params }, `Tool execution failed: ${toolName}`);
        throw error;
      }
    }
  );
}

// Helper function to normalize module names for comparison
function normalizeModuleName(name) {
  return name.toLowerCase().replace(/[_\s-]/g, '');
}

// Helper function to find a module by name
function findModuleByName(modules, searchName) {
  const normalizedSearch = normalizeModuleName(searchName);
  return modules.find(module => 
    normalizeModuleName(module.name) === normalizedSearch ||
    normalizeModuleName(module.textRaw) === normalizedSearch ||
    (module.displayName && normalizeModuleName(module.displayName) === normalizedSearch)
  );
}

// Initialize the server with Node.js API documentation
async function initializeServer() {
  logger.info('Initializing server...');
  try {
    const apiDocs = await fetchNodeApiDocs();
    
    // Remove from the apiDocs.modules any entries that don't have a Class or Method
    const originalCount = apiDocs.modules?.length;
    apiDocs.modules = apiDocs.modules.filter(module => module?.classes?.length > 0 || module?.methods?.length > 0);
    logger.info('Filtered modules', { originalCount, filteredCount: apiDocs.modules?.length });
    
    
    // Create tools for each module
    apiDocs.modules.forEach(module => {
      createModuleTool(module);
    });
    logger.info(`Created ${apiDocs.modules?.length} module tools.`);
    
    // Add a search tool that finds modules by name or lists all if no name is provided
    const searchToolName = "node-search";
    server.tool(
      searchToolName,
      { module: z.string().optional() },
      async (params) => {
        const moduleName = params?.module;
        logger.info(`Tool execution started: ${searchToolName}`, { params });
        let foundModule = null;
        if (moduleName) {
          foundModule = findModuleByName(apiDocs.modules, moduleName);
        }
        
        if (!foundModule) {
          // Module not found OR no module name provided
          let listContent = '';
          if (moduleName) {
             // Add specific message if search term was provided but not found
             // listContent += `# Module "${moduleName}" not found.\n\n`;
          }
          
          listContent += `Available Node.js core modules and their methods:\n\n`;
          
          apiDocs.modules.forEach(module => {
            listContent += `## ${module.displayName || module.textRaw} (${module.name})\n`;
            if (module.methods && module.methods.length > 0) {
              listContent += `### Methods\n`;
              module.methods.forEach(method => {
                listContent += `- ${method.textRaw}\n`;
              });
            } else {
              listContent += `_No methods found_\n`;
            }
            listContent += `\n`;
          });
          
          logger.info(`Tool execution successful: ${searchToolName} (module not found or not specified, returning list)`);
          return { content: [{ type: "text", text: listContent }] };
        }
        
        // Module found, return its full documentation
        const content = createModuleDocumentation(foundModule);
        logger.info(`Tool execution successful: ${searchToolName} (found module: ${foundModule.name})`);
        return { content: [{ type: "text", text: content }] };
      }
    );
    logger.info('Created tool:', { toolName: searchToolName });

    // Add a tool to list all available modules
    const listToolName = "node-list";
    server.tool(
      listToolName,
      {},
      async () => {
        logger.info(`Tool execution started: ${listToolName}`);
        const modules = apiDocs.modules.map(module => ({
          name: module.name,
          displayName: module.displayName || module.textRaw,
          description: module.desc || 'No description available'
        }));

        const content = `# Available Node.js Modules\n\n${modules.map(m => 
          `## ${m.displayName}\n*Name:* ${m.name}\n*Description:* ${formatContent(m.description)}\n`
        ).join('\n')}`;
        logger.info(`Tool execution successful: ${listToolName}`);
        return { content: [{ type: "text", text: content }] };
      }
    );
    logger.info('Created tool:', { toolName: listToolName });

    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    logger.info('Connecting transport...');
    await server.connect(transport);
    logger.info('Server connected to transport. Ready.');
    
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize server');
    console.error('Fatal error during server initialization. Check /tmp/mcp.log for details.');
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT. Shutting down...');
  // Pino typically handles flushing on exit, especially for file streams.
  // Explicit flush can be added if needed: logger.flush()
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Shutting down...');
  // Pino typically handles flushing on exit.
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught Exception');
  console.error('Uncaught Exception! Check /tmp/mcp.log. Shutting down...');
  // Attempt to flush logs, then exit. Pino might exit before flush completes.
  // Consider pino.final for guaranteed flushing.
  logger.flush(); // Attempt synchronous flush
  process.exit(1);

});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled Rejection');
  console.error('Unhandled Rejection! Check /tmp/mcp.log. Shutting down...');
  // Attempt to flush logs, then exit.
  logger.flush(); // Attempt synchronous flush
  process.exit(1);
});

// Start the server
initializeServer();