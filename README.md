# Transmi (torrent web interface)

A web interface to manage torrents. Can be used by multiple users. To each user his account, files and folder on the machine.

Uses [node-transmission](https://github.com/FLYBYME/node-transmission) and [svelte](https://svelte.technology/).

# Requirements/installation

- Node 7.x + npm
- `npm install`
- Transmission instance ([see `transmission` directory](./transmission/))
- Create a initial `src/db-data.json` file: `{"stego":{"password":"79be0712ecb676e668d4a729141e28cef73ef2a3"}}` (password: SHA-1 hash)
- `npm run build-web` to compile `html` files into `javascript` files
