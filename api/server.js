const path = require('path')
const express = require('express')
const session = require('express-session')
const KnexSessionStore = require('connect-session-knex')(session)

const authRouter = require('./auth/auth-router.js')
const usersRouter = require('./users/users-router.js')

const server = express()

const sessionConfig = {
  name: 'monkey',
  secret: 'keep it secret, keep it safe!',
  cookie: {
    maxAge: 1000 * 60 * 60,
    secure: false, // if true the cookie is not set unless it's an https connection
    httpOnly: false, // if true the cookie is not accessible through document.cookie
  },
  rolling: true,
  resave: false, // some data stores need this set to true
  saveUninitialized: false, // privacy implications, if false no cookie is set on client unless the req.session is changed
  store: new KnexSessionStore({
    knex: require('../database/db-config.js'), // configured instance of knex
    tablename: 'sessions', // table that will store sessions inside the db, name it anything you want
    sidfieldname: 'sid', // column that will hold the session id, name it anything you want
    createtable: true, // if the table does not exist, it will create it automatically
    clearInterval: 1000 * 60 * 60, // time it takes to check for old sessions and remove them from the database to keep it clean and performant
  }),
}

server.use(express.static(path.join(__dirname, '../client')))
server.use(session(sessionConfig))
server.use(express.json())

server.use('/api/auth', authRouter)
server.use('/api/users', usersRouter)

server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'))
})

server.get('/hello', (req, res) => {
  // time allowing this can be used to discuss cookies
  if (req.headers.cookie) {
    res.send(`<h1>hello, friend</h1>`)
  } else {
    res.set('Set-Cookie', `friend=yes; Max-Age=100000;`)
    res.send(`<h1>This is the first time</h1>`)
  }
})

server.use('*', (req, res, next) => {
  next({ status: 404, message: 'Not found!' })
})

server.use((err, req, res, next) => { // eslint-disable-line
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack,
  })
})

module.exports = server
