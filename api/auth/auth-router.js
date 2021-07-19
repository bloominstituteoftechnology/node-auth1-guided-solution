const router = require('express').Router();
const bcrypt = require('bcryptjs');

const Users = require('../users/users-model.js');

// for endpoints beginning with /api/auth
router.post('/register', (req, res, next) => {
  let user = req.body;
  const hash = bcrypt.hashSync(user.password, 8); // 2 ^ n
  user.password = hash;

  Users.add(user)
    .then(saved => {
      res.status(201).json({
        message: `great to have you with us, ${saved.username}`
      });
    })
    .catch(next); // our custom err handling middleware will trap this
});

router.post('/login', (req, res, next) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = user; // this is the critical line. Session saved, cookie set on client
        res.status(200).json({
          message: `welcome back ${user.username}, have a cookie!`,
        });
      } else {
        res.status(401).json({ message: 'Invalid Credentials' });
      }
    })
    .catch(next);
});

router.get('/logout', (req, res) => {
  if (req.session && req.session.user) {
    const { username } = req.session.user
    req.session.destroy(err => {
      if (err) {
        res.json({
          message: `you can never leave, ${username}...`
        });
      } else {
        res.json({
          message: `bye ${username}, thanks for playing`
        });
      }
    });
  } else {
    res.json({
      message: `excuse me, do I know you?`
    });
  }
});

module.exports = router;
