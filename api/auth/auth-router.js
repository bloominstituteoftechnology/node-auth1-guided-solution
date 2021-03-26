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
      res.status(201).json(saved);
    })
    .catch(next); // our custom err handling middleware in server.js will trap this
});

router.post('/login', (req, res, next) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        req.session.user = user; // this is the critical line. Session saved, cookie set on client
        res.status(200).json({
          message: `Welcome ${user.username}!, have a cookie!`,
        });
      } else {
        res.status(401).json({ message: 'Invalid Credentials' });
      }
    })
    .catch(next);
});

router.get('/logout', (req, res) => {
  if (req.session && req.session.user) {
    req.session.destroy(err => {
      if (err) {
        res.send(
          'you can checkout any time you like, but you can never leave....'
        );
      } else {
        res.send('bye, thanks for playing');
      }
    });
  } else {
    res.send('excuse me, do I know you?');
  }
});

module.exports = router;
