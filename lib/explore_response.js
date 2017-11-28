const kx = require('../db/connection')
const R = require('ramda')

// const infoObject = {}
// kx('rawdata').then((objs)=>{

//     const refObjects =[]
//     for(let obj of objs){

//         refObjects.push(obj.fpdata)
//     }
//     //   const infoObject = extractRelevantInfo(refObjects)
//     return refObjects
//     //  console.log("Length of infoObject",infoObject.length)
// }).then( ref => {

//     return infoObject = extractRelevantInfo(ref)


// })


function updateFlightDB(infoObj){
    for(let key in infoObj){
        const {depTime, arrTime, depCity,arrCity,fullDetails,price, priceDetails} = infoObj[key]
        const params = {
            departure: depCity,
            arrival: arrCity,
            'dep-time': depTime,
            'arr-time': arrTime,

            segmentId: key,
            fullDetails: JSON.stringify(fullDetails),

        }
        // const priceParams ={
        //     depCode: depCity,
        //     arrCode: arrCity,
        //     flightId: key,
        //     price: price
        // }

        kx.first('*')
        .from('flights')
        .where({'segmentId': key})
        .then( ret=>{
                    console.log( ret === undefined )
                    if(ret===undefined){
                        console.log("IM HERE!")
                        kx.insert(params)
                        .into('flights')
                         .then(() => {
                             console.log("Success")
                         }).catch((error) => { console.log(error) })
                    } else {
                        kx('flights')
                        .update(params)
                        .where({ 'segmentId': key })
                         .then(()=> {console.log('Updated')}
                         )}
         } ).then(console.log('complete')).catch(err=> console.log(err))

    }
}


function updateTripsDB(infoObj){
    for (let key in infoObj) {
        const {   depCity, arrCity, inBoundId,  price } = infoObj[key]

        const priceParams = {
            depCode: depCity,
            arrCode: arrCity,
            outBoundId: key,
            inBoundId: inBoundId,
            price: price,
            isTwoWay: (inBoundId !== 'N/A')

        }
        if(priceParams.price > 0){
         kx.insert(priceParams)
            .into('trips').then(console.log('Success'))
    }
  }
}

function extractRelevantInfo (arrayOfResponses) {
    const infoObject = {}
    arrayOfResponses.forEach(o => {

        let optArr = getOutBoundOptionArray(o)
        let inOpArr = getInBoundOptionArray(o)
        if (Array.isArray(optArr)) {
            optArr.forEach(el => getDepartureAndArrivalTimes(el, infoObject))
        }
        if (Array.isArray(inOpArr)){
          inOpArr.forEach( el => getDepartureAndArrivalTimes(el, infoObject))
        }
         let priceAndReferences = parsePrices(o)

         if (Array.isArray(priceAndReferences)) {
             priceAndReferences.forEach((obj) => {
                infoObject[obj.outBoundOptionId]['price'] = obj.adultPrice
                infoObject[obj.outBoundOptionId]['inBoundId'] = obj.inBoundOptionId

            })
        }

    })
    return infoObject

}




// updateFlightDB();

 function parseOneWayFlights(){
    getInfoObjectFromRawData().then(info => updateFlightDB(info) )
  //  getInfoObjectFromRawData().then(info => updateFlightDB(info) )
}

// parseOneWayFlights()
   console.log("Running");
  //  getInfoObjectFromRawData().then( info => updateTripsDB(info))


// parseOneWayFlights()
console.log("Before")

function getInfoObjectFromRawData() {
    return kx('rawdata').then((objs) => {

        const refObjects = []
        for (let obj of objs) {

            refObjects.push(obj.fpdata)
        }
        //   const infoObject = extractRelevantInfo(refObjects)
        return refObjects
        //  console.log("Length of infoObject",infoObject.length)
    }).then( ref =>{
         infoObject = extractRelevantInfo(ref)
         return infoObject
    })
}

// parsePrices();




// console.log("Length of Prices:", priceAndReferences.length)
function parsePrices(fpdata){

        const CntKey = R.path(['FlightResponse', 'FpSearch_AirLowFaresRS','CntKey' ], fpdata)
        const RefDetails = R.path(['FlightResponse', 'FpSearch_AirLowFaresRS',  'SegmentReference','RefDetails'], fpdata)

    if(!!RefDetails){
    return R.map((ref) =>{
        if(typeof ref !== undefined){
          // console.log(ref.InBoundOptionId[0])
        return {
            CntKey: CntKey,
            CntId: ref.CNT.ID,
            outBoundOptionId: ref.OutBoundOptionId[0],
            inBoundOptionId: ref.InBoundOptionId[0] || 'N/A',
            adultPrice: R.path(["PTC_FareBreakdown", "Adult", "TotalAdultFare"], ref),
            fullDetails: R.path(['PTC_FareBreakdown'], ref)
        }
    }} , RefDetails)
    }
}


function getOutBoundOptionArray(fpdata){
    const options =R.path(["FlightResponse" , "FpSearch_AirLowFaresRS","OriginDestinationOptions", "OutBoundOptions", "OutBoundOption" ], fpdata)
    return options
}

function getInBoundOptionArray(fpdata){
  const options = R.path(["FlightResponse" , "FpSearch_AirLowFaresRS","OriginDestinationOptions", "InBoundOptions", "InBoundOption" ], fpdata)
  return options || []
}

function getDepartureAndArrivalTimes(outboundOption, dataObject){
    let segment =  R.path(['FlightSegment'], outboundOption)
        dataObject[R.path(['Segmentid'], outboundOption)] = {
            noOfSegments: segment.length,
            depTime: R.path(['DepartureDateTime'], segment[0]),
            arrTime: R.path(['ArrivalDateTime'], segment[segment.length-1]),
            depCity: R.path(['DepartureAirport','LocationCode'], segment[0]),
            arrCity: R.path(['ArrivalAirport', 'LocationCode'], segment[segment.length - 1]),
            fullDetails: segment
        }

}

// Continue Here
function makeInfoObject(fpdata){
    const infoObject = {}
    const outBoundOption = getOutBoundOptionArray(fpdata)
    const inBoundOption  =  getInBoundOptionArray(fpdata)


}


const hasRefDetails = (item) => {
    const { FlightResponse: { FpSearch_AirLowFaresRS: { SegmentReference: { RefDetails } } } } = item
    return (!!RefDetails ? true : item)
}

function findDetailsTwoWay(outBoundId, inBoundId, fpdata){
    const outBoundOptions = R.path(["FlightResponse" , "FpSearch_AirLowFaresRS","OriginDestinationOptions", "OutBoundOptions", "OutBoundOption" ], fpdata)
    const inBoundOptions = R.path(["FlightResponse" , "FpSearch_AirLowFaresRS","OriginDestinationOptions", "OutBoundOptions", "InBoundOption" ], fpdata)
    const object={
      outBoundId: outBoundOptions[outBoundId],
      inBoundId: inBoundOptions[inBoundId]
    }
    return object
}

function findOption(arrayFinderFunc, fpdata, optionId){
  const optionsArray = arrayFinderFunc(fpdata)
  for(let item of optionsArray){
    const segment = R.path(['Segmentid'], item)
    if(segment !== undefined){
      return item.FlightSegment
    }
  }
  return undefined
}
// NOTES: findOption should be used with getInBoundOptionArray or getOutBoundOptionArray ex: findOption(getInBoundOptionArray, fpdata, 'PXYSASDASD')
module.exports = {
  parsePrices: parsePrices,
  getInBoundOptionArray: getInBoundOptionArray,
  getOutBoundOptionArray: getOutBoundOptionArray,
  findOption: findOption,
  updateFlightDB: updateFlightDB,
  updateTripsDB: updateTripsDB
}