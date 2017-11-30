
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('trips', table=>{
    table.timestamps(false, true)
  })

};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('trips', table=>{
    table.dropColumn('created_at')
    table.dropColumn('updated_at')
  })
};
