import { put, del } from '@vercel/blob';

async function handlePost(req: any, res: any) {
    const filename = req.query.filename;
    if (!filename) {
        return res.status(400).json({ error: '`filename` query parameter is required.' });
    }
    
    // For Vercel Serverless Functions running on the Node.js runtime, the `req` object 
    // itself is the readable stream for raw file uploads. We pass it directly to `put`.
    // Passing `req.body` is incorrect as it's not populated for streamed bodies.
    
    try {
        const blob = await put(filename, req, { access: 'public' });
        return res.status(200).json(blob);
    } catch (error: any) {
        // The Vercel Blob SDK might throw an error if the body is empty.
        if (error.message.includes('body is required')) {
            return res.status(400).json({ error: 'Vercel Blob: body is required. The request body appears to be empty.' });
        }
        console.error("Error in /api/upload-blob (POST):", error);
        return res.status(500).json({ error: error.message || 'Failed to upload file.' });
    }
}

async function handleDelete(req: any, res: any) {
    const urlToDelete = req.query.url;
    if (!urlToDelete) {
        return res.status(400).json({ error: '`url` query parameter is required for deletion.' });
    }

    try {
        await del(urlToDelete);
        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("Error in /api/upload-blob (DELETE):", error);
        return res.status(500).json({ error: error.message || 'Failed to delete file.' });
    }
}

export default async function handler(req: any, res: any) {
    switch (req.method) {
        case 'POST':
            return await handlePost(req, res);
        case 'DELETE':
            return await handleDelete(req, res);
        default:
            res.setHeader('Allow', ['POST', 'DELETE']);
            return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}