import { describe, it, expect, vi } from "vitest";
import type { DocmostPort } from "../core/ports.js";
import { pageHandlers } from "../mcp/handlers/pages.js";

const mockClient = (): DocmostPort => ({
  getWorkspace: vi.fn(),
  listWorkspaceMembers: vi.fn(),
  getCurrentUser: vi.fn(),
  getSpace: vi.fn(),
  listSpaces: vi.fn(),
  createSpace: vi.fn(),
  updateSpace: vi.fn(),
  getPage: vi.fn(),
  listPages: vi.fn(),
  listChildPages: vi.fn(),
  createPage: vi.fn(),
  updatePage: vi.fn(),
  movePage: vi.fn(),
  movePageToSpace: vi.fn(),
  duplicatePage: vi.fn(),
  copyPageToSpace: vi.fn(),
  deletePage: vi.fn(),
  searchPages: vi.fn(),
  getComments: vi.fn(),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  deleteComment: vi.fn(),
  searchAttachments: vi.fn(),
});

describe("pageHandlers", () => {
  it("getPage returns page as JSON", async () => {
    const client = mockClient();
    const page = { id: "1", title: "Test", spaceId: "s1", createdAt: "", updatedAt: "" };
    vi.mocked(client.getPage).mockResolvedValue(page);

    const result = await pageHandlers(client).getPage.handler({ pageId: "1" });

    expect(result.content[0].text).toBe(JSON.stringify(page, null, 2));
    expect(result).not.toHaveProperty("isError");
  });

  it("getPage returns error on failure", async () => {
    const client = mockClient();
    vi.mocked(client.getPage).mockRejectedValue(new Error("not found"));

    const result = await pageHandlers(client).getPage.handler({ pageId: "bad" }) as { isError: boolean; content: { type: string; text: string }[] };

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain("not found");
  });

  it("deletePage returns success", async () => {
    const client = mockClient();
    vi.mocked(client.deletePage).mockResolvedValue(undefined);

    const result = await pageHandlers(client).deletePage.handler({ pageId: "1" });

    expect(JSON.parse(result.content[0].text)).toMatchObject({ success: true, pageId: "1" });
  });

  it("movePage returns success", async () => {
    const client = mockClient();
    vi.mocked(client.movePage).mockResolvedValue(undefined);

    const result = await pageHandlers(client).movePage.handler({ pageId: "1", parentPageId: "2" });

    expect(JSON.parse(result.content[0].text)).toMatchObject({ success: true });
  });

  it("searchPages passes query and spaceId", async () => {
    const client = mockClient();
    vi.mocked(client.searchPages).mockResolvedValue([]);

    await pageHandlers(client).searchPages.handler({ query: "hello", spaceId: "s1" });

    expect(client.searchPages).toHaveBeenCalledWith("hello", "s1");
  });
});
