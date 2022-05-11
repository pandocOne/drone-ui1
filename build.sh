#!/bin/sh

## copy these 4 .sh to drone-ui1/

# dist/files/
docker run -it --rm -v $(pwd):/data node:14.19 /data/1-prepare_files.sh

# dist/dist_gen.go
docker run -it --rm -v $(pwd):/data golang:1.14.4 /data/2-generate_dist.sh
git add dist/dist_gen.go
git commit -m `date +"%m%d%H%M"`
git push

# release/../drone-server
ui1=$(pwd)
cd ~/git
rm -rf drone
git clone https://github.com/harness/drone.git
cd drone
pwd
sed -i 's/github.com\/drone\/drone-ui/github.com\/pandocOne\/drone-ui1/' ./handler/web/logout.go
sed -i 's/github.com\/drone\/drone-ui/github.com\/pandocOne\/drone-ui1/' ./handler/web/pages.go
sed -i 's/github.com\/drone\/drone-ui/github.com\/pandocOne\/drone-ui1/' ./handler/web/web.go
docker run -it --rm -v $(pwd):/data -v $ui1:/ui1 golang:1.14.4  /ui1/3-build_drone-server.sh

# build docker image
cp docker/Dockerfile.server.linux.amd64 Dockerfile
docker build --pull --rm -f "Dockerfile" -t drone:ajeep "."
