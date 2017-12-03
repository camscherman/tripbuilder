const fpRequest = require('../lib/api_oneway')
const R = require('ramda')
const airlines = require('airline-codes')
const airports = require('airport-codes')
const {addDeals, getDeals, updateDatabase} = require('../lib/dbUtils')
const formatDate = require('../lib/formatDate')


const QueryController = {

  async index (req,res,next){

    const {depCode, arrCode} = req.query
    const response = await fpRequest.bestTwoWayFlight(depCode, arrCode)

    let easyResponses = []
    if(response.length >= 1) {

      easyResponses = R.map((res)=>{if(R.path(['FlightResponse','ErrorReport'],res)){
      return {
      CntKey: R.path(['price', 'CntKey'], res),
      CntId: R.path(['price','CntId'], res),
      price: R.path(['price','adultPrice'], res),
      noOfOutBoundLegs: res.outBoundDetails && res.outBoundDetails.length,
      outBoundDepDateTime: res.outBoundDetails && formatDate(res.outBoundDetails[0].DepartureDateTime),
      outBoundArrDateTime: res.outBoundDetails && formatDate(res.outBoundDetails[res.outBoundDetails.length -1].ArrivalDateTime),
      operatedByAirlineOutbound: res.outBoundDetails && res.outBoundDetails[0].MarketingAirline.Code,
      noOfInBoundLegs :res.inBoundDetails && res.inBoundDetails.length,
      inBoundDepDateTime: res.inBoundDetails && formatDate(res.inBoundDetails[0].DepartureDateTime),
      inBoundArrDateTime: res.inBoundDetails && formatDate(res.inBoundDetails[res.inBoundDetails.length -1].ArrivalDateTime),
      operatedByAirlineInbound: res.inBoundDetails && res.inBoundDetails[0].MarketingAirline.Code
    }

    }}, response)
    easyResponses = easyResponses.filter((res)=> !!res )

    res.json(easyResponses)
  } else {
    res.json({error: "We don't have enough data on this route. Please check back in a few minutes and we'll do some research"})
  }
    await updateDatabase(depCode, arrCode)
    if(!!easyResponses){
    await addDeals(easyResponses, depCode, arrCode)
  }
  },

  async deals(req, res, next){
    const {depCode, arrCode} = req.query
    const response = await getDeals(depCode, arrCode)
    if(response.length > 0){
      res.json(response)
    } else {
      res.json({error: "We don't have enough data on this route. We're running the search now. Please be patient!"})
    }
  },

  async show(req, res, next){
    const {depCode, arrCode} = req.query
    const allDates = await fpRequest.indexOneWayValue(depCode, arrCode)

    res.json(allDates)
  },

  async allRoutes(req, res, next){

    const response = await fpRequest.findBestDealsOnAllRoutes()
    res.json(response)
  }
}

module.exports = QueryController
