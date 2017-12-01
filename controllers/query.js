const fpRequest = require('../lib/api_oneway')
const R = require('ramda')
const airlines = require('airline-codes')
const airports = require('airport-codes')
const {addDeals, getDeals, updateDatabase} = require('../lib/dbUtils')


const QueryController = {

  async index (req,res,next){

    const {depCode, arrCode} = req.query
    const response = await fpRequest.bestTwoWayFlight(depCode, arrCode)
    if(response.length > 1) {
    const easyResponses = R.map((res)=>{return {
      CntKey: R.path(['price', 'CntKey'], res),
      CntId: R.path(['price','CntId'], res),
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
  } else {
    res.json({error:  'No In our system'})
  }
    await updateDatabase(depCode, arrCode)
    await addDeals(easyResponses, depCode, arrCode)
  },

  async deals(req, res, next){
    const {depCode, arrCode} = req.query
    const response = await getDeals(depCode, arrCode)
    if(response.length > 0){
      res.json(response)
    } else {
      res.json({error: "We don't have enough data"})
    }
  },

  async show(req, res, next){
    const {depCode, arrCode} = req.query
    const allDates = await fpRequest.indexOneWayValue(depCode, arrCode)
    res.json(allDates)
  }
}

module.exports = QueryController
