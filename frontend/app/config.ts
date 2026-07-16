const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
export const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;
