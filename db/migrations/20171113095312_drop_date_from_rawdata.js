
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('rawdata', table =>{
      table.dropColumn('date')
  })
};

exports.down = function(knex, Promise) {
    return knex.schema.alterTable('rawdata', table=>{
        table.addColumn('date')
    })
};
