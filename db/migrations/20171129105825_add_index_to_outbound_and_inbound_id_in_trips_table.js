
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('trips', table=>{
    table.index(['outBoundId','inBoundId'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('trips', table=>{
    table.dropIndex(['outBoundId', 'inBoundId'])
  })
};
