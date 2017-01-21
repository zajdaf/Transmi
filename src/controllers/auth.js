const express = require('express')

const config = require('../config')
const authKeys = require('../authKeys')

let authRouter = () => {
	let router = express.Router()

	router.get("/", (req, res, next) => 
	{
		if (config.users["rg"] && config.users["rg"].password == "toto42")
			res.json("gg")
		else
			res.json(Math.random().toString(36).substring(2, 22) + Math.random().toString(36).substring(2, 22))
	})
	router.post("/", (req, res, next) => 
	{
		console.log(req.body.name, req.body.password)
		if (config.users[req.body.name] && config.users[req.body.name].password == req.body.password)
		{
			key = Math.random().toString(36).substring(2, 22) + Math.random().toString(36).substring(2, 22)
			authKeys.set(key, req.body.name)
			res.json(key)
		}
		else
			res.json("invalid name/password")
	})

	return router
}

module.exports = authRouter