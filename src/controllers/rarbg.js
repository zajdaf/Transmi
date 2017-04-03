const express = require('express')
const request = require('request')

const config = require('../config')
const db = require('./db')

let torrentRouter = () => {
	let router = express.Router()
	let baseUrl = 'https://torrentapi.org/pubapi_v2.php?app_id=transmi'
    let tokenPromise = null

    let getToken = () => {
        if (!tokenPromise) {
            tokenPromise = new Promise((resolve, reject) => {
                request({
                    url: baseUrl + '&get_token=get_token',
                    method: 'GET',
                    json: true
                }, (error, response, json) => {
                    if (error) {
                        tokenPromise = null
                        return reject(new Error(error))
                    }
                    if (json.error || !json.token) {
                        tokenPromise = null
                        return reject(new Error(json.error || 'Token not found'))
                    }
                    setTimeout(() => {
                        tokenPromise = null
                    }, 1000 * 60 * 10)
                    return resolve(json.token)
                })
            })
        }
        return tokenPromise
    }

	router.post("/search", (req, res, next) => {
		getToken().then(token => {
            request({
                url: baseUrl + '&token=' + token + '&mode=search&format=json_extended&limit=100&min_seeders=2&search_string=' + encodeURIComponent(req.body.search),
                method: 'GET',
                json: true
            }, (error, response, json) => {
                if (error) {
                    return next(new Error(error))
                }
                if (json.error) {
                    return next(new Error(json.error))
                }
                res.json(json.torrent_results)
            })
        })
	})

	return router
}

module.exports = torrentRouter
