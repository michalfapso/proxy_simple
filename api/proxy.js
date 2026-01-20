export const config = {
    runtime: 'nodejs',
};

export default async function handler(req) {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');

    // 1. Authorization
    // Note: PROXY_AUTH_KEY should be set in Vercel Environment Variables
    const secretKey = process.env.PROXY_AUTH_KEY;
    const authHeader = req.headers.get('x-proxy-auth');

    if (!secretKey) {
        return new Response('Server configuration error: PROXY_AUTH_KEY is not set.', { status: 500 });
    }

    if (authHeader !== secretKey) {
        return new Response('Forbidden: Invalid or missing X-Proxy-Auth header.', { status: 403 });
    }

    // 2. URL Validation
    if (!targetUrl) {
        return new Response('Bad Request: Missing url parameter.', { status: 400 });
    }

    const allowedDomains = ['inspirews.skgeodesy.sk'];
    try {
        const parsedTarget = new URL(targetUrl);
        if (!allowedDomains.includes(parsedTarget.hostname)) {
            return new Response(`Forbidden: Domain '${parsedTarget.hostname}' is not allowed.`, { status: 403 });
        }
    } catch (e) {
        return new Response('Bad Request: Invalid target URL.', { status: 400 });
    }

    // 3. Perform the request and stream the response
    try {
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'VLK-Bot-Analysis-Proxy',
            },
            // You can forward more headers here if needed
        });

        // 4. Forward important headers from the target server
        const responseHeaders = new Headers();
        const headersToForward = [
            'content-type',
            'content-length',
            'content-disposition',
            'cache-control',
            'last-modified',
            'etag'
        ];

        for (const header of headersToForward) {
            const value = response.headers.get(header);
            if (value) {
                responseHeaders.set(header, value);
            }
        }

        // Return the response stream back to the client
        return new Response(response.body, {
            status: response.status,
            headers: responseHeaders,
        });
    } catch (error) {
        return new Response(`Bad Gateway: ${error.message}`, { status: 502 });
    }
}
