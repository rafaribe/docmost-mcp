import type {
  Workspace, Space, Page, Comment, User,
  SearchResult, Attachment,
  CreatePageInput, UpdatePageInput, MovePageInput,
  CreateSpaceInput, UpdateSpaceInput,
  CreateCommentInput, UpdateCommentInput,
  Group, GroupMember, CreateGroupInput, UpdateGroupInput,
  SpaceMember, AddSpaceMembersInput, RemoveSpaceMemberInput,
  PageHistory, Label, Backlink,
} from "./types.js";

export interface DocmostPort {
  // Workspace
  getWorkspace(): Promise<Workspace>;
  listWorkspaceMembers(): Promise<User[]>;
  getCurrentUser(): Promise<User>;

  // Spaces
  getSpace(spaceId: string): Promise<Space>;
  listSpaces(): Promise<Space[]>;
  createSpace(input: CreateSpaceInput): Promise<Space>;
  updateSpace(input: UpdateSpaceInput): Promise<Space>;
  deleteSpace(spaceId: string): Promise<void>;
  listSpaceMembers(spaceId: string): Promise<SpaceMember[]>;
  addSpaceMembers(input: AddSpaceMembersInput): Promise<void>;
  removeSpaceMember(input: RemoveSpaceMemberInput): Promise<void>;

  // Pages
  getPage(pageId: string): Promise<Page>;
  listPages(spaceId?: string): Promise<Page[]>;
  listChildPages(pageId: string): Promise<Page[]>;
  createPage(input: CreatePageInput): Promise<Page>;
  updatePage(input: UpdatePageInput): Promise<Page>;
  movePage(input: MovePageInput): Promise<void>;
  movePageToSpace(pageId: string, targetSpaceId: string): Promise<Page>;
  duplicatePage(pageId: string): Promise<Page>;
  copyPageToSpace(pageId: string, targetSpaceId: string): Promise<Page>;
  deletePage(pageId: string): Promise<void>;
  restorePage(pageId: string): Promise<Page>;
  listTrash(spaceId: string): Promise<Page[]>;
  searchPages(query: string, spaceId?: string): Promise<SearchResult[]>;
  getPageHistory(pageId: string): Promise<PageHistory[]>;
  getPageLabels(pageId: string): Promise<Label[]>;
  addPageLabels(pageId: string, names: string[]): Promise<void>;
  removePageLabel(pageId: string, labelId: string): Promise<void>;
  getBacklinks(pageId: string): Promise<Backlink[]>;

  // Comments
  getComments(pageId: string): Promise<Comment[]>;
  createComment(input: CreateCommentInput): Promise<Comment>;
  updateComment(input: UpdateCommentInput): Promise<Comment>;
  deleteComment(commentId: string): Promise<void>;

  // Groups
  listGroups(): Promise<Group[]>;
  getGroup(groupId: string): Promise<Group>;
  createGroup(input: CreateGroupInput): Promise<Group>;
  updateGroup(input: UpdateGroupInput): Promise<Group>;
  deleteGroup(groupId: string): Promise<void>;
  listGroupMembers(groupId: string): Promise<GroupMember[]>;
  addGroupMembers(groupId: string, userIds: string[]): Promise<void>;
  removeGroupMember(groupId: string, userId: string): Promise<void>;

  // Attachments
  searchAttachments(query: string): Promise<Attachment[]>;
}
