const express = require('express')

let authRouter = () => {
	let router = express.Router()

	router.get("/", (req, res, next) => 
	{
		res.json({"hello": "world"})
	})

	return router
}

module.exports = authRouter