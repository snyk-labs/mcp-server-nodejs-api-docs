import { initLogger } from "../utils/logger.js";
import { normalizeModuleName } from "../utils/format.js";
import { formatModuleSummary, createModuleDocumentation } from "../services/docs-formatter-service.js";

const logger = initLogger();

export function createSearchTool(modules) {
  return {
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
      let listContent = "Available Node.js core modules and their methods:\n\n";

      modules.forEach((module) => {
        listContent += formatModuleSummary(module);
      });

      return { content: [{ type: "text", text: listContent }] };
    },
  };
}

export function createModuleTools(modules) {
  let tools = {};

  modules.forEach((module) => {
    const { name, textRaw } = module;
    const toolName = normalizeModuleName(name);

    logger.info({ msg: `Creating tool: ${toolName}` });

    const descFormatted = `Node.js API: ${textRaw}`;

    tools[toolName] = {
      name: toolName,
      description: descFormatted,
      inputSchema: {
        type: "object",
        properties: {
          class: {
            type: "string",
            description: "The class name to search for.",
          },
          method: {
            type: "string",
            description: "The method name to search for.",
          },
          required: [],
        },
      },
      async handler(params) {
        logger.info({ msg: `Tool execution started: ${toolName}`, params });
        try {
          let content = createModuleDocumentation(module, params);
          logger.info({ msg: `Tool execution successful: ${toolName}` });
          return { content: [{ type: "text", text: content }] };
        } catch (error) {
          logger.error({
            err: error,
            params,
            msg: `Tool execution failed: ${toolName}`,
          });
          throw error;
        }
      },
    };
  });

  return tools;
}