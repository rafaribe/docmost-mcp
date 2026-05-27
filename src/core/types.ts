export interface Workspace {
  id: string;
  name: string;
  description?: string;
  defaultSpaceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Space {
  id: string;
  name: string;
  description?: string;
  slug: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface Page {
  id: string;
  title: string;
  parentPageId?: string;
  spaceId: string;
  isLocked?: boolean;
  content?: string;
  subpages?: PageRef[];
  createdAt: string;
  updatedAt: string;
}

export interface PageRef {
  id: string;
  title: string;
}

export interface Comment {
  id: string;
  content: string;
  pageId: string;
  parentCommentId?: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  parentPageId?: string;
  spaceId?: string;
  spaceName?: string;
  highlight?: string;
  rank?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  pageId?: string;
  createdAt: string;
}

export interface DeleteResult {
  id: string;
  success: boolean;
  error?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export interface SpaceMember {
  id: string;
  name: string;
  email?: string;
  role: string;
  type: "user" | "group";
}

export interface PageHistory {
  id: string;
  pageId: string;
  title?: string;
  content?: unknown;
  createdAt: string;
  lastUpdatedBy?: string;
}

export interface Label {
  id: string;
  name: string;
  color?: string;
  pageId?: string;
}

export interface Backlink {
  id: string;
  title: string;
  spaceId: string;
}

// Input types
export interface CreatePageInput {
  title: string;
  content?: string;
  spaceId: string;
  parentPageId?: string;
}

export interface UpdatePageInput {
  pageId: string;
  title?: string;
  content?: string;
}

export interface MovePageInput {
  pageId: string;
  parentPageId?: string | null;
  position?: string;
}

export interface CreateSpaceInput {
  name: string;
  description?: string;
}

export interface UpdateSpaceInput {
  spaceId: string;
  name?: string;
  description?: string;
}

export interface CreateCommentInput {
  pageId: string;
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentInput {
  commentId: string;
  content: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface UpdateGroupInput {
  groupId: string;
  name?: string;
  description?: string;
}

export interface AddSpaceMembersInput {
  spaceId: string;
  userIds?: string[];
  groupIds?: string[];
  role: string;
}

export interface RemoveSpaceMemberInput {
  spaceId: string;
  userId?: string;
  groupId?: string;
}
