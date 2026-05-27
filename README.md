# docmost-mcp

MCP server for [Docmost](https://docmost.com). Exposes the full Docmost API as MCP tools over HTTP, so any MCP-compatible AI client can read, create, and manage your workspace.

## Tools

**Pages** — `search_pages`, `get_page`, `list_pages`, `list_child_pages`, `create_page`, `update_page`, `move_page`, `move_page_to_space`, `duplicate_page`, `copy_page_to_space`, `delete_page`

**Spaces** — `get_space`, `list_spaces`, `create_space`, `update_space`

**Comments** — `get_comments`, `create_comment`, `update_comment`, `delete_comment`

**Workspace** — `get_workspace`, `list_workspace_members`, `get_current_user`, `search_attachments`

## Running

### Docker (recommended)

```bash
docker run -e DOCMOST_BASE_URL=https://your-docmost.com \
           -e DOCMOST_EMAIL=you@example.com \
           -e DOCMOST_PASSWORD=yourpassword \
           -p 3000:3000 \
           ghcr.io/rafaribe/docmost-mcp:latest
```

### Docker Compose

```yaml
services:
  docmost-mcp:
    image: ghcr.io/rafaribe/docmost-mcp:latest
    ports:
      - "3000:3000"
    environment:
      DOCMOST_BASE_URL: https://your-docmost.com
      DOCMOST_EMAIL: you@example.com
      DOCMOST_PASSWORD: yourpassword
    restart: unless-stopped
```

## Configuration

| Variable | Required | Description |
|---|---|---|
| `DOCMOST_BASE_URL` | ✅ | URL of your Docmost instance |
| `DOCMOST_EMAIL` | one of | Email for self-hosted login |
| `DOCMOST_PASSWORD` | one of | Password for self-hosted login |
| `DOCMOST_API_TOKEN` | one of | API token (enterprise license) |
| `PORT` | | HTTP port (default: `3000`) |

Either `DOCMOST_API_TOKEN` or `DOCMOST_EMAIL` + `DOCMOST_PASSWORD` is required.

## Connecting

The server listens at `http://localhost:3000/mcp`.

**Kiro / Claude Code:**
```bash
kiro mcp add docmost --transport http http://localhost:3000/mcp
```

**`mcp.json`:**
```json
{
  "mcpServers": {
    "docmost": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Development

```bash
npm install
npm run dev        # watch mode
npm test           # unit tests
npm run typecheck  # type-check without building
```
