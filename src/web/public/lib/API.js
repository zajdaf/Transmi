var API = (function () { 'use strict';
    function API () {
        try {
            this.apiKey = localStorage.getItem("apiKey") || null
        } catch (e) {
            this.apiKey = null
        }
    }

    API.prototype.isConnected = function () {
        return this.apiKey !== null
    }

    API.prototype.setApiKey = function (apiKey) {
        if (apiKey) {
            this.apiKey = apiKey
            try {
                localStorage.setItem("apiKey", apiKey)
            } catch (e) {}
        } else {
            this.apiKey = null
            try {
                localStorage.removeItem("apiKey")
            } catch (e) {}
        }
    }

    API.prototype._getOptions = function (defaultOptions) {
        var options = defaultOptions || {}

        if (this.apiKey) {
            if (!options.headers) {
                options.headers = {}
            }

            options.headers.Authorization = this.apiKey
        }

        return options
    }

    API.prototype.get = function (path, options) {
        return window.axios.get("/api" + path, this._getOptions(options)).catch(this._onError.bind(this))
    }

    API.prototype.delete = function (path, options) {
        return window.axios.delete("/api" + path, this._getOptions(options)).catch(this._onError.bind(this))
    }

    API.prototype.post = function (path, data, options) {
        return window.axios.post("/api" + path, data, this._getOptions(options)).catch(this._onError.bind(this))
    }

    API.prototype.put = function (path, data, options) {
        return window.axios.put("/api" + path, data, this._getOptions(options)).catch(this._onError.bind(this))
    }

    API.prototype._onError = function (error) {
        if (error.response && error.response.status === 403) {
            this.setApiKey(null)
            window.app.router.go('auth')
            if (error.response.data) {
                return Promise.reject(error.response.data.error)
            }
            return Promise.reject()
        }

        if (error.response && error.response.data) {
            return Promise.reject(error.response.data.error)
        }

        return Promise.reject(error.message)
    }

    return API
}());
