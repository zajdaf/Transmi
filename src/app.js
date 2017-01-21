const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')

let app = express()

app.use(bodyParser.json())
// app.use(sessionMiddleware)

app.use(express.static('src/web'))
// app.use(errorHandling)

let server = http.createServer(app)
server.listen(6587)
console.info('[web-component]', 'server running on port', 6587)
