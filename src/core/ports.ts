import type {
  Workspace, Space, Page, Comment, User,
  SearchResult, Attachment, DeleteResult,
  CreatePageInput, UpdatePageInput, MovePageInput,
  CreateSpaceInput, UpdateSpaceInput,
  CreateCommentInput, UpdateCommentInput,
} from "./types.js";

export interface DocmostPort {
  // Workspace
  getWorkspace(): Promise<Workspace>;
  listWorkspaceMembers(page?: number): Promise<User[]>;
  getCurrentUser(): Promise<User>;

  // Spaces
  getSpace(spaceId: string): Promise<Space>;
  listSpaces(page?: number): Promise<Space[]>;
  createSpace(input: CreateSpaceInput): Promise<Space>;
  updateSpace(input: UpdateSpaceInput): Promise<Space>;

  // Pages
  getPage(pageId: string): Promise<Page>;
  listPages(spaceId?: string, page?: number): Promise<Page[]>;
  listChildPages(pageId: string): Promise<Page[]>;
  createPage(input: CreatePageInput): Promise<Page>;
  updatePage(input: UpdatePageInput): Promise<Page>;
  movePage(input: MovePageInput): Promise<void>;
  movePageToSpace(pageId: string, targetSpaceId: string): Promise<Page>;
  duplicatePage(pageId: string): Promise<Page>;
  copyPageToSpace(pageId: string, targetSpaceId: string): Promise<Page>;
  deletePage(pageId: string): Promise<void>;
  searchPages(query: string, spaceId?: string): Promise<SearchResult[]>;

  // Comments
  getComments(pageId: string): Promise<Comment[]>;
  createComment(input: CreateCommentInput): Promise<Comment>;
  updateComment(input: UpdateCommentInput): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;

  // Attachments
  searchAttachments(query: string): Promise<Attachment[]>;
}
