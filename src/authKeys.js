let keys = {}

module.exports.set = (apiKey, name) => {
    keys[apiKey] = name
/*    setTimeout(() => {
        delete keys[apiKey]
    }, 1000 * 60 * 60)*/
}

module.exports.get = (apiKey) => {
    return keys[apiKey] || null
}
