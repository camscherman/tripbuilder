
const kx = require('../db/connection')
// const rp = require('request-promise')
const moment = require('moment')
const R = require('ramda')
const DataParser = require('./explore_response')
const Bluebird = require('bluebird')

let depYear = 2017
let depMonth = 11
let depDay = 7

let retYear = 2018
let retMonth = 12
let retDay = 30


// High level goal. Send a departure and a arrival... Blanket search will return all one ways...
//  then it will pass the results to findBestDepartureDates, and call query Narrow Params to get the 5/10 best departure routes.

let depDate = `${depYear}-${depMonth}-${depDay}`
let retDate = `${retYear}-${retMonth}-${retDay}`
let originCode = "YXE"
let DestinationCode = "YVR"
let jsBody = JSON.stringify({
    "ResponseVersion": "VERSION41",
    "FlightSearchRequest": {
        "Adults": "1",
        "Child": "0",
        "ClassOfService": "ECONOMY",
        "InfantInLap": "0",
        "InfantOnSeat": "0",
        "Seniors": "0",
        "TypeOfTrip": "ONEWAY",
        "SegmentDetails": [
            {
                "DepartureDate": depDate,
                "DepartureTime": "1100",
                "Destination": "YVR",
                "Origin": "LON"
            }

        ],
        "SearchAlternateDates": "true"
    }
})



// function b64EncodeUnicode(str) {
//     // first we use encodeURIComponent to get percent-encoded UTF-8,
//     // then we convert the percent encodings into raw bytes which
//     // can be fed into btoa.
//     return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
//         function toSolidBytes(match, p1) {
//             return String.fromCharCode('0x' + p1);
//         }));
// }

const fareportal_api = require('./api_key')

const request = require('request')

const fareportal_url = "https://api-dev.fareportallabs.com/air/api/search/searchflightavailability"

const fpHeaders = {
    'Authorization': `Basic ${fareportal_api}`,
    'Content-Type': 'application/json'
}

// const options = {method: 'post', url:fareportal_url, headers: headers, body: jsBody }


//  Makes the options that need to be sent to Fareportal API
function formatRequest(reqFormatFn, depCode, depDate, retCode, retDate = 'null') {
    const reqBody = reqFormatFn(depCode, depDate, retCode, retDate)
    return options = { method: 'post', url: fareportal_url, headers: fpHeaders, body: reqBody }
}

function makeRequestBodyOneWay( depCode, depDate, retCode) {
    let jsBody = {
        "ResponseVersion": "VERSION41",
        "FlightSearchRequest": {
            "Adults": "1",
            "Child": "0",
            "ClassOfService": "ECONOMY",
            "InfantInLap": "0",
            "InfantOnSeat": "0",
            "Seniors": "0",
            "TypeOfTrip": "ONEWAY",
            "SegmentDetails": [
                {
                    "DepartureDate": depDate,
                    "DepartureTime": "1100",
                    "Destination": retCode,
                    "Origin": depCode
                }


            ]
        }
    }
    console.log(JSON.stringify(jsBody))
    return JSON.stringify(jsBody)

}

function makeRequestBodyTwoWay(depCode, depDate, retCode, retDate) {
    let jsBody = {
        "ResponseVersion": "VERSION41",
        "FlightSearchRequest": {
            "Adults": "1",
            "Child": "0",
            "ClassOfService": "ECONOMY",
            "InfantInLap": "0",
            "InfantOnSeat": "0",
            "Seniors": "0",
            "TypeOfTrip": "ROUNDTRIP",
            "SegmentDetails": [
                {
                    "DepartureDate": depDate,
                    "DepartureTime": "1100",
                    "Destination": retCode,
                    "Origin": depCode
                }
                ,
                {
                    "DepartureDate": retDate,
                    "DepartureTime": "1100",
                    "Destination": depCode,
                    "Origin": retCode
                }
            ]
        }
    }
    return JSON.stringify(jsBody)

}




function makeRequestArrayOneWay(depCode, arrCode,startDate, endDate, incrementStep){
    return new Promise((resolve, reject)=>{
        const reqArray =[]
        let date = makeNormalDate(makeMomentDate(startDate))
        const endingDate = makeNormalDate(makeMomentDate(endDate))
        while(incrementDay(date) < endingDate){
            console.log('Pushing:', date)
            date = incrementDay(date, incrementStep)
            reqArray.push(formatRequest(makeRequestBodyOneWay,depCode, date, arrCode ))

        } console.log(`Preparing ${reqArray.length} requests`)
        // reqArray.forEach(arr => console.log(arr))
        resolve(reqArray)
    })
}

function makeRequestArrayTwoWay(depCode, arrCode,startDate, endDate){
    // return new Promise((resolve, reject)=>{
        const reqArray =[]
        const start = makeNormalDate(makeMomentDate(startDate))
        let date = makeNormalDate(makeMomentDate(endDate).subtract('2','days'))
        const endingDate = makeNormalDate(makeMomentDate(endDate).add('2', 'days'))
        while(date !== endingDate){
            console.log('Pushing:', date)
            date = incrementDay(date)
            reqArray.push(formatRequest(makeRequestBodyTwoWay,depCode, start, arrCode,date  ))

        }
        console.log(`Preparing ${reqArray.length} requests`)
        reqArray.forEach(arr => console.log(arr))
        return reqArray
        // resolve(reqArray)
    // })
}
// kindRequest takes an array maker function ie. makeRequestArrayOneWay, and uses it to make an array of promises, which are called
// in batches until they are all completed. You can set the number of requests called at a time. The purpose of this function is to
// make a lot of requests to the server in a controlled fashion thus not overloading the server.

function kindRequest(arrMakerFn, noOfRequestsPerBatch, depCode, arrCode, startDate, endDate, incrementStep =1 ){
    return arrMakerFn(depCode, arrCode, startDate, endDate, incrementStep).then((reqArray)=>{
      const arrayChunks = arraySplitter(reqArray, noOfRequestsPerBatch)
      return Bluebird.map(arrayChunks, (chunk)=>{
        return Bluebird.map(chunk, (request)=>{
          return makeRequest(request)
        }).then(res=>{
          const arrayOfDbPushes = []
          res.forEach(item=>{
          const {body} = item
          arrayOfDbPushes.push(pushToDb(body))})
          return arrayOfDbPushes
        }).then(arr=> Promise.all(arr))
      })
    })
  }


// function kindRequest(arrMakerFn, noOfRequestsPerBatch, depCode, arrCode, startDate, endDate, incrementStep =1 ){
//     arrMakerFn(depCode, arrCode, startDate, endDate, incrementStep).then((reqArray)=>{
//
//     const recRequest = (requests, noOfRequestsPerBatch, start) =>{
//         console.log('In recRequest')
//         if(requests.length < (start + noOfRequestsPerBatch)){
//             console.log('break condition')
//             const recBodies = requests.slice(start, request.length-1)
//             const promises = R.map(makeRequest, recBodies)
//
//
//             return  Promise.all(promises)
//                 .then((res) => {
//                     console.log(res.body)
//                     const arrayOfDbPushes = []
//                     for (let item of res) {
//                         const { body } = item
//                         console.log("Pushing", body)
//
//                         arrayOfDbPushes.push(pushToDb(body))
//
//                     }
//                     return Promise.all(arrayOfDbPushes)
//                 })
//         } else {
//             console.log(requests.slice(start, start+ noOfRequestsPerBatch))
//             const recBodies =requests.slice(start, start + noOfRequestsPerBatch)
//             const promises = R.map(makeRequest, recBodies)
//              Promise.all(promises)
//                                         .then((res) =>{
//                                             console.log(res.body)
//                                             const arrayOfDbPushes= []
//                                             for( let item of res){
//                                                 const {body} = item
//                                                 console.log("Pushing", body)
//
//                                                  arrayOfDbPushes.push(pushToDb(body))
//
//                                             }
//                                             return Promise.all(arrayOfDbPushes)
//                                         }).then((res)=>{
//                                             // console.log(res)
//                                             recRequest(requests, noOfRequestsPerBatch, start+ noOfRequestsPerBatch )
//          }) }
//
//         }
//         return recRequest(reqArray, noOfRequestsPerBatch, 0)
//     }).then(res => console.log("RESPONSE123", res))
//
// }

function arraySplitter(arr, chunkSize){
  const returnArray =[]
  const splitIter= (arr, start, end)=>{
    returnArray.push(arr.slice(start, end))
    if((end+ chunkSize) >= arr.length){
      returnArray.push(arr.slice(end, arr.length-1))
    } else {
      splitIter(arr, end, end+chunkSize)
    }
  }
  splitIter(arr, 0, chunkSize)
  return returnArray
}
function sixMonthRequest(depCode,arrCode){
  return kindRequest(makeRequestArrayOneWay, 30, depCode , arrCode, '2017-12-08', '2018-4-30' )
}

function incrementDay(date, step = 1) {
    return nextDate = moment(date).add(step, 'day').format().slice(0, 10)
}


function makeRequest(reqParams) {

    return new Promise((resolve, reject) => {
        request(reqParams, (err, res, body) => {
            // console.log(body)
            resolve({ body })
        })
    })
}


function queryFarePortal(depCode = 'YVR', arrCode = 'ICN', startDate, endDate) {

    const dep = depCode
    const arr = arrCode
    const start = startDate
    const end = endDate

    let day = start
    let searchParams = []


    while (day !== end) {
        // console.log('Day: ', day)

        let params = formatRequest(makeRequestBodyOneWay, depCode, day, arrCode)
        debugger
        searchParams.push(params)
        day = incrementDay(day)
    }
    for (let params of searchParams) {
        makeRequest(params).then((obj) => {
            const { body } = obj
            pushToDb(body).then((res)=>{ console.log(res.body)})
        })
    }
}

function pushToDb(apiResponse) {
    return kx.insert({  fpdata: JSON.parse(apiResponse) })
        .into('rawdata')
}


// function sweepSearch(depCode, arrCode, startDate, endDate, minInterval) {
//     const end = makeMomentDate(endDate)
//     const start = makeMomentDate(startDate)
//     const lastDeparture = end.subtract(minInterval, "days").format().slice(0, 10)
//     let depDate = makeNormalDate(start)
//     let intervalStop = start.add(minInterval, "days").format().slice(0, 10)


//     while (intervalStop !== makeNormalDate(end)) {

//         queryFarePortal(depCode, arrCode, depDate, intervalStop)
//         intervalStop = incrementDay(intervalStop)
//     }


// }
//
//  function findBestDepartureDates(depCode, arrCode, limit = 5){
//     return kx.select('outBoundId').from('trips')
//                             .where({ 'depCode': depCode, 'arrCode': arrCode })
//                             .limit(`${limit}`)
//                             .orderBy('price', "ASC")
//                             .then( (segId)=>{
//                               console.log(segId)
//                               return R.map((segment) =>
//                                kx.select('dep-time')
//                               .from('flights')
//                               .where({'segmentId': segment.outBoundId}), segId)
//                             }).then((map)=>  Promise.all(map))
//                             .then((res)=> R.map((response)=> makeNormalDate(makeMomentDate(response[0]['dep-time'])), res))
//                             .then((res)=> console.log(res))
//                             // .then((res)=> console.log(res))
//
// }

// findBestDepartureDates returns and array of objects

function findBestDepartureDates(depCode, arrCode, limit = 1 ){
  const today = new Date()
  console.log("Today", today)
   const whereParams = {
     'depCode': depCode,
     'arrCode': arrCode
   }
   return kx.select('trips.outBoundId',"flights.dep-time").from('trips')
                            .innerJoin('flights', 'trips.outBoundId', 'flights.segmentId')
                            .where("flights.dep-time",">", today)
                           .andWhere(whereParams)
                           .limit(`${limit}`)
                           .orderBy('price', "ASC")


}


    // const bestDates = R.map(async (segment) => await kx.select('dep-time').from('flights')
    //                           .where({'segmentId': segment}), outBoundIds)




    // console.log(bestDates)
    // const normalDates = R.map((date)=> makeNormalDate(makeMomentDate(R.path(['dep-time'],date))), depDates)





async function queryTwoWays(dateFn, depCode, arrCode, noOfDays = 14){
  const dates= await dateFn(depCode, arrCode, no = 6)
  console.log(dates)
  const reqBodies = dates.map((obj)=>{

     const date = R.path(['dep-time'], obj)
     const startDate = date
     const endDate =  makeNormalDate(makeMomentDate(date).add(noOfDays,"days"))
    //  const requestPromise = Bluebird.map()

     return makeRequestArrayTwoWay(depCode,arrCode, startDate, endDate)
  })

  const bestFlights = []

   return Bluebird.map(reqBodies, item => {

    return Bluebird.map(item, (req)=> {
      return makeRequest(req)
    })

  }).then( res =>{ res.map((item)=>{
        item.forEach(obj =>{

    const body = JSON.parse(obj.body)

    const data = DataParser.parsePrices(body)
    // // const inbound = data[1].outBoundOptionId
    // // console.log("INBOUND", inbound)
    const bestPriceSegment =findBestPrice(data)
    const outBoundOption = DataParser.findOption(DataParser.getOutBoundOptionArray, body, bestPriceSegment.outBoundId)
    const inBoundOption = DataParser.findOption(DataParser.getInBoundOptionArray, body, bestPriceSegment.inBoundId)
    const flightDetails = {
            price: bestPriceSegment,
            outBoundDetails: outBoundOption,
            inBoundDetails: inBoundOption
    }
    bestFlights.push(flightDetails)
    // console.log("PRICES", bestPriceSegment)
    // console.log("OutboundInfo", outBoundOption)
    // console.log("InboundInfo", inBoundOption)
  })

  })

  return bestFlights
})

}



function findBestPrice(dataObject){
  if(Array.isArray(dataObject)){
  return dataObject.reduce(lowerPrice)
} else {
  return []
}
}

function lowerPrice(a, b){
  const price1 = a.adultPrice
  const price2 = b.adultPrice
  return (price1 < price2) ? a : b
}

function bestTwoWayFlight(depCode, arrCode, noOfDays = 14 ){
  if (noOfDays < 5){
    return {error: "Must be at least five days"}
  }
  return queryTwoWays(findBestDepartureDates, depCode, arrCode)
}

// SELECT date_trunc('day',"dep-time") as day, MIN("price") FROM "flights" INNER JOIN "trips" ON "segmentId" = "outBoundId" GROUP BY day ;
function getSixMonthsDataOneWay(depCode, arrCode){
  const whereParams = {
    'depCode': depCode,
    'arrCode': arrCode,
    'isTwoWay': false
  }
  return kx('flights').select(kx.raw('??::date as day', ['dep-time'])).min('trips.price')
            .innerJoin('trips', 'flights.segmentId', 'trips.outBoundId')
            .where(whereParams)
            .groupBy('day').orderBy('day', 'asc')
}

// getSixMonthsDataOneWay('YVR', 'BKK').then(res=> console.log(res))

function getAverageMinimum(depCode, arrCode){
  return getSixMonthsData(depCode, arrCode).then(res =>{
    const length = res.length
    console.log(length)
    const prices = res.map((item)=>{
      if(!isNaN(parseInt(item.min))){
      return parseInt(item.min)
    }
    })

    const sum = prices.reduce((a,b)=> a+b)

    return sum/length
  })

}
// getAverageMinimum('YVR', 'BKK').then(res=> console.log(res))

function getSixMonthsDataTwoWay(depCode, arrCode){
  const whereParams = {
    'depCode': depCode,
    'arrCode': arrCode,
    'isTwoWay': true
  }
  return kx('flights').select('dep-time').min('trips.price')
            .innerJoin('trips', 'flights.segmentId', 'trips.outBoundId')
            .where(whereParams)
            .groupBy('flights.dep-time').orderBy('flights.dep-time', 'asc')
}

function getAverageMinimum(depCode, arrCode){
  return getSixMonthsDataOneWay(depCode, arrCode).then(res =>{
    const length = res.length
    console.log(length)
    const prices = res.map((item)=>{
      if(!isNaN(parseInt(item.min))){
      return parseInt(item.min)
    }
    })
    console.log(prices)
    const sum = prices.reduce((a,b)=> a+b)

    return sum/length
  })

}


function indexOneWayValue(depCode, arrCode){
   return getSixMonthsDataOneWay(depCode, arrCode).then(res =>{
    const length = res.length
    console.log(length)
    const prices = res.map((item)=>{
      if(!isNaN(parseInt(item.min))){
      return parseInt(item.min)
    }
    })

    const sum = prices.reduce((a,b)=> a+b)
    const aveMin = sum/length
    const pricesWithIndex = res.map((item)=> [item['day'], item.min, (parseInt(item.min) - aveMin)/aveMin])
    return pricesWithIndex
  })
}
function indexTwoWayValue(depCode, arrCode){
   return getSixMonthsDataTwoWay(depCode, arrCode).then(res =>{
    const length = res.length
    console.log(length)
    const prices = res.map((item)=>{
      if(!isNaN(parseInt(item.min))){
      return parseInt(item.min)
    }
    })

    const sum = prices.reduce((a,b)=> a+b)
    const aveMin = sum/length
    const pricesWithIndex = prices.map((item)=> [item, (item - aveMin)/aveMin])
    return pricesWithIndex
  })
}

// getAverageMinimum('YVR', 'BKK').then( res => console.log(res))
// indexOneWayValue('YVR', 'BKK').then(res => console.log(res))

 // queryTwoWays(findBestDepartureDates, 'YVR', 'LIM').then( res=> console.log(res))

// async function queryTestParameters(datesFn, depCode, arrCode, noOfWeeks){
//     const dates = await datesFn(depCode, arrCode)
//     const requests=[]
//     for(let obj of dates){
//       const date = R.path(['dep-time'],obj)
//         const startDate = date;
//         const endDate =  makeNormalDate(makeMomentDate(date).add(noOfWeeks,"weeks"))
//         requests.push(await makeRequestArrayTwoWay(depCode, arrCode,startDate, endDate ))
//         console.log(startDate)
//     }
//   }

// queryTestParameters(findBestDepartureDates, 'YVR', 'YUL', 2)

// findBestDepartureDates('YVR','YUL', 10).then(res=> console.log(res))
  // queryNarrowParameters(findBestDepartureDates, 'YVR', 'BKK', 2).then(prices => console.log(prices))
//  makeRequestArrayTwoWay('YVR', 'MNL', '2017-11-11', '2017-11-21').then((res)=> console.log(res))




// queryNarrowParameters(findBestDepartureDates,'YVR', 'MNL')

function makeMomentDate(date) {
    // takes date of form yyyy-mm-dd
    return moment(date)
}

function makeNormalDate(moment) {
    return moment.format().slice(0, 10)
}

let today = moment('2017-11-12').format().slice(0, 10)
let end = moment('2017-12-01').format().slice(0, 10)



//  queryFarePortal('YVR', 'PVG', today, end)

// sweepSearch('YVR', 'LON', '2017-11-10', '2018-02-25', 5)


// You will find fare details nested in an object that looks like this:
// myData.FlightResponse.FpSearch_AirLowFaresRS.SegmentReference.RefDetails[0].PTC_FareBreakdown
// RefDetails is an array of objects with four properties:
// It looks like this:
//    // CNT: [Object],
//    OutBoundOptionId: [Array],
//        InBoundOptionId: [Array],
//            PTC_FareBreakdown: [Object],
//                SRIDetail: null },
// kindRequest(makeRequestArrayOneWay,20, 'YVR', 'SIN', '2017-12-30', '2018-3-15').then(()=>console.log('finished'))
module.exports = {sixMonthRequest:sixMonthRequest,

                bestTwoWayFlight: bestTwoWayFlight,
                indexOneWayValue: indexOneWayValue }
