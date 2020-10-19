var log4js = require("log4js")
log4js.configure('config/log4js.json')
var log = log4js.getLogger('APP')

const express = require('express')
const app = express()
const port = 3000

require('./src/controller')(app)

app.listen(port, () => {
    log.info(`listen at: http://localhost:${port}`)
})
