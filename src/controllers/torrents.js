const express = require('express')
const Transmission = require('transmission')
const exec = require('child_process').exec;

const config = require('../config')
const authKeys = require('../authKeys')
const db = require('./db')

let torrentRouter = () => {
	let router = express.Router()
	let transmission = new Transmission(config.transmission_options)
	let fields = {
		general: ['error', 'errorString', 'eta', 'haveValid', 'id', 'name', 'percentDone', 'rateDownload',
			'rateUpload', 'sizeWhenDone', 'status', 'uploadRatio'],
		detail: ['activityDate', 'addedDate', 'comment', 'doneDate', 'downloadDir', 'error', 'errorString',
			'eta', 'files', 'hashString', 'haveUnchecked', 'haveValid', 'id', 'isFinished', 'name',
			'peersConnected', 'peersGettingFromUs', 'peersSendingToUs', 'percentDone', 'pieceCount',
			'rateDownload', 'rateUpload', 'sizeWhenDone', 'status', 'totalSize', 'trackerStats', 'uploadRatio'],
		stat: ['id', 'name', 'rateDownload', 'rateUpload', 'sizeWhenDone']
	}

	let hasError = (next, err) => {
		if (err) {
			next(new Error(err))
			return true
		}
		return false
	}

	let getUserFromTorrent = (torrentId) => {
		let users = db.keys()

		for (let index in users) {
			let ids = db.get(users[index], {}).ids || []
			if (ids.indexOf(+torrentId) != -1) {
				return users[index]
			}
		}

		return null
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
				for (let index in arg.torrents) {
					let t = arg.torrents[index]
					if (ids.indexOf(+t.id) != -1) {
						user_torrents.push(t)
					}
				}
				res.json(user_torrents)
			}
		})
	})

	router.get("/stats", (req, res, next) => {
		let ids = db.get(req.user, {}).ids || []
		transmission.methods.torrents.fields = fields.stat
		transmission.get((err, arg) => {
			if (!hasError(next, err)) {
				let stats = {
					all: {
						download: 0,
						upload: 0
					},
					you: {
						download: 0,
						upload: 0
					}
				}
				for (let index in arg.torrents) {
					let t = arg.torrents[index]
					stats.all.download += t.rateDownload
					stats.all.upload += t.rateUpload
					if (ids.indexOf(+t.id) != -1) {
						stats.you.download += t.rateDownload
						stats.you.upload += t.rateUpload
					}
				}
				res.json(stats)
			}
		})
	})

	router.get("/activity", (req, res, next) => {
		transmission.methods.torrents.fields = fields.stat
		transmission.get((err, arg) => {
			if (!hasError(next, err)) {
				let stats = {
					all: { download: 0, upload: 0, size: 0, number: 0, usage: '-%' },
					users: []
				}

				let getUserStat = (stats, torrentId) => {
					let statUser = (user) => {
						for (let index in stats.users) {
							if (stats.users[index].name === user) {
								return stats.users[index]
							}
						}
						let data = { name: user, download: 0, upload: 0, size: 0, number: 0, torrents: [] }
						stats.users.push(data)
						return data
					}

					return statUser(getUserFromTorrent(torrentId) || 'ghost')
				}

				for (let index in arg.torrents) {
					let t = arg.torrents[index]
					t.rateDownload = t.rateDownload || 0
					t.rateUpload = t.rateUpload || 0
					t.sizeWhenDone = t.sizeWhenDone || 0
					stats.all.download += t.rateDownload
					stats.all.upload += t.rateUpload
					stats.all.size += t.sizeWhenDone
					stats.all.number += 1

					let user = getUserStat(stats, +t.id)
					user.download += t.rateDownload
					user.upload += t.rateUpload
					user.size += t.sizeWhenDone
					user.number += 1
					user.torrents.push({ id: +t.id, name: t.name, size: t.sizeWhenDone, download: t.rateDownload, upload: t.rateUpload })
				}

				const child = exec("df -h | grep home | awk '{print $5}' | tr -d '\n'", (error, stdout, stderr) => {
					if (stdout) {
						stats.all.usage = stdout
					} else {
						console.error(error, stderr)
					}
					res.json(stats)
				})
			}
		})
	})

	router.get("/:id", (req, res, next) => {
		transmission.methods.torrents.fields = fields.detail
		transmission.get([+req.params.id], (err, arg) => {
			if (!err && !arg.torrents.length) {
				err = 'Torrent not found'
			}
			if (!hasError(next, err)) {
				let user = db.get(getUserFromTorrent(+req.params.id), {})
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
					if (user.customData[+req.params.id].zipFile && user.customData[+req.params.id].zipFile.length > 20) {
						target += ' ' + config.downloads_directory + user.customData[+req.params.id].zipFile
					}
					const child = exec("rm -r " + target, (error, stdout, stderr) => {
						console.log(`stdout: ${stdout}`)
						console.log(`stderr: ${stderr}`)
						if (error !== null) {
							console.log(`exec error: ${error}`)
						}
						if (user.ids) {
							if (user.ids.indexOf(+req.params.id) !== -1) {
								user.ids.splice(user.ids.indexOf(+req.params.id), 1)
							}
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

	router.put("/:id/force_resume", (req, res, next) => {
		transmission.startNow([+req.params.id], (err, arg) => {
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
		let directory = config.downloads_directory + user.customData[+req.params.id].downloadPath
		let zipFile = 'archives/' + user.customData[+req.params.id].downloadPath.replace('/', '-') + '.zip'
		let target = config.downloads_directory + zipFile
		const child = exec(`cd ${directory} && zip -0 -r ${target} .`, (error, stdout, stderr) => {
			user.customData[+req.params.id].zipProcessing = false
			user.customData[+req.params.id].zipFile = zipFile
			db.set(req.user, user)
			console.log(`stdout: ${stdout}`)
			console.log(`stderr: ${stderr}`)
			if (error !== null) {
				console.log(`exec error: ${error}`)
			}
		})
		res.json({})
	})

	return router
}

module.exports = torrentRouter
