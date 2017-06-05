# Transmi (torrent web interface)

A web interface to manage torrents. Can be used by multiple users. To each user his account, files and folder on the machine.

Uses [node-transmission](https://github.com/FLYBYME/node-transmission) and [svelte](https://svelte.technology/).

## Requirements/installation

- Node 7.x + npm
- `npm install`
- Transmission instance ([see `transmission` directory](./transmission/))
- Create an initial `src/db-data.json` file: `{"stego":{"password":"79be0712ecb676e668d4a729141e28cef73ef2a3"}}` (password: SHA-1 hash)
- `npm run build-web` to compile `html` files into `javascript` files

## Start server

- By default, the server is listening on `127.0.0.1:7897`: you can edit it at the end of the file [app.js](./src/app.js)
- Run `npm start` to start the server, or create the service `transmi` ([transmi.service](./transmi.service) into `/etc/systemd/system/transmi.service`)
- You also can use the Nginx example configuration file ((nginx.conf)[./nginx.conf]) in order to use a domain name (with SSL or not)

## Authors

- [Zajda Florent](https://github.com/zajdaf)
- [Maigret Aurélien](https://github.com/Dewep)

## Contributors

- [Colin Julien](https://github.com/Toldy)
