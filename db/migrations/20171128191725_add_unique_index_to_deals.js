
exports.up = function(knex, Promise) {
  return knex.schema.alterTable('deals', t=>{
    t.index(['CntKey', 'CntId'])
  })
};

exports.down = function(knex, Promise) {
  return knex.schema.alterTable('deals', t=>{
    t.index(['CntKey', 'CntId'])
  })
};
