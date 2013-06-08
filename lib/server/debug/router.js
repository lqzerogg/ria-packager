var debugMod = require('./debug.js');
var path = require('path');
var express = require('../../../modules/express/index');
var renderMustache = require('../renderMustache');

module.exports = function(app, config){
	//configure for post request;
	app.configure(function(){
		app.use(express.bodyParser());
		app.use(app.router);
	});
	//config for debug page (include js&css file)
	app.get('/debug/*', function(req, res, next){
	    var ext = path.extname(req.url.split('?')[0]);
	    if(ext === '.js'){
	        res.header('Content-Type', 'application/x-javascript;Charset=UTF-8');
	        outer = debugMod.outputJS(req);
	        res.end(outer);
	    }else if(ext === '.css'){
	        res.header('Content-Type', 'text/css;Charset=UTF-8');
	        outer = debugMod.outputCSS(req);
	        res.end(outer);
	    }else if(ext === '.html'){
	        res.header('Content-Type' , 'text/html;charset=utf-8');
	        outer = debugMod.outputHTML(req);
	        res.end(outer);
	    }else if(ext === '.ajax'){

	    }else{
	        next();
	    }
	});

	//export ajax post
	app.post('/debug/*.ajax', function(req, res){ 
	    var ext = path.extname(req.url.split('?')[0]);
	    if(ext === '.ajax'){
	        var items = req.body;
	        var data = items.data;
	        data = decodeURI(data);
	        data = JSON.parse(data);
	        var cfg = {
	            'query' : items.query,
	            'host' : items.host,
	            'url' : items.url,
	            'documentRoot' : config.documentRoot,
	            'project' : items.project
	        };
	        var configInfo = {
	            'data' : data,
	            'config' : renderMustache.initParams(cfg)
	        }        
	        renderMustache.generateHTML(cfg, res, configInfo);
	    }
	});

}