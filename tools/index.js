import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { getApiDocsModules } from "../services/api-docs-service.js";
import { z } from "zod";
import { initLogger } from "../utils/logger.js";

const logger = initLogger();

export async function initializeTools(server) {
  const { modules } = await getApiDocsModules();

  const tools = {
    "search-nodejs-modules-api-documentation": {
      name: "search-nodejs-modules-api-documentation",
      description:
        "**HIGH PRIORITY** List all Node.js modules and their methods. **ALWAYS** consult this tool first to look-up the correct module and then use the specific module tool for full api details",
      inputSchema: {
        type: "object",
        properties: {},
      },
      async handler(args) {
        logger.info({
          msg: `Tool execution started: search-nodejs-modules-api-documentation`,
        });
        let listContent =
          "Available Node.js core modules and their methods:\n\n";

        modules.forEach((module) => {
          listContent += formatModuleSummary(module);
        });

        return { content: [{ type: "text", text: listContent }] };
      },
    },
  };

  const toolsList = Object.keys(tools).map((toolName) => {
    return {
      name: toolName,
      description: tools[toolName].description,
      inputSchema: tools[toolName].inputSchema,
    };
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolsList,
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (!Object.hasOwn(tools, request.params.name)) {
      throw new Error(`Tool ${request.params.name} not found`);
    }
    const tool = tools[request.params.name];

    return await tool.handler(request.params.arguments);
  });
}

function formatModuleSummary(module) {
  let content = `## ${module.displayName || module.textRaw} (${module.name})\n`;

  if (
    (module.methods && module.methods.length > 0) ||
    (module.modules && module.modules.length > 0)
  ) {
    content += `### Methods\n`;

    module?.methods?.forEach((method) => {
      content += `#### ${method.textRaw}\n`;
      content += `#### ${method.desc}\n`;
    });

    module?.modules?.forEach((submodules) => {
      submodules?.methods?.forEach((method) => {
        content += `#### ${method.textRaw}\n`;
        content += `#### ${method.desc}\n`;
      });
    });
  }

  return content + "\n";
}
