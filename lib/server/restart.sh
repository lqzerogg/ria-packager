#!/bin/bash
#works on linux system

BASEDIR=$(dirname $0)
PID=$BASEDIR/.pid
DeployPID=$BASEDIR/deploy/.pid

if [ -f $PID ]
then
	cat $PID
	echo ' killed'
    cat $PID | xargs kill
    rm  $PID
else
    pkill -f weibo-ria-server
fi

if [ -f $DeployPID ]
then
	cat $DeployPID
	echo ' killed'
	
    cat $DeployPID | xargs kill
    rm  $DeployPID
else
    pkill -f ria-deploy-server
fi

# 启动服务器; 服务器日志默认定向到server目录下log.txt
nohup node ${BASEDIR}/httpd.js  > ${BASEDIR}/log.txt 2>&1 &

nohup node ${BASEDIR}/deploy/server.js  > ${BASEDIR}/deploy/log.txt 2>&1 &


echo 'waiting...'
sleep 5
cat ${BASEDIR}/log.txt
cat ${BASEDIR}/deploy/log.txt

exit 0
