
exports.up = function(knex, Promise) {
    return knex.schema.createTable('flights', table => {
        table.increments('id')
        table.string('departure')
        table.dateTime('dep-time')
        table.string('arrival')
        table.dateTime('arr-time')
        table.float('price')
        table.timestamps(false, true)

    })
  
};



exports.down = function(knex, Promise) {
  return knex.schema.dropTable('flights')
};
