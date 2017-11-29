const kx = require('../db/connection')
const Promise = require('bluebird')

function addDeals(easyResponses, depCode, arrCode){
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
  return kx.first('*').from('deals')
      .where({CntKey: CntKey, CntId: CntId}).then(res =>{
        if(res === undefined){
          return kx.insert(params)
          .into('deals')

        } else{
          return kx('deals').update(params)
                            .where({CntKey: CntKey, CntId: CntId})
        }
      })


}).then(res=> console.log(res))
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


module.exports = {
  addDeals: addDeals
}
