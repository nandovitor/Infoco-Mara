// This file is a duplicate and is not used in production.
// The active endpoint is /api/logout.ts.
// This file is emptied to prevent build errors and should be deleted.
export default function handler(req: any, res: any) {
  res.setHeader('Allow', ['POST']);
  res.status(410).json({ error: 'This endpoint is deprecated and no longer available.' });
}
