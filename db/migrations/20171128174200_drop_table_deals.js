
exports.up = function(knex, Promise) {
  return knex.schema.dropTable('deals')
};

exports.down = function(knex, Promise) {

};
