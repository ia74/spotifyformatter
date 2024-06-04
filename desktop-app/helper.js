const fastify = require('fastify')({ logger: true })

fastify.get('/sfinjector.js', (request, reply) => {
	  reply.sendFile('script.js')
});

fastify.get('/')

fastify.listen(7799).then(() => {
	  console.log('InjectHost running on port 7799')
});

var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

var cors_proxy = require('cors-anywhere');
cors_proxy.createServer({
    originWhitelist: [], // Allow all origins
    removeHeaders: ['cookie', 'cookie2']
}).listen(port, host, function() {
    console.log('Running CORS Anywhere on ' + host + ':' + port);
});
