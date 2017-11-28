
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('flights', (table)=>{
      table.json('fullDetails')
      table.json('priceDetails')
      table.string('segmentId').unique()
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('flights', table =>{
      table.dropColumn('fullDetails')
      table.dropColumn('priceDetails')
  })
};
