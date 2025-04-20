# MCP Server for Node.js API Documentation

This project implements a Model Context Protocol (MCP) server that provides access to the official Node.js API documentation. It fetches the documentation from `nodejs.org` and exposes it through MCP tools.

## Features

*   Fetches the latest Node.js API documentation.
*   Provides MCP tools to query documentation for specific modules, classes, or methods.
*   Offers a search tool (`node-search`) to find modules or list all available modules with their methods.
*   Offers a list tool (`node-list`) to get a summary of all available modules.
*   Logs activity and errors to `/tmp/mcp-server-nodejs-docs.log` using `pino`.

## Installation

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository_url>
    cd <repository_directory>
    ```
2.  **Install dependencies:**
    This project requires Node.js and npm.
    ```bash
    npm install
    ```

## Usage

To start the MCP server, run the following command in your terminal:

```bash
npm run start
```

The server will initialize, fetch the documentation, create the necessary tools, and then listen for connections over standard input/output (stdio).

## Debugging

The server logs detailed information about its operations, including fetches, tool executions, and errors, to the following file:

```
/tmp/mcp-server-nodejs-docs.log
```

You can monitor this file to debug issues:

```bash
tail -f /tmp/mcp-server-nodejs-docs.log
```

### Testing with MCP Inspector

Use the built-in `debug` script:

```bash
npm run debug
```

Or directly via `npx`:

```bash
npx -y @modelcontextprotocol/inspector node index.js
```

## Connecting to MCP Clients

This server communicates over standard input/output (stdio). To connect it to MCP clients like Cursor or Qodo AI, you need to configure the client to launch the server using its command.

**Example Configuration (Conceptual):**

Most clients will have a settings area where you can add custom MCP servers. You'll typically need to provide:

1.  **A Name:** e.g., "Node.js API Documentation"
2.  **The Command:** The command to execute the server. Make sure to provide the **absolute path** to `node` and the `index.js` file, or ensure `node` is in the PATH environment variable accessible by the client.

    ```bash
    # Example - replace with your actual absolute paths
    /path/to/your/node /path/to/your/project/index.js
    ```

    *   **Finding Node Path:** Run `which node` in your terminal.
    *   **Finding Project Path:** Navigate to the project directory and run `pwd`.

Refer to your specific MCP client's documentation for the exact steps on adding a stdio-based server.

**Example using Cursor:**

1.  Go to `Settings` -> `Cursor Settings` -> `MCP Servers`.
2.  Click `Add Server`.
3.  Enter a name (e.g., "NodeJS API Documentation").
4.  In the `Command` field, enter the full command, like: `/Users/youruser/.nvm/versions/node/v20.11.1/bin/node /Users/youruser/projects/mcp-server-nodejs-docs/index.js` (replace paths with your actual paths).
5.  Save the server configuration.
6.  You should now be able to use the `@NodeJS API Documentation` tag (or whatever name you chose) in your chat prompts. 

## Author

[Liran Tal](https://github.com/lirantal)