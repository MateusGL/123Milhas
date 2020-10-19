const express = require('express')

const router = express.Router()

const service = require('./groupFlys')

router.get('/groups', async (req, res) => {
    res.json(await service())
})


module.exports = app => app.use('/', router)