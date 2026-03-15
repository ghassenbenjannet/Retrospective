import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/proxy-image?url=<encoded> — no auth required (used by img src)
router.get('/', async (req: Request, res: Response) => {
  const url = req.query.url as string;
  if (!url) { res.status(400).json({ message: 'url param required' }); return; }
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    res.status(400).json({ message: 'Only http/https URLs allowed' }); return;
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RetrospectiveApp/1.0)',
        'Accept': 'image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).end(); return;
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      res.status(400).json({ message: 'URL does not point to an image' }); return;
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const buf = await upstream.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
