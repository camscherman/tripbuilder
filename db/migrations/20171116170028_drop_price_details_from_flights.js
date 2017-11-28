
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('flights', table =>{

      table.dropColumn('priceDetails')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('flights', (table)=>{
      
      table.json('priceDetails')

  })
};
