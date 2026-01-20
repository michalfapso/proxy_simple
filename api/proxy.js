// Standard Node.js runtime allows us to pin the region to Europe (Frankfurt) in vercel.json
// This is important to avoid geo-blocking from the Slovak GIS servers.
export const config = {
    runtime: 'nodejs',
};

export default async function handler(req, res) {
    // 1. Authorization
    // Note: PROXY_AUTH_KEY should be set in Vercel Environment Variables
    const secretKey = process.env.PROXY_AUTH_KEY;
    const authHeader = req.headers['x-proxy-auth'];

    if (!secretKey) {
        return res.status(500).send('Server configuration error: PROXY_AUTH_KEY is not set.');
    }

    if (authHeader !== secretKey) {
        return res.status(403).send('Forbidden: Invalid or missing X-Proxy-Auth header.');
    }

    // 2. URL Validation
    // Use modern WHATWG URL API to avoid DEP0169 (url.parse deprecation)
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const targetUrl = url.searchParams.get('url');

    if (!targetUrl) {
        return res.status(400).send('Bad Request: Missing url parameter.');
    }

    const allowedDomains = ['inspirews.skgeodesy.sk'];
    try {
        const parsedTarget = new URL(targetUrl);
        if (!allowedDomains.includes(parsedTarget.hostname)) {
            return res.status(403).send(`Forbidden: Domain '${parsedTarget.hostname}' is not allowed.`);
        }
    } catch (e) {
        return res.status(400).send('Bad Request: Invalid target URL.');
    }

    // 3. Perform the request and stream the response
    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'VLK-Bot-Analysis-Proxy',
            },
        });

        // 4. Forward important headers from the target server
        const headersToForward = [
            'content-type',
            'content-length',
            'content-disposition',
            'cache-control',
            'last-modified',
            'etag'
        ];

        res.status(response.status);
        for (const header of headersToForward) {
            const value = response.headers.get(header);
            if (value) {
                res.setHeader(header, value);
            }
        }

        // 5. Stream the response body - Node-friendly way
        if (response.body) {
            const reader = response.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        }
        res.end();

    } catch (error) {
        console.error('Proxy Error:', error);
        if (!res.headersSent) {
            res.status(502).send(`Bad Gateway: ${error.message}`);
        }
    }
}
