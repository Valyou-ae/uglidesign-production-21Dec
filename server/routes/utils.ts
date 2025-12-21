/**
 * Parse pagination parameters from query string
 */
export function parsePagination(
  query: { limit?: string; offset?: string; page?: string },
  defaults: { limit: number; maxLimit: number }
): { limit: number; offset: number } {
  const limit = Math.min(
    Math.max(1, parseInt(query.limit as string) || defaults.limit),
    defaults.maxLimit
  );
  let offset = 0;
  if (query.page) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    offset = (page - 1) * limit;
  } else if (query.offset) {
    offset = Math.max(0, parseInt(query.offset as string) || 0);
  }
  // Cap offset to prevent excessive values
  offset = Math.min(offset, 100000);
  return { limit, offset };
}
