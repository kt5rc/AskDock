export type UserRole = 'admin' | 'user';

export type UserPublic = {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
};

export type Memo = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  category: 'env' | 'frontend' | 'backend' | 'db' | 'git' | 'other' | 'chat';
  status: 'open' | 'solved';
  assignee_id: string | null;
  created_at: string;
  updated_at: string;
  solved_at: string | null;
};

export type Comment = {
  id: string;
  memo_id: string;
  author_id: string;
  body: string;
  is_answer: boolean;
  created_at: string;
  updated_at: string;
};

export type MemoWithAuthor = Memo & {
  author: UserPublic;
  assignee?: UserPublic | null;
};

export type CommentWithAuthor = Comment & {
  author: UserPublic;
};
