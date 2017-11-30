const path = require('path')
const {Router} = require('express')
const QueryController = require('./controllers/query')
const WelcomeController = require('./controllers/welcome')
const UsersController = require('./controllers/users')
const TokensController = require('./controllers/tokens')


const root = Router()
const query = Router()
const users = Router()
const tokens = Router()
// const query = Router()

root.get('/', WelcomeController.index )

root.use('/query', query)
root.use('/users', users)
root.use('/tokens', tokens)

query.get('/', QueryController.index)
query.get('/show',QueryController.show )
query.get('/deals', QueryController.deals)


users.get('/', UsersController.new)
users.post('/', UsersController.create)
tokens.post('/', TokensController.create)



module.exports = root
