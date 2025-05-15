
const searchParams = new URLSearchParams(window.location.search);

export const isViewMode = searchParams.get('view') === 'true';
export const isDebugMode = searchParams.get('debug') === 'true';