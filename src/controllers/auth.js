const express = require('express')
const crypto = require('crypto')

const authKeys = require('../authKeys')
const database = require('../database')

let authRouter = () => {
	let router = express.Router()
	let db = new database("db-data.json")

	router.post("/", (req, res, next) =>
	{
/*		console.log(req.body.name, req.body.password)*/
		var hashed = crypto.createHash("sha1").update(req.body.password).digest("hex")
		let usr = db.get(req.body.name, {})
		if (usr && usr.password == hashed)
		{
			key = Math.random().toString(36).substring(2, 22) + Math.random().toString(36).substring(2, 22)
			authKeys.set(key, req.body.name)
			res.json({ key: key })
		}
		else
			next(new Error("Invalid name/password"))
	})
	router.delete("/", (req, res, next) =>
	{
		userkey = authKeys.get(req.headers.authorization)
		authKeys.del(userkey)
		res.json({})
	})

	return router
}

module.exports = authRouter
