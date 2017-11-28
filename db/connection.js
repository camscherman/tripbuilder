const knexConfig = require('../knexfile')[process.env.NODE_ENV || 'development']
const kx = require('knex')(knexConfig)

kx.on('query', query => {
   console.log(query.sql, query.bindings)
})

module.exports = kx