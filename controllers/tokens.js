const kx = require('../db/connection')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const secret = require('../lib/secret.js')

const TokensController = {
  async create (req,res,next){
    const {email, password} = req.body
    console.log("Here")
    try {
      const user = await kx.first().from('users')
                          .where({email})

      if(user && await bcrypt.compare(password, user.passwordDigest)){
          const payload = {
            exp: Math.floor(Date.now() / 1000) + (60 * 60*24),
            email: user.email
          }
          token = jwt.sign(payload, secret)
          res.json({jwt: token})

      } else {
        res.json({error: "Something went wrong"})
      }
    } catch (error){
      next(error)
    }
  }
}

module.exports = TokensController
