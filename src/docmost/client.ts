import type {
  Workspace, Space, Page, Comment, User,
  SearchResult, Attachment,
  CreatePageInput, UpdatePageInput, MovePageInput,
  CreateSpaceInput, UpdateSpaceInput,
  CreateCommentInput, UpdateCommentInput,
  Group, GroupMember, CreateGroupInput, UpdateGroupInput,
  SpaceMember, AddSpaceMembersInput, RemoveSpaceMemberInput,
  PageHistory, Label, Backlink,
} from "../core/types.js";
import type { DocmostPort } from "../core/ports.js";
import { convertProseMirrorToMarkdown } from "./markdown.js";

export interface DocmostClientOptions {
  baseUrl: string;
  apiToken?: string;
  email?: string;
  password?: string;
}

export class DocmostClient implements DocmostPort {
  private readonly baseUrl: string;
  private readonly opts: DocmostClientOptions;
  private token: string | null = null;

  constructor(opts: DocmostClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/$/, "");
    this.opts = opts;
    if (opts.apiToken) this.token = opts.apiToken;
  }

  private async ensureAuth(): Promise<void> {
    if (this.token) return;
    if (!this.opts.email || !this.opts.password) {
      throw new Error("No auth: provide DOCMOST_API_TOKEN or DOCMOST_EMAIL + DOCMOST_PASSWORD");
    }
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: this.opts.email, password: this.opts.password }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Login failed ${res.status}: ${body}`);
    }
    const setCookie = res.headers.get("set-cookie") ?? "";
    const match = setCookie.match(/authToken=([^;]+)/);
    if (!match) throw new Error("authToken cookie not found in login response");
    this.token = match[1];
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    await this.ensureAuth();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Docmost API ${options.method ?? "GET"} ${path} → ${res.status}: ${body}`);
    }
    const json = await res.json() as { data: T };
    return json.data;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  private async paginate<T>(path: string, body: Record<string, unknown> = {}): Promise<T[]> {
    const all: T[] = [];
    let page = 1;
    while (true) {
      const res = await this.post<{ items: T[]; meta: { hasNextPage: boolean } }>(path, {
        ...body, limit: 100, page,
      });
      all.push(...res.items);
      if (!res.meta.hasNextPage) break;
      page++;
    }
    return all;
  }

  // --- Workspace ---

  async getWorkspace(): Promise<Workspace> {
    return this.post<Workspace>("/api/workspace/info", {});
  }

  async listWorkspaceMembers(): Promise<User[]> {
    return this.paginate<User>("/api/workspace/members", {});
  }

  async getCurrentUser(): Promise<User> {
    const res = await this.post<{ user: User }>("/api/users/me", {});
    return res.user;
  }

  // --- Spaces ---

  async getSpace(spaceId: string): Promise<Space> {
    return this.post<Space>("/api/spaces/info", { spaceId });
  }

  async listSpaces(): Promise<Space[]> {
    return this.paginate<Space>("/api/spaces/");
  }

  async createSpace(input: CreateSpaceInput): Promise<Space> {
    const base = input.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "space";
    const slug = base + Date.now().toString(36);
    return this.post<Space>("/api/spaces/create", { ...input, slug });
  }

  async updateSpace(input: UpdateSpaceInput): Promise<Space> {
    return this.post<Space>("/api/spaces/update", input);
  }

  async deleteSpace(spaceId: string): Promise<void> {
    await this.post("/api/spaces/delete", { spaceId });
  }

  async listSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
    return this.paginate<SpaceMember>("/api/spaces/members", { spaceId });
  }

  async addSpaceMembers(input: AddSpaceMembersInput): Promise<void> {
    await this.post("/api/spaces/members/add", input);
  }

  async removeSpaceMember(input: RemoveSpaceMemberInput): Promise<void> {
    await this.post("/api/spaces/members/remove", input);
  }

  // --- Pages ---

  async getPage(pageId: string): Promise<Page> {
    const raw = await this.post<Record<string, unknown>>("/api/pages/info", { pageId });
    const content = raw.content
      ? convertProseMirrorToMarkdown(raw.content as Record<string, unknown>)
      : "";

    let subpages: Array<{ id: string; title: string }> = [];
    try {
      const children = await this.post<{ items: Array<{ id: string; title: string }> }>(
        "/api/pages/sidebar-pages", { spaceId: raw.spaceId, pageId, page: 1 },
      );
      subpages = children.items ?? [];
    } catch { /* non-fatal */ }

    let resolvedContent = content;
    if (resolvedContent.includes("{{SUBPAGES}}")) {
      if (subpages.length > 0) {
        const list = subpages.map(p => `- [${p.title}](page:${p.id})`).join("\n");
        resolvedContent = resolvedContent.replace("{{SUBPAGES}}", `### Subpages\n${list}`);
      } else {
        resolvedContent = resolvedContent.replace("{{SUBPAGES}}", "");
      }
    }

    return {
      id: raw.id as string,
      title: raw.title as string,
      parentPageId: raw.parentPageId as string | undefined,
      spaceId: raw.spaceId as string,
      isLocked: raw.isLocked as boolean | undefined,
      content: resolvedContent,
      subpages: subpages.length > 0 ? subpages : undefined,
      createdAt: raw.createdAt as string,
      updatedAt: raw.updatedAt as string,
    };
  }

  async listPages(spaceId?: string): Promise<Page[]> {
    const body: Record<string, unknown> = {};
    if (spaceId) body.spaceId = spaceId;
    return this.paginate<Page>("/api/pages/recent", body);
  }

  async listChildPages(pageId: string): Promise<Page[]> {
    const res = await this.post<{ items: Page[] }>("/api/pages/sidebar-pages", { pageId, page: 1 });
    return res.items ?? [];
  }

  async createPage(input: CreatePageInput): Promise<Page> {
    const created = await this.post<{ id: string }>("/api/pages/create", {
      title: input.title,
      spaceId: input.spaceId,
      ...(input.parentPageId && { parentPageId: input.parentPageId }),
    });
    if (input.content) {
      await this.post("/api/pages/update", {
        pageId: created.id, content: input.content, format: "markdown", operation: "replace",
      });
    }
    return this.getPage(created.id);
  }

  async updatePage(input: UpdatePageInput): Promise<Page> {
    await this.post("/api/pages/update", {
      pageId: input.pageId,
      ...(input.title && { title: input.title }),
      ...(input.content !== undefined && { content: input.content, format: "markdown", operation: "replace" }),
    });
    return this.getPage(input.pageId);
  }

  async movePage(input: MovePageInput): Promise<void> {
    await this.post("/api/pages/move", {
      pageId: input.pageId, parentPageId: input.parentPageId ?? null, position: input.position ?? "a00000",
    });
  }

  async movePageToSpace(pageId: string, targetSpaceId: string): Promise<Page> {
    await this.post("/api/pages/move-to-space", { pageId, spaceId: targetSpaceId });
    return this.getPage(pageId);
  }

  async duplicatePage(pageId: string): Promise<Page> {
    const res = await this.post<{ id: string }>("/api/pages/duplicate", { pageId });
    return this.getPage(res.id);
  }

  async copyPageToSpace(pageId: string, targetSpaceId: string): Promise<Page> {
    const res = await this.post<{ id: string }>("/api/pages/duplicate", { pageId, spaceId: targetSpaceId });
    return this.getPage(res.id);
  }

  async deletePage(pageId: string): Promise<void> {
    await this.post("/api/pages/delete", { pageId });
  }

  async restorePage(pageId: string): Promise<Page> {
    await this.post("/api/pages/restore", { pageId });
    return this.getPage(pageId);
  }

  async listTrash(spaceId: string): Promise<Page[]> {
    return this.paginate<Page>("/api/pages/trash", { spaceId });
  }

  async searchPages(query: string, spaceId?: string): Promise<SearchResult[]> {
    const body: Record<string, unknown> = { query };
    if (spaceId) body.spaceId = spaceId;
    const res = await this.post<Array<Record<string, unknown>>>("/api/search", body);
    return (Array.isArray(res) ? res : []).map(item => ({
      id: item.id as string,
      title: item.title as string,
      parentPageId: item.parentPageId as string | undefined,
      spaceId: (item.space as Record<string, string> | undefined)?.id,
      spaceName: (item.space as Record<string, string> | undefined)?.name,
      highlight: item.highlight as string | undefined,
      rank: item.rank as number | undefined,
      createdAt: item.createdAt as string,
      updatedAt: item.updatedAt as string,
    }));
  }

  async getPageHistory(pageId: string): Promise<PageHistory[]> {
    return this.paginate<PageHistory>("/api/pages/history", { pageId });
  }

  async getPageLabels(pageId: string): Promise<Label[]> {
    return this.paginate<Label>("/api/pages/labels", { pageId });
  }

  async addPageLabels(pageId: string, names: string[]): Promise<void> {
    await this.post("/api/pages/labels/add", { pageId, names });
  }

  async removePageLabel(pageId: string, labelId: string): Promise<void> {
    await this.post("/api/pages/labels/remove", { pageId, labelId });
  }

  async getBacklinks(pageId: string): Promise<Backlink[]> {
    return this.paginate<Backlink>("/api/pages/backlinks", { pageId, direction: "incoming" });
  }

  // --- Comments ---

  async getComments(pageId: string): Promise<Comment[]> {
    return this.paginate<Comment>("/api/comments", { pageId });
  }

  async createComment(input: CreateCommentInput): Promise<Comment> {
    return this.post<Comment>("/api/comments/create", input);
  }

  async updateComment(input: UpdateCommentInput): Promise<Comment> {
    return this.post<Comment>("/api/comments/update", input);
  }

  async deleteComment(commentId: string): Promise<void> {
    await this.post("/api/comments/delete", { commentId });
  }

  // --- Groups ---

  async listGroups(): Promise<Group[]> {
    return this.paginate<Group>("/api/groups/");
  }

  async getGroup(groupId: string): Promise<Group> {
    return this.post<Group>("/api/groups/info", { groupId });
  }

  async createGroup(input: CreateGroupInput): Promise<Group> {
    return this.post<Group>("/api/groups/create", input);
  }

  async updateGroup(input: UpdateGroupInput): Promise<Group> {
    return this.post<Group>("/api/groups/update", input);
  }

  async deleteGroup(groupId: string): Promise<void> {
    await this.post("/api/groups/delete", { groupId });
  }

  async listGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.paginate<GroupMember>("/api/groups/members", { groupId });
  }

  async addGroupMembers(groupId: string, userIds: string[]): Promise<void> {
    await this.post("/api/groups/members/add", { groupId, userIds });
  }

  async removeGroupMember(groupId: string, userId: string): Promise<void> {
    await this.post("/api/groups/members/remove", { groupId, userId });
  }

  // --- Attachments ---

  async searchAttachments(query: string): Promise<Attachment[]> {
    return this.paginate<Attachment>("/api/attachments/search", { query });
  }
}
