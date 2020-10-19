var log4js = require("log4js")
var log = log4js.getLogger('SERVICE GROUPFLYS')

const axios = require('axios')

const endpoint = 'http://prova.123milhas.net/api/flights'

async function main() {
    log.info('Agrupando dados ')
    const response = await axios.get(endpoint)
    const flys = response.data

    log.info('STEP 1: Agrupar pelo tipo da tarifa')
    const fareStatusGroups = getGroupByStatusAndValue(flys, 'fare')
    log.debug(JSON.stringify(fareStatusGroups))

    let flysGroups = []
    for (const key in fareStatusGroups) {
        log.info(`STEP 1.1: Separar os tipos de tarifa - ${key}`)
        if (fareStatusGroups.hasOwnProperty(key)) {
            const foreGroups = fareStatusGroups[key]

            console.log(JSON.stringify(foreGroups))

            log.info('STEP 2: Separar os voos em outbound e inbound')
            const outBoundStatusGroups = getGroupByStatus(foreGroups, 'outbound')
            log.debug(`outbound: ${JSON.stringify(outBoundStatusGroups)}`)
            const inBoundtatusGroups = getGroupByStatus(foreGroups, 'inbound')
            log.debug(`inbound: ${JSON.stringify(inBoundtatusGroups)}`)

            log.info('STEP 3: Agrupar pelo preço')
            const priceGroupsOutBound = getGroupByStatusAndValue(outBoundStatusGroups, 'price')
            log.debug(`priceGroups out: ${JSON.stringify(priceGroupsOutBound)}`)
            const priceGroupsInBound = getGroupByStatusAndValue(inBoundtatusGroups, 'price')
            log.debug(`priceGroups in: ${JSON.stringify(priceGroupsInBound)}`)
            
            log.info(`STEP 4: Muitos para muitos com o preço - tarifa: '${key}'`)
            const groups = getGroupsByPrice(priceGroupsOutBound, priceGroupsInBound, flysGroups.length)
            log.debug(`Grupos para ${key}: ${JSON.stringify(groups)}`)
            flysGroups = flysGroups.concat( groups )
        }
    }
    log.info(`STEP 5: Grupos de voo`)
    log.debug(JSON.stringify(flysGroups))

    const {cheapestPrice, unicId} = getcheapestPriceandGroup(flysGroups)
    log.debug(getcheapestPriceandGroup(flysGroups))
    
    return setGroups(flys, flysGroups, cheapestPrice, unicId)
}

function setGroups(flys, flysGroups, cheapestPrice, cheapestGroup) {
    return {
        "flights": flys,
        "groups": flysGroups,
        "totalGroups": flysGroups.length,
        "totalFlights": flys.length,
        "cheapestPrice": cheapestPrice,
        "cheapestGroup": cheapestGroup
    }
}

function getcheapestPriceandGroup(flysGroups) {
    let cheapestPrice = Number.MAX_VALUE
    let unicId = null

    flysGroups.forEach(flysGroup => {
        if (flysGroup.totalPrice < cheapestPrice) {
            cheapestPrice = flysGroup.totalPrice
            unicId = flysGroup.unicId
        }
    })

    return {cheapestPrice, unicId}
}

function getGroupsByPrice(outbound, inboud, id = 0) {
    const groups = []
    let totalPrice = null
    for (const keyOut in outbound) {
        if (outbound.hasOwnProperty(keyOut)) {
            const priceGroupOut = outbound[keyOut]

            for (const keyIn in inboud) {
                if (inboud.hasOwnProperty(keyIn)) {
                    const priceGroupIn = inboud[keyIn]
                    totalPrice = parseInt(keyIn) + parseInt(keyOut)
                    groups.push(setGroup(outbound[keyOut], inboud[keyIn], totalPrice, ++id))
                }
            }
        }
    }
    return groups
}

function setGroup(flyIn, flyOut, totalPrice, id) {
    return {
        "unicId": id,
        "totalPrice": totalPrice,
        "outbound": getIds(flyIn),
        "inbound": getIds(flyOut),
    }
}

function getIds(flys) {
    const ids = []
    flys.forEach(fly => {
        ids.push(fly.id)
    })
    return ids
}

function getGroupByStatus(flys, status, options = {}) {
    const groups = []

    flys.forEach(fly => {
        if (fly[status]) {
            groups.push(fly)
        }
    })

    return groups
}

function getGroupByStatusAndValue(flys, status, options = {}) {
    if (!status) {
        throw "defina o status"
    }
    const groupByValue = options.groupByValue || false
    const value = options.value || null

    const groups = {}

    const list = getStatusList(flys, status)

    for (const iterator of list) {
        groups[iterator] = []
    }

    flys.forEach(fly => {
        if (fly[status] && groups.hasOwnProperty(fly[status])) {
            groups[fly[status]].push(fly)
        }
    })

    return groups
}

/**
 * 
 * @param {*} flys 
 * @param {*} status 
 * res
 * set( 'a', 'b' )
 */

function getStatusList(flys, status) {
    const list = new Set()

    flys.forEach(fly => {
        list.add(fly[status])
    });

    return list
}

// main()

module.exports = main