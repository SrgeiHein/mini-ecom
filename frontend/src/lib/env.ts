const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

if (!apiUrl) {
  throw new Error('NEXT_PUBLIC_API_URL is not set');
}

export const env = {
  apiUrl,
} as const;
