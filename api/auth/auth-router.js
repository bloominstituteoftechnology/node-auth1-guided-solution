const router = require('express').Router()
const bcrypt = require('bcryptjs')

const Users = require('../users/users-model.js')

// for endpoints beginning with /api/auth
router.post('/register', (req, res, next) => {
  let user = req.body
  const hash = bcrypt.hashSync(user.password, 8) // 2 ^ n
  user.password = hash

  Users.add(user)
    .then(saved => {
      res.status(201).json({
        message: `Great to have you with us, ${saved.username}`
      })
    })
    .catch(next) // our custom err handling middleware will trap this
})

router.post('/login', (req, res, next) => {
  let { username, password } = req.body

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        // this is the critical line. Session saved, cookie set on client:
        req.session.user = user
        res.status(200).json({
          message: `Welcome back ${user.username}, have a cookie!`,
        })
      } else {
        next({ status: 401, message: 'Invalid Credentials' })
      }
    })
    .catch(next)
})

router.get('/logout', (req, res) => {
  if (req.session.user) {
    const { username } = req.session.user
    req.session.destroy(err => {
      if (err) {
        res.json({ message: `You can never leave, ${username}...` })
      } else {
        res.json({ message: `Bye ${username}, thanks for playing` })
      }
    })
  } else {
    res.json({ message: 'Excuse me, do I know you?' })
  }
})

module.exports = router
