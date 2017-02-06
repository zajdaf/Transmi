# Transmission

```sh
$> docker build -t transmission .
$> docker run -d -p 51414:51414 -p 51414:51414/udp -v /home/downloads:/transmission/downloads --name transmission transmission
```
