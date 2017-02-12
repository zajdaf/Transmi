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
	let fields = {
		general: ['error', 'errorString', 'eta', 'haveValid', 'id', 'name', 'percentDone', 'rateDownload',
			'rateUpload', 'sizeWhenDone', 'status', 'uploadRatio'],
		detail: ['activityDate', 'addedDate', 'comment', 'doneDate', 'downloadDir', 'error', 'errorString',
			'eta', 'files', 'hashString', 'haveUnchecked', 'haveValid', 'id', 'isFinished', 'name',
			'peersConnected', 'peersGettingFromUs', 'peersSendingToUs', 'percentDone', 'pieceCount',
			'rateDownload', 'rateUpload', 'sizeWhenDone', 'status', 'totalSize', 'trackerStats', 'uploadRatio'],
		stat: ["rateDownload", "rateUpload", "sizeWhenDone"]
	}

	let hasError = (next, err) => {
		if (err) {
			next(new Error(err))
			return true
		}
		return false
	}

	router.get("/", (req, res, next) => {
		let ids = db.get(req.user, {}).ids || []
		transmission.methods.torrents.fields = fields.general
		transmission.get(ids, (err, arg) => {
			if (!hasError(next, err)) {
				res.json(arg.torrents)
			}
		})
	})

	router.get("/active", (req, res, next) => {
		let ids = db.get(req.user, {}).ids || []
		transmission.methods.torrents.fields = fields.general
		transmission.active((err, arg) => {
			if (!hasError(next, err)) {
				let user_torrents = []
				for (t in arg.torrents) {
					if (ids.indexOf(+t.id) != -1) {
						user_torrents.push(t)
					}
				}
				res.json(user_torrents)
			}
		})
	})

	router.get("/details", (req, res, next) => {
		transmission.session((err, arg) => {
			if (!hasError(next, err)) {
				res.json(arg)
			}
		})
	})

	router.get("/usersstats", (req, res, next) => {
		let result = {}
		for (var prop in config.users) {
			if (config.users.hasOwnProperty(prop)) {
				result[prop] = {}
				result[prop]["rateDownload"] = 0
				result[prop]["rateUpload"] = 0
				result[prop]["sizeWhenDone"] = 0
				transmission.methods.torrents.fields = fields.stat
				transmission.get(db.get(prop, {}).ids || [], (err, arg) => {
					if (!hasError(next, err)) { // TODO
						for (t in arg.torrents) {
							result[prop]["rateDownload"] += t.rateDownload
							result[prop]["rateUpload"] += t.rateUpload
							result[prop]["sizeWhenDone"] += t.sizeWhenDone
						}
					}
				})
			}
		}
	})

	router.get("/:id", (req, res, next) => {
		let user = db.get(req.user, {})
		transmission.methods.torrents.fields = fields.detail
		transmission.get([+req.params.id], (err, arg) => {
			if (!err && !arg.torrents.length) {
				err = 'Torrent not found'
			}
			if (!hasError(next, err)) {
				arg.torrents[0].customData = {}
				if (user.customData && user.customData[+req.params.id]) {
					arg.torrents[0].customData = user.customData[+req.params.id]
				}
				res.json(arg.torrents[0])
			}
		})
	})

	router.post("/", (req, res, next) => {
		let user = db.get(req.user, {})
		let path = req.user + "/" + Math.random().toString(36).substring(2, 22)
		let options = {
			"download-dir": config.transmission_downloads_directory + path
		}

		let addTorrent = (err, arg) => {
			if (!hasError(next, err)) {
				if (!user.ids) {
					user.ids = []
				}
				if (!user.customData) {
					user.customData = {}
				}
				user.customData[+arg.id] = { downloadPath: path }
				user.ids.push(+arg.id)
				db.set(req.user, user)
				res.json(arg.torrents)
			}
		}

		if (req.body.base64) {
			transmission.addBase64(req.body.base64, options, addTorrent)
		} else if (req.body.url) {
			transmission.addUrl(req.body.url, options, addTorrent)
		} else {
			next(new Error("Bad torrent format"))
		}
	})

	router.delete("/:id", (req, res, next) => {
		let user = db.get(req.user, {})
		transmission.remove([+req.params.id], true, (err, arg) => {
			if (!hasError(next, err)) {
				let target = null
				if (user.ids && user.ids.indexOf(+req.params.id) != -1 && user.customData && user.customData[+req.params.id] && user.customData[+req.params.id].downloadPath) {
					target = config.downloads_directory + user.customData[+req.params.id].downloadPath
				}
				if (target && target.length > 20) { // avoid accidental removal of '/'
					const child = exec("rm -r " + target, (error, stdout, stderr) => {
						console.log(`stdout: ${stdout}`)
						console.log(`stderr: ${stderr}`)
						if (error !== null) {
							console.log(`exec error: ${error}`)
						}
						if (user.ids) {
							user.ids.splice(user.ids.indexOf(req.params.id), 1)
							delete user.customData[+req.params.id]
							db.set(req.user, user)
						}
						res.json({})
					})
				} else {
					next(new Error('Invalid target: ' + target))
				}
			}
		})
	})

	router.put("/:id/pause", (req, res, next) => {
		transmission.stop([+req.params.id], (err, arg) => {
			if (!hasError(next, err)) {
				res.json({})
			}
		})
	})

	router.put("/:id/resume", (req, res, next) => {
		transmission.start([+req.params.id], (err, arg) => {
			if (!hasError(next, err)) {
				res.json({})
			}
		})
	})

	router.post("/:id/zip", (req, res, next) => {
		let user = db.get(req.user, {})
		if (!user.customData || !user.customData[+req.params.id]) {
			return next(new Error('Torrent ID error'))
		}
		user.customData[+req.params.id].zipProcessing = true
		db.set(req.user, user)
		let target = config.downloads_directory + user.customData[+req.params.id].downloadPath
		const child = exec("cd " + target + " && zip -r "+ "ziperino.zip .", (error, stdout, stderr) => {
			user.customData[req.params.id].zipProcessing = false
			db.set(req.user, user)
			console.log(`stdout: ${stdout}`)
			console.log(`stderr: ${stderr}`)
			if (error !== null) {
				console.log(`exec error: ${error}`)
			}
			res.json({})
		})
	})

	return router
}

module.exports = torrentRouter
