export interface Tag {
  id: number;
  name: string;
  slug?: string;
  prompt_count?: number;
}

export interface Prompt {
  id: number;
  title: string;
  content: string;
  complexity: number;
  tags: Tag[];
  created_at: string;
  view_count: number;
  like_count: number;
  bookmark_count: number;
  liked_by_current_user: boolean;
  bookmarked_by_current_user: boolean;
}

export interface CreatePromptDto {
  title: string;
  content: string;
  complexity: number;
  tags: string[];
}

export interface PaginatedPromptResponse {
  results: Prompt[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface AnalyticsOverview {
  selected_tag: string;
  prompt_count: number;
  view_total: number;
  like_total: number;
  bookmark_total: number;
  trending_percent: number;
  most_viewed_percent: number;
  most_liked_percent: number;
  saved_count: number;
  saved_progress: number;
  available_tags: string[];
}
