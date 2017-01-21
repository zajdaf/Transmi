const express = require('express')
const bodyParser = require('body-parser')

const authRoutes = require('./controllers/auth')

let app = express()

app.use(bodyParser.json())
// app.use(sessionMiddleware)

app.use("/auth", authRoutes())

app.use(express.static("src/web"))
// app.use(errorHandling)

app.listen(7897, function ()
{
	console.info("[web-component]", "server running on port", 7897)
})
