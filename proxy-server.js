
// A simple CORS proxy using 'cors-anywhere'
// Run this with: node proxy-server.js
// You may need to install the dependency: npm install cors-anywhere

const cors_proxy = require('cors-anywhere');

const host = '0.0.0.0';
const port = 8080;

cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: [],
    removeHeaders: ['cookie', 'cookie2'],
}).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
    console.log('In your app settings, set Proxy URL to: http://localhost:' + port + '/');
});
