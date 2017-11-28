
exports.up = function(knex, Promise) {
  return knex.schema.createTable('trips', table =>{
    table.increments('id')
    table.string('depCode')
    table.string('arrCode')
    table.string('outBoundId').references('flights.segmentId')
    table.string('inBoundId')
    table.float('price')
    table.boolean('isTwoWay')
  })

};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('trips')
};
