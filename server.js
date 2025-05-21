import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { initLogger } from "./utils/logger.js";
import { initializeResources } from "./resources/index.js";
import { initializePrompts } from "./prompts/index.js";

const logger = initLogger();

export async function createMcpServer() {
  const server = new Server(
    {
      name: "nodejs-module-api-documentation",
      description:
        "Search built-in core Node.js modules API Documentation. Use whenever the user asks questions about Node.js API, Node.js modules or Node.js functions.",
      version: "1.0.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    }
  );

  await initializePrompts(server);
  await initializeResources(server);

  logger.info({
    msg: "MCP Server instance created",
    name: server.name,
    version: server.version,
  });

  return server;
}
