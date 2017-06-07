# Transmission

```sh
$> docker build -t transmission .
$> docker run -d -p 127.0.0.1:9091:9091 -p 51414:51414 -p 51414:51414/udp -v /home/downloads:/transmission/downloads --name transmission transmission
```
