// After Transmission is restarted, all the IDs are reset
// Run this script with the current DB file and a valid API key to fix the IDs

// node fix-db.js ./src/db-data.json "https://transmi.xxxxxxxxxx.com" "xxxXXXxXXxXXxXXXxxXX-API-KEY" > ./src/db-data.json
// systemctl restart transmi

if (process.argv.length !== 5) {
  console.log('Usage: node fix-db.js ./src/db-data.json "https://transmi.xxxxxxxxxx.com" "xxxXXXxXXxXXxXXXxxXX-API-KEY" > ./src/db-data.json')
  process.exit(1)
}

const dbFile = require(process.argv[2])
const host = process.argv[3]
const apiKey = process.argv[4]

const request = require('request')

async function getTorrentDetail (id) {
  return new Promise((resolve, reject) => {
    const opts = {
      method: 'GET',
      url: `${host}/api/torrents/${id}`,
      headers: {
        Authorization: apiKey
      },
      json: true
    }
    request(opts, (error, response, body) => {
      if (error) {
        reject(error)
      } else if (body.error) {
        reject(new Error(body.error))
      } else {
        resolve(body)
      }
    })
  })
}

async function run () {
  const newDb = {}
  Object.keys(dbFile).forEach(slug => {
    newDb[slug] = {
      password: dbFile[slug].password,
      ids: [],
      customData: {}
    }
  })

  try {
    let id = 1
    while (true) {
      const torrent = await getTorrentDetail(id)
      const downloadPath = torrent.downloadDir.replace('/transmission/downloads/', '')
      const user = downloadPath.split('/')[0]
      if (newDb[user]) {
        newDb[user].ids.push(id)
        newDb[user].customData[id] = { downloadPath }
      }
      id += 1
    }
  } catch (err) {
  }

  console.log(JSON.stringify(newDb))
}

run().catch(console.error)
