const kx = require('../db/connection')
const Promise = require('bluebird')
const dataParser = require('./explore_response')
const {sixMonthRequest} = require('./api_oneway')
const moment = require('moment')

function addDeals(easyResponses, depCode, arrCode){
  if(easyResponses.length > 0){
  Promise.map(easyResponses,item=>{
  const {price,
    noOfOutBoundLegs,
    outBoundDepDateTime,
    outBoundArrDateTime,
    operatedByAirlineOutbound,
    noOfInBoundLegs,
    inBoundDepDateTime,
    inBoundArrDateTime,
    operatedByAirlineInbound,
     CntKey,
      CntId } = item

  const params ={
    CntKey: CntKey,
    CntId: CntId,
    price: price,
    depCode: depCode,
    arrCode: arrCode,
    noOfOutBoundLegs: noOfOutBoundLegs,
    outBoundDepDateTime: outBoundDepDateTime,
    outBoundArrDateTime: outBoundArrDateTime,
    operatedByAirlineOutbound: operatedByAirlineOutbound,
    noOfInBoundLegs: noOfInBoundLegs,
    inBoundDepDateTime: inBoundDepDateTime,
    inBoundArrDateTime: inBoundArrDateTime,
    operatedByAirlineInbound: operatedByAirlineInbound

  }
  if(!!CntKey && !!CntId){
  return kx.first('*').from('deals')
      .where({CntKey: CntKey, CntId: CntId}).then(res =>{
        if(res === undefined){
          return kx.insert(params)
          .into('deals')

        } else{
          return kx('deals').update(params)
                            .where({CntKey: CntKey, CntId: CntId})
        }
      })} else {
        return {error: "Empty flight data. Nothing to update"}
      }


}).then(res=> console.log(res))
}
}
// price: R.path(['price','adultPrice'], res),
// noOfOutBoundLegs: res.outBoundDetails.length,
// outBoundDepDateTime: res.outBoundDetails[0].DepartureDateTime,
// outBoundArrDateTime: res.outBoundDetails[res.outBoundDetails.length -1].ArrivalDateTime,
// operatedByAirlineOutbound: res.outBoundDetails[0].MarketingAirline.Code,
// noOfInBoundLegs : res.inBoundDetails.length,
// inBoundDepDateTime: res.inBoundDetails[0].DepartureDateTime,
// inBoundArrDateTime: res.inBoundDetails[res.inBoundDetails.length -1].ArrivalDateTime,
// operatedByAirlineInbound: res.inBoundDetails[0].MarketingAirline.Code

function getDeals(depCode, arrCode){
  return kx.select('*').from('deals')
        .where({depCode: depCode, arrCode: arrCode})
        .orderBy('price', 'asc')
}

function updateDatabase(depCode, arrCode){
   console.log('==================INSIDE updateDatabase+++++++++++++++++++')
    return kx.first('updated_at').from('trips')
      .where({depCode: depCode, arrCode: arrCode})
      .then(res=>{
        console.log(res)
        if(res=== undefined){
          sixMonthRequest(depCode, arrCode)
                  .then(()=> dataParser.parseRawDataToDB())
        } else{
          const updatedAt = new Date(res.updated_at)
          const now = new Date()

          if(updatedAt < moment(now).subtract(15, 'days')){
            sixMonthRequest(depCode, arrCode)
                    .then(()=> dataParser.parseRawDataToDB())
          } else {
            console.log('Passed conditions in updateDatabase')
          }
        }
      })
}





module.exports = {
  addDeals: addDeals,
  getDeals: getDeals,
  updateDatabase: updateDatabase
}
