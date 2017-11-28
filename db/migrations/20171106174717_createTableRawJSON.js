
exports.up = function(knex, Promise) {
    return knex.schema.createTable('rawdata', table =>{
        table.increments('id')
        table.string('date')
        table.json('fpdata')
    })
  
};

exports.down = function(knex, Promise) {
    return knew.schema.dropTable('rawdata')
};
