const express = require('express')
const crypto = require('crypto')

const authKeys = require('../authKeys')
const database = require('../database')

let userRouter = () => {
	let router = express.Router()
	let db = new database("db-data.json")

	router.get("/", (req, res, next) =>
	{
		res.json("coucou")
	})
	router.put("/", (req, res, next) =>
	{
		let usr = db.get(req.user, {})
		if (usr)
		{
			usr.password = crypto.createHash("sha1").update(req.body.password).digest("hex")
			db.set(req.user, usr)
			res.json({})
		}
		else
			next(new Error("Invalid name"))
	})

	return router
}

module.exports = userRouter
