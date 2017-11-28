
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('flights', table=>{
          table.dropColumn('price')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('flights', table=>{
        table.dropColumn('price')
  })
};
