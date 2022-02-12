const mongoose = require('mongoose');
const passport = require('passport');
const User = require('../models/User.model');
const mailer = require('../config/mailer.config');


module.exports.register = (req, res, next) => {
  res.render('auth/register')
}

module.exports.login = (req, res, next) => {
  res.render('auth/login')
}

module.exports.doRegister = (req, res, next) => {
  const user = req.body;

  // { email: 'Already in use' }
  const renderWithErrors = (errors) => {
    res.render('auth/register', { errors, user })
  }

  User.findOne({ email: user.email })
    .then((userFound) => {
      if (userFound) {
        renderWithErrors({ email: 'Email already in use' })
      } else {
        if (req.file) {
          user.image = req.file.path
        }
        return User.create(user)
          .then((createdUser) => {
            mailer.sendActivationEmail(createdUser.email, createdUser.activationToken)
            res.redirect('/login')
          })

      }
    })
    .catch(err => {
      if (err instanceof mongoose.Error.ValidationError) {
        renderWithErrors(err.errors)
      } else {
        next(err)
      }
    })
}

const doLogin = (req, res, next, provider = 'local-auth') => {
  passport.authenticate(provider, (err, user, validations) => {
    if (err) {
      next(err)
    } else if(!user) {
      res.status(404).render('auth/login', { errorMessage: validations.error })
    } else {
      req.login(user, (loginError) => {
        console.log({user});
        if (loginError) {
          next(loginError)
        } else {
          req.flash('flashMessage', 'You have succesfully signed in')
          res.redirect('/profile')
        }
      })
    }
  })(req, res, next)
}

module.exports.doLogin = (req, res, next) => {
  doLogin(req, res, next)
}

module.exports.doLoginGoogle = (req, res, next) => {
  doLogin(req, res, next, 'google-auth')
}

module.exports.logout = (req, res, next) => {
  req.logout();
  res.redirect('/login');
}

module.exports.activate = (req, res, next) => {
  const activationToken = req.params.token;

  User.findOneAndUpdate(
    { activationToken, active: false },
    { active: true }
  )
    .then(() => {
      req.flash('flashMessage', 'You have activated your account. Welcome!')
      res.redirect('/login')
    })
    .catch(err => next(err))
}

/* currentUser: Passport inyecta la info del usuario al iniciar sesion
El res.locals sirve para meter propiedades y se hace como res.locals.currentUser, no se instancia por tanto una constante con 
currenUser sino que es el método en si el que  */

