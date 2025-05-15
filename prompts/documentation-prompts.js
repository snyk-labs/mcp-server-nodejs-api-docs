import { z } from "zod";
import { initLogger } from '../utils/logger.js';

const logger = initLogger();

export function createToolPrompts(server, modules, listTools) {
  logger.info({ msg: `Creating prompts` });

  server.prompt(
    `nodejs-api-lookup`,
    "Search up-to-date knowledge for Node.js modules API Documentation",
    { module: z.string().optional(), method: z.string().optional() },
    ({ module: moduleName, method: methodQuery }) => {
      const messages = [];

      if (moduleName) {
        messages.push({
          role: "user",
          content: {
            type: "text",
            text: `Use the Node.js API Documentation tool to provide documentation for the module: ${moduleName}. \n\n Available Node.js modules at your disposal are: ${listTools.join(
              ", "
            )}. \n\n`,
          },
        });

        return { messages };
      }

      if (methodQuery) {
        messages.push({
          role: "user",
          content: {
            type: "text",
            text: `Use the Node.js API Documentation tool to provide documentation about the function or method: ${methodQuery}.`,
          },
        });

        return { messages };
      }

      messages.push({
        role: "user",
        content: {
          type: "text",
          text: `Use the Node.js API Documentation tool to provide documentation about core (built-in) Node.js modules and their methods`,
        },
      });

      return { messages };
    }
  );
}
