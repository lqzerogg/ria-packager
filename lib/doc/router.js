var path = require('path');
var initdoc = require('./initdoc.js');

module.exports = function(app, config){
	// app.get('*.genDoc=true', function(req, res, next){
	// 	var output = initdoc.initEditPage({
	//         'documentRoot' : config.documentRoot,
	//         'url' :  req.url
	//     });
	//     res.header('Content-Type' , 'text/html;charset=utf-8');
	//     res.end(output);
 //        return;
	// });

	app.get('*/editDoc', function(req, res, next){
		var output = initdoc.initEditPage({
	        'documentRoot' : config.documentRoot,
	        'url' :  req.url,
	        'query' : req.query
	    });
	    res.header('Content-Type' , 'text/html;charset=utf-8');
	    res.end(output);
        return;
	});



	app.get('*/createDoc', function(req, res, next){
		var source = req.originalUrl.split('/')[1];
		var output = initdoc.initGenerPage({
	        'documentRoot' : config.documentRoot,
	        'url' :  req.url,
	        'type' : req.query.type,
	        'source' : source
	    });
	    res.header('Content-Type' , 'text/html;charset=utf-8');
	    res.end(output);
        return;
	});

	//export ajax post
	app.post('/doc/saveDoc.ajax', function(req, res){ 
	    var ext = path.extname(req.url.split('?')[0]);
	     var items = req.body;
	        var data = items.data;
	        var url = items.url;
	     	// for(var x in data.description){
	     	// 	data.description[x] = decodeURIComponent(data.description[x], true);
	     	// }
	    try{
	    	initdoc.generateDoc(data, config.documentRoot, url);
       		res.header('Content-Type' , 'text/json;charset=utf-8');
			var data = {
				'code' : 'a0006',
				'url' : url
			};
	    	res.end(JSON.stringify(data));
       	}catch(e){
       		res.header('Content-Type' , 'text/json;charset=utf-8');
			var data = {
				'code' : 'exsis',
				'error' : e
			};
	    	res.end(JSON.stringify(data));
       	} 
	});
	
	app.post('/doc/saveCreate.ajax', function(req, res){ 
	    var items = req.body;
        var data = items.data;
        var url = items.url;
        var type = items.type;
        try{
       		initdoc.generateWidget(data, config.documentRoot, url.split('/')[1], type);
       		res.header('Content-Type' , 'text/json;charset=utf-8');
			var data = {
				'code' : 'a0006',
				'url' : url
			};
	    	res.end(JSON.stringify(data));
       	}catch(e){
       		res.header('Content-Type' , 'text/json;charset=utf-8');
			var data = {
				'code' : 'exsis',
				'error' : e
			};
	    	res.end(JSON.stringify(data));
       	}
	});

	// app.post('/doc/initWidgetsList.ajax', function(req, res){ 
	//     var items = req.body;
 //        var url = items.url;
 //        var source = url.split('/')[1];
 //        try{
 //       		var data = initdoc.getWidgetList(config.documentRoot, source);
 //       		res.header('Content-Type' , 'text/json;charset=utf-8');
	// 		var data = {
	// 			'code' : 'a0006',
	// 			'data' : data
	// 		};
	//     	res.end(JSON.stringify(data));
 //       	}catch(e){
 //       		res.header('Content-Type' , 'text/json;charset=utf-8');
	// 		var data = {
	// 			'code' : 'exsis',
	// 			'error' : e
	// 		};
	//     	res.end(JSON.stringify(data));
 //       	}
	// });

	// app.post('/doc/initWidgetData.ajax', function(req, res){ 
	//     var items = req.body;
 //        var url = items.url;
 //        var source = url.split('/')[1];
 //        var hash = items.widget;
 //        var type = items.type;
 //        var dir = path.join(source, type);
 //        for(var i = 0; i < hash.split('||').length; i++){
 //        	dir = path.join(dir, hash.split('||')[i]);
 //        }
 //   		var data = initdoc.getWidgetData(config.documentRoot, dir, source, hash);
 //   		res.header('Content-Type' , 'text/json;charset=utf-8');
	// 	var data = {
	// 		'code' : 'a0006',
	// 		'data' : data
	// 	};
 //    	res.end(JSON.stringify(data));
	// });

	app.post('/doc/initData.ajax', function(req, res){ 
	    var items = req.body;
        var url = items.url;
        var source = url.split('/')[1];
        var hash = items.name;
        var type = items.type;
        var dir = path.join(source, type);
        for(var i = 0; i < hash.split('||').length; i++){
        	dir = path.join(dir, hash.split('||')[i]);
        }
   		var data = initdoc.getData(config.documentRoot, dir, source, hash, type);
   		res.header('Content-Type' , 'text/json;charset=utf-8');
		var data = {
			'code' : 'a0006',
			'data' : data
		};
    	res.end(JSON.stringify(data));
	});

	app.post('/doc/initList.ajax', function(req, res){ 
	    var items = req.body;
        var url = items.url;
        var type = items.type;
        var source = items.source;
        try{
       		var data = initdoc.getList(config.documentRoot, source, type);
       		res.header('Content-Type' , 'text/json;charset=utf-8');
			var data = {
				'code' : 'a0006',
				'data' : data
			};
	    	res.end(JSON.stringify(data));
       	}catch(e){
       		res.header('Content-Type' , 'text/json;charset=utf-8');
			var data = {
				'code' : 'exsis',
				'error' : e
			};
	    	res.end(JSON.stringify(data));
       	}
	});
}