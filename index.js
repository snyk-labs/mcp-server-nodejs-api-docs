#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initLogger } from './utils/logger.js';
import { initializeDocumentationServer } from './server/documentation-server.js';
import { initializeNodejsResources } from './server/nodejs-resources.js';
import { setupErrorHandlers } from './utils/error-handlers.js';

const logger = initLogger();

// Create an MCP server
const server = new McpServer({
  name: "Node.js API Documentation",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Attach logger to server for use in other modules
server.logger = logger;
logger.info({ msg: 'MCP Server instance created', name: server.name, version: server.version });

// Initialize the server with Node.js API documentation
async function startServer() {
  try {
    await initializeDocumentationServer(server);
    await initializeNodejsResources(server);
    
    // Start receiving messages on stdin and sending messages on stdout
    const transport = new StdioServerTransport();
    logger.info({ msg: 'Connecting transport...' });
    await server.connect(transport);
    logger.info({ msg: 'Server connected to transport. Ready.' });
  } catch (error) {
    logger.error({ err: error, msg: 'Failed to initialize server' });
    console.error(`Fatal error during server initialization. Check logs for details.`);
    process.exit(1);
  }
}

// Setup error handlers
setupErrorHandlers(logger);

// Start the server
startServer();
