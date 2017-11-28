const WelcomeController = {

  index(req,res, next ){
    console.log(req.params)
    debugger
    res.render('./index', {title: "Welcome"})
  }

}

module.exports = WelcomeController
