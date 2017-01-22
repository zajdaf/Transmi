const express = require('express')
const Transmission = require('transmission')
const exec = require('child_process').exec;

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
				res.json(arg.torrents)
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
	router.get("/details", (req, res, next) =>
	{
		transmission.session((err, arg) =>
		{
			if (err)
			{
				console.error(err)
				res.json("transmission error")
			}
			else
				res.json(arg)
		});
	})
	router.get("/:id", (req, res, next) =>
	{
		let user = db.get(req.user, [])
		transmission.methods.torrents.fields = ['activityDate', 'addedDate', 'comment',
		'doneDate', 'downloadDir', 'error', 'errorString', 'eta', 'files', 'hashString',
		'haveUnchecked', 'haveValid', 'id', 'isFinished', 'name', 'peersConnected', 'peersGettingFromUs',
		'peersSendingToUs', 'percentDone', 'pieceCount', 'rateDownload', 'rateUpload', 'sizeWhenDone',
		'status', 'totalSize', 'trackerStats', 'uploadRatio']
		transmission.get([+req.params.id], (err, arg) =>
		{
			if (err)
			{
				console.error(err)
				res.json("transmission error")
			}
			else
			{
				arg.torrents[0].customData = user.customData
				res.json(arg.torrents)
			}
		})
	})
	function addTorrent (err, arg, res, user)
	{
		if (err)
		{
			console.error(err)
			res.json("transmission error")
		}
		else
		{
			user.customData[arg.torrents[0].id] = {"downloadPath" : path}
			user.ids.push(arg.torrents[0].id)
			db.set(req.user, user)
			res.json(arg.torrents)
		}
	}
	router.post("/", (req, res, next) =>
	{
		let user = db.get(req.user, [])
		let path = user + "/" + Math.random().toString(36).substring(2, 22)
		console.log(req.body.torrentname, req.body.torrentfile)
		if (req.torrentfile)
			transmission.addFile(req.torrentfile, {"download-dir":path}, (err, arg) =>
			{
				addTorrent(err, arg, res, user)
			})
		else
			transmission.addUrl(req.torrentfile, {"download-dir":path}, (err, arg) =>
			{
				addTorrent(err, arg, res, user)
			})
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
				target = config.downloads_directory + "/" + user.customData[req.params.id]
				if (target.length > 20) /*avoid accidental removal of '/' */
				{
					const child = exec("rm -r " + target,
						(error, stdout, stderr) => {
							console.log(`stdout: ${stdout}`);
							console.log(`stderr: ${stderr}`);
							if (error !== null) {
								console.log(`exec error: ${error}`);
							}
						});
				}
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
				res.json({})
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
				res.json({})
		})
	})
	router.post("/:id/zip", (req, res, next) =>
	{
		let user = db.get(req.user, [])
		if (!user.customData[req.params.id])
			return res.json("id error")
		user.customData[req.params.id].zipProcessing = true
		target = config.downloads_directory + "/" + user.customData[req.params.id].downloadPath
		const child = exec("cd " + target + " && zip -r "+ "ziperino.zip .",
			(error, stdout, stderr) => {
				user.customData[req.params.id].zipProcessing = false
				console.log(`stdout: ${stdout}`);
				console.log(`stderr: ${stderr}`);
				if (error !== null) {
					console.log(`exec error: ${error}`);
				}
			});
	})
	return router
}

module.exports = torrentRouter
