export type PostStatus = "draft" | "published" | "archived";

export type Post = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content_md: string;
  cover_image_url: string | null;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CommentStatus = "visible" | "hidden" | "deleted" | "pending";

export type Comment = {
  id: string;
  post_id: string;
  user_id: string | null;
  parent_id: string | null;
  author_name: string;
  body: string;
  status: CommentStatus;
  created_at: string;
};
