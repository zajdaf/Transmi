const express = require('express')
const bodyParser = require('body-parser')

const authKeys = require('./authKeys')
const authRoutes = require('./controllers/auth')
const torrentsRoutes = require('./controllers/torrents')

let app = express()

app.use(bodyParser.json())

app.use((req, res, next) => {
	console.info(`[web.component] ${req.method} ${req.originalUrl} from ${req.ip}`)
	next()
})

app.use("/api/auth", authRoutes())
app.use("/api", (req, res, next) =>
{
	if (req.headers.authorization)
	{
		if (authKeys.get(req.headers.authorization))
			return next()
	}
	let err = new Error("Authentification failed")
	err.status = 403
	next(err)
})
app.use("/api/torrents", torrentsRoutes())

app.use(express.static('src/web/public'))

app.use((err, req, res, next) => {
	res.status(err.status || 400)
	res.json({ error: err.message })
	console.error(err.stack)
})

app.listen(7897, function ()
{
	console.info("[web-component]", "server running on port", 7897)
})
