const express = require('express')
const Transmission = require('transmission')

const config = require('../config')
const authKeys = require('../authKeys')

let torrentRouter = () => {
	let router = express.Router()
	let transmission = new Transmission(config.transmission_options);

	router.get("/", (req, res, next) =>
	{
		/* todo: find ids of user's torrents and then transmission.get(ids, ...*/
		transmission.methods.torrents.fields = ['error', 'errorString', 'eta', 'haveValid', 'id', 'name', 'percentDone', 'rateDownload', 'rateUpload', 'sizeWhenDone', 'status', 'uploadRatio']
		transmission.get((err, arg) => {
			if (err)
				console.error(err)
			else
			{
/*				for torrent in arg.torrents
					console.log arg.torrents*/
				res.json(arg.torrents)
			}
		});
	})
	router.get("/:id", (req, res, next) =>
	{
		transmission.methods.torrents.fields = ['activityDate', 'addedDate', 'comment', 'doneDate', 'downloadDir', 'error', 'errorString', 'eta', 'files', 'hashString', 'haveUnchecked', 'haveValid', 'id', 'isFinished', 'name', 'peersConnected', 'peersGettingFromUs', 'peersSendingToUs', 'percentDone', 'pieceCount', 'rateDownload', 'rateUpload', 'sizeWhenDone', 'status', 'totalSize', 'trackerStats', 'uploadRatio']
		res.json("torrent details")
	})
	router.post("/", (req, res, next) =>
	{
		console.log(req.body.torrentname, req.body.torrentfile)
		res.json("add torrent")
	})
	router.delete("/:id", (req, res, next) =>
	{
		/*delete torrent files*/
		console.log(req.body.torrentname, req.body.torrentfile)
		res.json("add torrent")
	})
	router.put("/:id/remove", (req, res, next) =>
	{
		/*remove torrent from client*/
		res.json("remove torrent")
	})
	router.put("/:id/pause", (req, res, next) =>
	{
		/*pause torrent*/
		res.json("pause torrent")
	})
	router.put("/:id/resume", (req, res, next) =>
	{
		/*resume torrent*/
		res.json("resume torrent")
	})
	return router
}

module.exports = torrentRouter
