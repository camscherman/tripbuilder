
exports.up = function(knex, Promise) {
  return knex.schema.createTable('deals', table =>{
    table.increments('id'),
    table.string('depCode'),
    table.string('arrCode'),
    table.float('price'),
    table.datetime('outBoundDepDateTime'),
    table.datetime('outBoundArrDateTime'),
    table.string('operatedByAirlineOutbound'),
    table.integer('noOfOutBoundLegs'),
    table.datetime('inBoundDepDateTime'),
    table.datetime('inBoundArrDateTime'),
    table.string('operatedByAirlineInbound'),
    table.integer('noOfInBoundLegs')


  })
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('deals')
};

// price: R.path(['price','adultPrice'], res),
// noOfOutBoundLegs: res.outBoundDetails.length,
// outBoundDepDateTime: res.outBoundDetails[0].DepartureDateTime,
// outBoundArrDateTime: res.outBoundDetails[res.outBoundDetails.length -1].ArrivalDateTime,
// operatedByAirlineOutbound: res.outBoundDetails[0].MarketingAirline.Code,
// noOfInBoundLegs : res.inBoundDetails.length,
// inBoundDepDateTime: res.inBoundDetails[0].DepartureDateTime,
// inBoundArrDateTime: res.inBoundDetails[res.inBoundDetails.length -1].ArrivalDateTime,
// operatedByAirlineInbound: res.inBoundDetails[0].MarketingAirline.Code
