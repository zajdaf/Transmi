const fs = require('fs')
const path = require('path')

class Database {
    constructor(filename) {
        this.filename = path.join(__dirname, filename)
        try {
            this.db = require(this.filename)
        } catch(e) {
            this.db = {}
        }
    }

    has (key) {
        return this.db[key] !== undefined
    }

    get (key, defaultValue) {
        if (key) {
            if (this.has(key)) {
                return this.db[key]
            }
            return defaultValue
        }
        return this.db
    }

    set (key, value) {
        this.db[key] = value
        this._save()
    }

    remove (key) {
        if (this.has(key)) {
            delete this.db[key]
            this._save()
        }
    }

    _save () {
        fs.writeFile(this.filename, JSON.stringify(this.db), 'utf8', (err) => {
            if (err) {
                console.error('[database.save] error', err.stack)
            }
        })
    }
}

module.exports = Database
