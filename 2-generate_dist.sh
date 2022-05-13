#!/bin/sh
export https_proxy=http://10.222.1.1:7890
go get github.com/bradrydzewski/togo

cd /data/dist
go generate dist.go
chown -R 1000:1000 *
