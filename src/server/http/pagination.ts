export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export interface PaginationInput {
  page: number;
  pageSize: number;
  offset?: number;
}

export interface PageMeta extends PaginationInput {
  total: number;
  pages: number;
  hasMore: boolean;
}

export type Paginated<T> = PageMeta & {
  items: T[];
};

type ParamSource = URLSearchParams | Record<string, unknown>;

function readNumber(source: ParamSource, key: string, fallback: number): number {
  const raw = source instanceof URLSearchParams ? source.get(key) : source[key];
  if (raw === null || raw === undefined) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parsePagination(source: ParamSource = new URLSearchParams()): PaginationInput {
  const page = Math.max(1, Math.floor(readNumber(source, "page", DEFAULT_PAGE)));
  const requestedSize = Math.floor(readNumber(source, "pageSize", DEFAULT_PAGE_SIZE));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export function pageMeta(total: number, page: number, pageSize: number): PageMeta {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return { total, page, pageSize, pages, hasMore: page < pages };
}

export function paginated<T>(items: T[], total: number, input: PaginationInput): Paginated<T> {
  return { items, ...pageMeta(total, input.page, input.pageSize) };
}