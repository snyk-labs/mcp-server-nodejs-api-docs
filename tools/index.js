import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { getApiDocsModules } from "../services/api-docs-service.js";
import { formatContent, normalizeModuleName } from "../utils/format.js";
import { initLogger } from "../utils/logger.js";

const logger = initLogger();

export async function initializeTools(server) {
  const { modules } = await getApiDocsModules();

  let tools = {
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

  const extraTools = await createModuleTool(modules);
  tools = { ...tools, ...extraTools };

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

export function createModuleTool(modules) {
  let tools = {};

  modules.forEach((module) => {
    const { name, desc, stabilityText, textRaw } = module;
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

function createModuleDocumentation(
  module,
  { class: classQuery, method: methodQuery } = {}
) {
  let content = `# ${module.textRaw}\n\n`;

  if (module.desc) {
    content += `## Description\n${formatContent(module.desc)}\n\n`;
  }

  const formatItems = (items, title, query) => {
    if (!items || items.length === 0) return "";

    let sectionContent = "";

    // Phase 1, look up data inside the current object
    const filteredItems = query
      ? items.filter(
          (item) =>
            item.textRaw.toLowerCase().includes(query.toLowerCase()) ||
            (item.desc && item.desc.toLowerCase().includes(query.toLowerCase()))
        )
      : items;

    if (filteredItems.length !== 0) {
      let sectionContent = `## ${title}\n\n`;
      filteredItems.forEach((item) => {
        sectionContent += `### ${item.textRaw}\n`;
        if (item.desc) sectionContent += `${formatContent(item.desc)}\n\n`;
      });
    }

    // Phase 2, we dive deeper into nested methods inside module?.modules?.methods

    items.forEach((submodule) => {
      if (submodule?.methods) {
        sectionContent += `### ${submodule.textRaw} Methods\n\n`;
        submodule.methods.forEach((submethod) => {
          sectionContent += `#### ${submethod.textRaw}\n`;
          if (submethod.desc)
            sectionContent += `${formatContent(submethod.desc)}\n\n`;
        });
      }
    });

    return sectionContent;
  };

  content += formatItems(module.classes, "Classes", classQuery);
  content += formatItems(module.methods, "Methods", methodQuery);
  content += formatItems(module.modules, "Submodules", methodQuery);

  return content;
}
