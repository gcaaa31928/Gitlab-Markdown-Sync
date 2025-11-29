/**
 * GitLab Wiki Sync - CORS Proxy Backend
 * 
 * This server acts as a middleman between the Vue.js frontend and the GitLab API.
 * It adds the necessary CORS headers to allow the browser to accept the response.
 * 
 * Usage:
 * 1. npm install
 * 2. node server.js
 */

const cors_proxy = require('cors-anywhere');

// Listen on a specific host via the HOST environment variable, or default to 0.0.0.0 (all interfaces)
const host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable, or default to 8080
const port = process.env.PORT || 8080;

const server = cors_proxy.createServer({
    // Set to true to allow requests from any origin (convenient for local dev)
    // In production, you might want to whitelist your frontend domain.
    originWhitelist: [], 
    
    // Headers to require - empty means none
    requireHeader: [],
    
    // Headers to strip from the forwarded request
    removeHeaders: ['cookie', 'cookie2'],
    
    // Add these headers to the response
    setHeaders: {
        // Ensure the client knows it can read the response
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, PRIVATE-TOKEN'
    }
});

server.listen(port, host, function() {
    console.log('===========================================================');
    console.log(`🚀 GitLab CORS Proxy running on http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
    console.log('===========================================================');
    console.log('Instructions:');
    console.log('1. Go to the "Settings" in the web app.');
    console.log('2. Enable "Use CORS Proxy".');
    console.log(`3. Set Proxy URL to: http://localhost:${port}/`);
    console.log('===========================================================');
});