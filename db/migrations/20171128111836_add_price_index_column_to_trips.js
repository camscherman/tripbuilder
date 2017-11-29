
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('trips', table =>{
    table.float('priceIndex')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('trips', table =>{
    table.dropColumn('priceIndex')
  })
};
