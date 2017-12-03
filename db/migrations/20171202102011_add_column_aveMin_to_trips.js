
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('trips', table=>{
    table.float('aveMin')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('trips', table=>{
    table.dropColumn('aveMin')
  })
};
