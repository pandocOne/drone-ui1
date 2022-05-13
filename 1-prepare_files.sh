#!/bin/sh
export https_proxy=http://10.222.1.1:7890
cd /data
npm i

cp .env.example .env.development.local
mv .env.example .env

npm run build
chown -R 1000:1000 *
