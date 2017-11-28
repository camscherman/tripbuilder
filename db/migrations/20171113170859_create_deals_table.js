
exports.up = function(knex, Promise) {
  return knex.schema.createTable('deals', table=>{
      table.increments('id')
      table.string('departure')
      table.dateTime('outBoundLeavesAt')
      table.string('arrival')
      table.dateTime('outBoundArrivesAt')
      table.dateTime('inBoundLeavesAt')
      table.dateTime('inBoundArrivesAt')
      table.float('price')
      table.json('fullDetails')
      table.json('priceDetails')
      table.string('outBoundSegmentId').references('flights.segmentId')
      table.string('inBoundSegmentId')
      table.timestamps(false, true)
      
  })
};

exports.down = function(knex, Promise) {
  
};
