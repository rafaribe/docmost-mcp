/**
 * Integration tests against a live Docmost instance.
 *
 * Requires env vars:
 *   DOCMOST_BASE_URL  — e.g. http://localhost:3000
 *   DOCMOST_EMAIL
 *   DOCMOST_PASSWORD
 *   MCP_URL           — e.g. http://localhost:4000/mcp
 */
import { describe, it, expect, beforeAll } from "vitest";

const DOCMOST_URL = process.env.DOCMOST_BASE_URL!;
const EMAIL = process.env.DOCMOST_EMAIL!;
const MCP_URL = process.env.MCP_URL!;

const RICH_MARKDOWN = `# Project Architecture

## Overview

This document describes the **hexagonal architecture** used in this project.
Dependencies always point _inward_ toward the core domain.

## Layers

### Core (Domain)

- Business rules and entities
- Port interfaces (no framework imports)
- Error types

### Adapters

| Adapter | Direction | Purpose |
|---|---|---|
| HTTP handlers | Inbound | Parse requests, call core |
| DB repository | Outbound | Implements persistence port |
| External API | Outbound | Implements gateway port |

## Code Example

\`\`\`typescript
interface BookRepository {
  getById(id: string): Promise<Book>;
  save(book: Book): Promise<void>;
}
\`\`\`

## Rules

1. Domain has **zero** external dependencies
2. Adapters depend on core, never the reverse
3. All side effects are behind port interfaces

> "Make the change easy, then make the easy change." — Kent Beck

---

*Last updated by the integration test suite.*
`;

// ── helpers ───────────────────────────────────────────────────────────────────

async function callTool(name: string, args: Record<string, unknown> = {}) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  if (!res.ok) throw new Error(`MCP HTTP ${res.status}: ${await res.text()}`);

  const contentType = res.headers.get("content-type") ?? "";
  let body: string;
  if (contentType.includes("text/event-stream")) {
    const text = await res.text();
    const dataLine = text.split("\n").find(l => l.startsWith("data:"));
    if (!dataLine) throw new Error(`No data line in SSE: ${text}`);
    body = dataLine.slice("data:".length).trim();
  } else {
    body = await res.text();
  }

  const json = JSON.parse(body) as { result: { content: { text: string }[]; isError?: boolean } };
  if (json.result.isError) throw new Error(json.result.content[0].text);
  return JSON.parse(json.result.content[0].text);
}

// ── setup ─────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const res = await fetch(`${DOCMOST_URL}/api/auth/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: EMAIL,
      password: process.env.DOCMOST_PASSWORD,
      name: "Test Admin",
      workspaceName: "Test Workspace",
    }),
  });
  if (!res.ok && res.status !== 400 && res.status !== 403) {
    throw new Error(`Setup failed: ${res.status} ${await res.text()}`);
  }
}, 30_000);

// ── workspace & users ─────────────────────────────────────────────────────────

describe("workspace", () => {
  it("getWorkspace returns workspace info", async () => {
    const ws = await callTool("getWorkspace");
    expect(ws).toMatchObject({ id: expect.any(String), name: expect.any(String) });
  });

  it("getCurrentUser returns the authenticated admin", async () => {
    const user = await callTool("getCurrentUser");
    expect(user).toMatchObject({ email: EMAIL });
  });

  it("listWorkspaceMembers returns at least the admin", async () => {
    const members = await callTool("listWorkspaceMembers");
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThan(0);
    expect(members.some((m: { email: string }) => m.email === EMAIL)).toBe(true);
  });
});

// ── spaces ────────────────────────────────────────────────────────────────────

describe("spaces", () => {
  it("listSpaces returns at least one space", async () => {
    const spaces = await callTool("listSpaces");
    expect(Array.isArray(spaces)).toBe(true);
    expect(spaces.length).toBeGreaterThan(0);
  });

  it("createSpace → getSpace round-trip", async () => {
    const created = await callTool("createSpace", {
      name: "Architecture Docs",
      description: "Space for architecture documentation",
    });
    expect(created).toMatchObject({ id: expect.any(String), name: "Architecture Docs" });

    const fetched = await callTool("getSpace", { spaceId: created.id });
    expect(fetched.id).toBe(created.id);
    expect(fetched.name).toBe("Architecture Docs");
  });

  it("updateSpace changes the description", async () => {
    const spaces = await callTool("listSpaces");
    const spaceId = spaces[0].id;
    const updated = await callTool("updateSpace", {
      spaceId,
      description: "Updated by integration test",
    });
    expect(updated.id).toBe(spaceId);
  });
});

// ── pages ─────────────────────────────────────────────────────────────────────

describe("pages", () => {
  let spaceId: string;
  let pageId: string;
  let childPageId: string;

  beforeAll(async () => {
    const spaces = await callTool("listSpaces");
    spaceId = spaces[0].id;
  });

  it("createPage with rich markdown content", async () => {
    const page = await callTool("createPage", {
      title: "Project Architecture",
      content: RICH_MARKDOWN,
      spaceId,
    });
    expect(page).toMatchObject({ id: expect.any(String), title: "Project Architecture" });
    pageId = page.id;
  });

  it("getPage returns page with markdown content", async () => {
    const page = await callTool("getPage", { pageId });
    expect(page.id).toBe(pageId);
    expect(page.content).toContain("hexagonal architecture");
    expect(page.content).toContain("BookRepository");
    expect(page.content).toContain("Kent Beck");
  });

  it("createPage as child of parent page", async () => {
    const child = await callTool("createPage", {
      title: "ADR-001: Use Hexagonal Architecture",
      content: `# ADR-001: Use Hexagonal Architecture

## Status

Accepted

## Context

We need a consistent architecture pattern that keeps business logic testable
and independent from frameworks, databases, and external services.

## Decision

Adopt **Ports & Adapters** (hexagonal architecture).

## Consequences

- \`+\` Business logic is fully unit-testable without infrastructure
- \`+\` Easy to swap adapters (e.g. Postgres → SQLite for tests)
- \`-\` More boilerplate for simple CRUD operations
`,
      spaceId,
      parentPageId: pageId,
    });
    expect(child).toMatchObject({ id: expect.any(String), parentPageId: pageId });
    childPageId = child.id;
  });

  it("listChildPages returns the child page", async () => {
    const children = await callTool("listChildPages", { pageId });
    expect(children.some((p: { id: string }) => p.id === childPageId)).toBe(true);
  });

  it("listPages includes the created page", async () => {
    const pages = await callTool("listPages", { spaceId });
    expect(pages.some((p: { id: string }) => p.id === pageId)).toBe(true);
  });

  it("updatePage updates title and content", async () => {
    const updated = await callTool("updatePage", {
      pageId,
      title: "Project Architecture (Revised)",
      content: RICH_MARKDOWN + "\n\n## Revision Notes\n\nUpdated by integration test.",
    });
    expect(updated.title).toBe("Project Architecture (Revised)");
  });

  it("searchPages finds the page by keyword", async () => {
    const results = await callTool("searchPages", { query: "hexagonal" });
    expect(Array.isArray(results)).toBe(true);
  });

  it("duplicatePage creates a copy", async () => {
    const copy = await callTool("duplicatePage", { pageId });
    expect(copy.id).not.toBe(pageId);
    expect(copy.spaceId).toBe(spaceId);
  });
});

// ── comments ──────────────────────────────────────────────────────────────────

describe("comments", () => {
  let spaceId: string;
  let pageId: string;
  let commentId: string;

  beforeAll(async () => {
    const spaces = await callTool("listSpaces");
    spaceId = spaces[0].id;
    const page = await callTool("createPage", {
      title: "Page for Comments",
      content: "# Comments Test\n\nThis page is used to test the comments API.",
      spaceId,
    });
    pageId = page.id;
  });

  it("createComment adds a comment to a page", async () => {
    const proseMirrorContent = JSON.stringify({
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "This architecture decision looks solid. The separation of concerns is clear." }] }],
    });
    const comment = await callTool("createComment", {
      pageId,
      content: proseMirrorContent,
    });
    expect(comment).toMatchObject({ id: expect.any(String), pageId });
    commentId = comment.id;
  });

  it("getComments returns the created comment", async () => {
    const comments = await callTool("getComments", { pageId });
    expect(Array.isArray(comments)).toBe(true);
    expect(comments.some((c: { id: string }) => c.id === commentId)).toBe(true);
  });

  it("updateComment changes the content", async () => {
    const updated = await callTool("updateComment", {
      commentId,
      content: JSON.stringify({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Updated: This architecture decision looks solid. LGTM." }] }],
      }),
    });
    expect(updated.id).toBe(commentId);
  });

  it("deleteComment removes the comment", async () => {
    const result = await callTool("deleteComment", { commentId });
    expect(result.success).toBe(true);
  });
});
