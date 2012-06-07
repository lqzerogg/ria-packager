var path 				= require('path');
var childProcess 		= require('child_process');
var fs 					= require('fs');
var cluster 			= require('cluster');
var config 				= require('./config')();
var createWorkerServer	= require('./worker');

if(cluster.isMaster) {
	console.log('weibo ria master server ' + process.pid);
	//默认启动10个http服务器监听同一端口
	var workerNum = config.workerNum || 10;
	var workers = [];
	for(var i = 0; i < workerNum; i++) {
		workers.push(cluster.fork());
	}
	
	//自动重启死亡worker子进程
	cluster.on('death', function(worker) {
		workers.splice(workers.indexOf(worker), 1);
		process.nextTick(function () {
			workers.push(cluster.fork());
		});
	});
	
	process.on('uncaughtException', function(err) {
		console.error('Caught exception: ', err);
	});
	
	//Master退出时杀死所有worker进程(监听kill 信号)
	process.on('SIGTERM', function() {
	  console.log('Master killed');
	  workers.forEach(function(w) {
	    console.log('worker '+ w.pid + ' killed');
	    w.kill();
	  });
	  process.exit(0);
	});
	
	process.title = 'weibo-ria-server';//linux only
	
	fs.writeFile(path.join(__dirname,'.pid'), process.pid);
	
} else {
	createWorkerServer();
}