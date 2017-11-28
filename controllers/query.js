const fpRequest = require('../lib/api_oneway')
const R = require('ramda')
const airlines = require('airline-codes')
const airports = require('airport-codes')
const QueryController = {

  async index (req,res,next){

    debugger
    const {depCode, arrCode} = req.query
    const response = await fpRequest.bestTwoWayFlight(depCode, arrCode)
    const easyResponses = R.map((res)=>{return {
      price: R.path(['price','adultPrice'], res),
      noOfOutBoundLegs: res.outBoundDetails.length,
      outBoundDepDateTime: res.outBoundDetails[0].DepartureDateTime,
      outBoundArrDateTime: res.outBoundDetails[res.outBoundDetails.length -1].ArrivalDateTime,
      operatedByAirlineOutbound: res.outBoundDetails[0].MarketingAirline.Code,
      noOfInBoundLegs : res.inBoundDetails.length,
      inBoundDepDateTime: res.inBoundDetails[0].DepartureDateTime,
      inBoundArrDateTime: res.inBoundDetails[res.inBoundDetails.length -1].ArrivalDateTime,
      operatedByAirlineInbound: res.inBoundDetails[0].MarketingAirline.Code


    }}, response)    

    res.json(easyResponses)
  }
}

module.exports = QueryController
