#!/bin/sh
export https_proxy=http://10.222.1.1:7890
go get -v -insecure github.com/pandocOne/drone-ui1

cd /data
export GOARCH=amd64
export GOOS=linux
sh scripts/build.sh
chown -R 1000:1000 release
