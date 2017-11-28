
exports.up = function(knex, Promise) {
    return knex.schema.createTable('prices', table =>{
        table.increments('id')
        table.string('depCode')
        table.string('arrCode')
        table.string('flightId').references('flights.segmentId').onDelete('SET NULL')
        table.float('price')
    })
  
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('prices')
};
