#!/usr/bin/env node

import { createMcpServer } from "./server.js";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { initLogger } from "./utils/logger.js";
import { setupErrorHandlers } from "./utils/error-handlers.js";

const logger = initLogger();

async function startServer() {
  let server;
  try {
    server = await createMcpServer();
  } catch (error) {
    logger.error({ err: error, msg: "Failed to create MCP server" });
    console.error(`Fatal error during server creation.`);
    process.exit(1);
  }

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info({ msg: "Server connected to transport. Ready." });
  } catch (error) {
    logger.error({ err: error, msg: "Failed to initialize server" });
    console.error(`Fatal error during server transport init.`);
    process.exit(1);
  }
}

// Setup error handlers
// setupErrorHandlers(logger);

// Start the server
startServer();
