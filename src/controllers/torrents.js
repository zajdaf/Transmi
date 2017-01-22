const express = require('express')
const Transmission = require('transmission')

const config = require('../config')
const authKeys = require('../authKeys')
const database = require('../database')

let torrentRouter = () => {
	let router = express.Router()
	let transmission = new Transmission(config.transmission_options);
	let db = new database("db-data.json")

	router.get("/", (req, res, next) =>
	{
		let ids = db.get(req.user, []).ids
		transmission.methods.torrents.fields = ['error', 'errorString', 'eta',
		'haveValid', 'id', 'name', 'percentDone', 'rateDownload', 'rateUpload', 'sizeWhenDone', 'status', 'uploadRatio']
		transmission.get(ids, (err, arg) =>
		{
			if (err)
			{
				console.error(err)
				res.json("transmission error")
			}
			else
			{
				res.json(arg.torrents)
			}
		});
	})
	router.get("/active", (req, res, next) =>
	{
		let ids = db.get(req.user, []).ids
		transmission.methods.torrents.fields = ['error', 'errorString', 'eta',
		'haveValid', 'id', 'name', 'percentDone', 'rateDownload', 'rateUpload', 'sizeWhenDone', 'status', 'uploadRatio']
		transmission.active((err, arg) =>
		{
			if (err)
			{
				console.error(err)
				res.json("transmission error")
			}
			else
			{
				let user_torrents = []
				for (t in arg.torrents)
				{
					if (ids.indexOf(t.id) != -1)
						user_torrents.push(t)
				}
				res.json(user_torrents)
			}
		});
	})
	router.get("/:id", (req, res, next) =>
	{
		transmission.methods.torrents.fields = ['activityDate', 'addedDate', 'comment',
		'doneDate', 'downloadDir', 'error', 'errorString', 'eta', 'files', 'hashString',
		'haveUnchecked', 'haveValid', 'id', 'isFinished', 'name', 'peersConnected', 'peersGettingFromUs',
		'peersSendingToUs', 'percentDone', 'pieceCount', 'rateDownload', 'rateUpload', 'sizeWhenDone',
		'status', 'totalSize', 'trackerStats', 'uploadRatio']
		transmission.get([req.torrentId], (err, arg) =>
		{
			if (err)
			{
				console.error(err)
				res.json("transmission error")
			}
			else
			{
				/* + /usr/hash*/
				res.json(arg.torrents)
			}
		})
	})
	router.post("/", (req, res, next) =>
	{
		let user = db.get(req.user, [])
		let path = user + "/" + Math.random().toString(36).substring(2, 22)
		console.log(req.body.torrentname, req.body.torrentfile)
		if (req.torrentfile)
		{
			transmission.addFile(req.torrentfile, {"download-dir":path}, (err, arg) =>
			{
				if (err)
				{
					console.error(err)
					res.json("transmission error")
				}
				else
				{
					user.paths[arg.torrents[0].id] = {"downloadPath" : path}
					user.ids.push(arg.torrents[0].id)
					db.set(req.user, user)
					res.json(arg.torrents)
				}
			})
		}
		else
		{
			transmission.addUrl(req.torrentfile, {"download-dir":path}, (err, arg) =>
			{
				if (err)
				{
					console.error(err)
					res.json("transmission error")
				}
				else
				{
					res.json(arg.torrents)
				}
			})
		}
	})
	router.delete("/:id", (req, res, next) =>
	{
		let user = db.get(req.user, [])
		transmission.remove([req.params.id], del=true, (err, arg) =>
		{
			if (err)
			{
				console.error(err)
				res.json("transmission error")
			}
			else
			{
				user.ids.splice(user.ids.indexOf(req.params.id), 1)
				db.set(req.user, user)
				res.json({})
			}
		})
	})
	router.put("/:id/pause", (req, res, next) =>
	{
		transmission.stop([req.params.id], (err, arg) =>
		{
			if (err)
			{
				console.error(err)
				res.json("transmission error")
			}
			else
			{
				res.json({})
			}
		})
	})
	router.put("/:id/resume", (req, res, next) =>
	{
		transmission.start([req.params.id], (err, arg) =>
		{
			if (err)
			{
				console.error(err)
				res.json("transmission error")
			}
			else
			{
				res.json({})
			}
		})
	})
	return router
}

module.exports = torrentRouter
