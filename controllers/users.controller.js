module.exports.profile = (req, res, next) => {
    console.log(req.user)
    res.render('profile')
  }