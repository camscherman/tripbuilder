
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('deals', table =>{
    table.string('CntKey'),
    table.string('CntId')
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('deals', table=>{
    table.dropColumn('CntKey'),
    table.dropColumn('CntId')
  })
};
