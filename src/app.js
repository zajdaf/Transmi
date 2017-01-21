const express = require('express')
const bodyParser = require('body-parser')

const authKeys = require('./authKeys')
const authRoutes = require('./controllers/auth')
const torrentsRoutes = require('./controllers/torrents')

let app = express()

app.use(bodyParser.json())
// app.use(sessionMiddleware)

app.use("/auth", authRoutes())
app.use((req, res, next) =>
{
	if (req.headers.authorization)
	{
		if (authKeys.get(req.headers.authorization))
			return(next)
	}
	let err = new Error("Authentification failed")
	err.status = 403
	next(err)
})
app.use("/torrents", torrentsRoutes())

app.use(express.static("src/web"))
// app.use(errorHandling)

app.listen(7897, function ()
{
	console.info("[web-component]", "server running on port", 7897)
})
