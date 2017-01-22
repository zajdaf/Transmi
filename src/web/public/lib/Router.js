var Router = (function () { 'use strict';
    function Router (routes, target) {
        if (!routes.length) {
            throw new Error('You must have at least 1 route')
        }

        this.routes = []
        this.currentRoute = null
        this.currentComponent = null
        this.target = target.querySelector('router')

        for (var i = 0; i < routes.length; i++) {
            var params = []
            var regex = routes[i].path.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
            regex = regex.replace(/:([a-zA-Z0-9_-]+)/g, function (match) {
                params.push(match.substring(1))
                return '([a-zA-Z0-9_-]+)'
            })
            this.routes.push({
                name: routes[i].name,
                path: routes[i].path,
                component: routes[i].component,
                regexp: new RegExp('^' + regex + '$'),
                params: params
            })
        }

        window.onhashchange = this.updateRouteFromLocationHash.bind(this)
    }

    Router.prototype.updateRouteFromLocationHash = function () {
        var hash = window.location.hash
        if (hash.length && hash[0] === '#') {
            this.handleRouteChange(window.location.hash.substring(1))
        } else {
            this.go(this.routes[0].name)
        }
    }

    Router.prototype.handleRouteChange = function (location) {
        if (this.currentRoute === location) {
            return
        }

        for (var i = 0; i < this.routes.length; i++) {
            var matches = location.match(this.routes[i].regexp)
            if (matches) {
                return this.updateComponent(this.routes[i], matches)
            }
        }

        console.warn('route location not found', location)
        this.go(this.routes[0].name)
    }

    Router.prototype.updateComponent = function (route, matches) {
        var data = {}
        if (route.data) {
            data = JSON.parse(JSON.stringify(route.data))
        }

        for (var j = 0; j < route.params.length; j++) {
            if (matches && j + 1 < matches.length) {
                data[route.params[j]] = matches[j + 1]
            } else {
                data[route.params[j]] = null
            }
        }

        if (this.currentComponent && this.currentComponent.teardown) {
            this.currentComponent.teardown()
            delete this.currentComponent
        }

        console.info('update component to', route.name, data)
        this.currentComponent = new route.component({
            target: this.target,
            data: data
        })
    }

    Router.prototype.go = function (name, data) {
        if (!data) {
            data = {}
        }
        for (var i = 0; i < this.routes.length; i++) {
            if (this.routes[i].name === name) {
                var paramIndex = -1
                window.location.hash = this.routes[i].path.replace(/:([a-zA-Z0-9_-]+)/g, function (match) {
                    paramIndex += 1
                    return '' + data[this.routes[i].params[paramIndex]]
                }.bind(this))
                return
            }
        }
        console.warn('route not found', name, data)
        return false
    }

    return Router
}());
