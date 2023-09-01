# Description: Build and run the docker container

docker build -t skybolt .
docker run -it --rm -p 8080:80 --name skybolt-site -v "$PWD"/src:/var/www/html skybolt
