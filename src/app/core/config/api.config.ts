/**
 * Central API configuration for the DAPI (digi-api.com).
 * See docs/04-api-data-model.md for endpoint and response details.
 */
export const API_CONFIG = {
  baseUrl: 'https://digi-api.com/api/v1',
  defaultPageSize: 40,
  /** The DAPI `nextPage` URL is buggy — always build pagination URLs manually. */
  buildDigimonListUrl(params: {
    page?: number;
    pageSize?: number;
    name?: string;
    exact?: boolean;
    attribute?: string;
    xAntibody?: boolean;
    level?: string;
  }): string {
    const url = new URL(`${API_CONFIG.baseUrl}/digimon`);
    const { page, pageSize, name, exact, attribute, xAntibody, level } = params;
    if (page != null) url.searchParams.set('page', String(page));
    url.searchParams.set('pageSize', String(pageSize ?? API_CONFIG.defaultPageSize));
    if (name) url.searchParams.set('name', name);
    if (exact != null) url.searchParams.set('exact', String(exact));
    if (attribute) url.searchParams.set('attribute', attribute);
    if (xAntibody != null) url.searchParams.set('xAntibody', String(xAntibody));
    if (level) url.searchParams.set('level', level);
    return url.toString();
  },
} as const;
