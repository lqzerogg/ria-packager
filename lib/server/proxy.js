(function(module) {
	var http = require('http');
	http.globalAgent.maxSockets = 1024;
	//代理远程服务
	module.exports = function (request, response, serverHost, serverPort) {
		response.header('X-Proxyed-By' ,'ria-Packager');
		var proxyRequest = http.request({
			host	: serverHost || request.headers.host,
			port	: serverPort || 80,
			path	: request.url,
			method	: request.method,
			headers	: request.headers
		}, function(proxyResponse) {
			proxyResponse.pipe(response);
			response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
		});
		proxyRequest.setTimeout(4000, function(){
			console.log('request ',request.url,' timeout! abort it.');
			proxyRequest.abort();
		});
		proxyRequest.on('error', function(e) {
			console.error(new Date().toLocaleString() +  ' error in proxyRequest: ', e,' when request ',request.url);
			proxyRequest.end();
		});
		request.pipe(proxyRequest);
	}
})(module);
