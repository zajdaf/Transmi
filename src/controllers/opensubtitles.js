const express = require('express')
const request = require('request')

const config = require('../config')
const OpenSubtitles = require('opensubtitles-api')

let torrentRouter = () => {
	let router = express.Router()
	let baseUrl = 'https://torrentapi.org/pubapi_v2.php?app_id=transmi'
    let tokenPromise = null

    let getToken = () => {
        if (!tokenPromise) {
            let os = new OpenSubtitles({
                useragent: 'Popcorn Time NodeJS',
                username: '',
                password: '',
                ssl: true
            })
            tokenPromise = os.login().then(() => {
                setTimeout(() => {
                    tokenPromise = null
                }, 1000 * 60 * 10)
                return os
            })
        }
        return tokenPromise
    }

	router.post("/search", (req, res, next) => {
		getToken()
            .then(os => {
                return os.search({
                    sublanguageid: 'eng,fre',
                    query: req.body.search,
                    limit: 5
                }).then(subtitles => {
                    return [].concat(subtitles.en || [], subtitles.fr || [])
                })
            })
            .then(res.json.bind(res))
            .catch(error => {
                return next(error)
            })
	})

	return router
}

module.exports = torrentRouter
