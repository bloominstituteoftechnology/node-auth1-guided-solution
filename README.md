# Node Aut 1 Guided Project

Guided project solution for **Node Auth 1** Module.

## Prerequisites

- [SQLite Studio](https://sqlitestudio.pl/index.rvt?act=download) installed.

## Starter Code

The [Starter Code](https://github.com/LambdaSchool/node-auth1-guided) for this project is configured to run the server by typing `yarn server` or `npm run server`. The server will restart automatically on changes.

## How to Contribute

- clone the [starter code](https://github.com/LambdaSchool/node-auth1-guided).
- create a solution branch: `git checkout -b solution`.
- add this repository as a remote: `git remote add solution https://github.com/LambdaSchool/node-auth1-guided-solution`
- pull from this repository's `master` branch into the `solution` branch in your local folder `git pull solution master:solution --force`.

A this point you should have a `master` branch pointing to the student's repository and a `solution` branch with the latest changes added to the solution repository.

When making changes to the `solution` branch, commit the changes and type `git push solution solution:master` to push them to this repository.

When making changes to the `master` branch, commit the changes and use `git push origin master` to push them to the student's repository.

## Objectives

- implement secure password storage.
- implement authentication use sessions and cookies.
- use sessions to protect access to resources.
- use a database to store sessions.

## Introduce Module Challenge

## Introduce Authentication and Authorization

Open TK and provide an introduction to `Authentication` and `Authorization` and highlight the difference.

Cover things to consider when storing passwords.

- `hashing` vs `encryptiion`.

## Hash User Passwords

- introduce the library we'll use to hash passwords.
- add [bcryptjs](https://www.npmjs.com/package/bcryptjs) to the project.
- require `bcryptjs` at the top of `index.js`.

```js
// .. other requires
const cors = require("cors");
const bcrypt = require("bcryptjs");
```

- change the `POST /api/register` to this:

```js
server.post("/api/register", (req, res) => {
  let user = req.body;
  // generate hash from user's password
  // we'll do it synchronously, no sense on going async for this
  const hash = bcrypt.hashSync(user.password, 10); // 2 to the 10th rounds

  // override user.password with hash
  user.password = hash;

  Users.add(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(error => {
      res.status(500).json(error);
    });
});
```

- call attention to the time it takes to register a user
- make a POST to `/api/register` with

```json
{
  "username": "frodo",
  "password": "pass"
}
```

- change the number of rounds to 16: `const hash = bcrypt.hashSync(user.password, 16);`
- make a POST to `/api/register` for _merry/pass_, note how much longer it takes now. That is how we add time to slow down attackers trying to pre-generate hashes.
- change it down to 8 to make it fast for the demo.
- explain that the resulting hash includes the number of rounds used to generate the hash.
- make a GET to `/api/users` and note that the hashes are different, even for the same password. The library takes care of that by adding a random string to the password before hashing. That random string is often called a `salt`.

**wait for students to catch up, use a `yes/no` poll to let students tell you when they are done**

## Validate Credentials on Login

- change the login to check the password.
- explain that the library will first hash the password guess and then compare the newly generated hash against the hash stored for the user in the database. It's magic!

```js
server.post("/api/login", (req, res) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      // update the if condition to check that passwords match
      if (user && bcrypt.compareSync(password, user.password)) {
        res.status(200).json({ message: `Welcome ${user.username}!` });
      } else {
        // we will return 401 if the password or username are invalid
        // we don't want to let attackers know when they have a good username
        res.status(401).json({ message: "Invalid Credentials" });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});
```

Test it using valid and invalid credentials.

**wait for students to catch up, use a `yes/no` poll to let students tell you when they are done**

We don't have a way for the server to _"remember"_ that the user is logged in.

## Introduce Sessions and Cookies

Open TK and introduce students to `sessions` and `cookies` and how they help us keep user's logged in across requests.

Take time to walk through the authentication workflow when using `sessions`.

Cover the different ways of storing sessions, including the pros and cons of each.

## Uses Sessions for Login

- add `express-session` to the project and require it at the top of `server.js`.
- configure and use `express-session` globally inside `server.js`.

```js
// other code unchanged
const server = express();

// this object holds the configuration for the session
const sessionConfig = {
  name: "monkey", // the default would be sid, but that would reveal our stack
  secret: "keep it secret, keep it safe!", // to encrypt/decrypt the cookie
  cookie: {
    maxAge: 1000 * 60 * 60, // how long is the session valid for, in milliseconds
    secure: false, // used over https only, should be true in production
    httpOnly: true, // cannot access the cookie from JS using document.cookie
    // keep this true unless there is a good reason to let JS access the cookie
  },
  resave: false, // keep it false to avoid recreating sessions that have not changed
  saveUninitialized: false, // GDPR laws against setting cookies automatically
};

// other middleware here
server.use(session(sessionConfig));
// endpoints below
```

Show the [documentation for the library on npmjs.org](https://www.npmjs.com/package/express-session) for different configuration options.

Session support is configured, let's use it to store user information. Change the `/login` endpoint inside `auth-router.js` to read:

```js
router.post("/login", (req, res) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        // req.session is an object added by the session middleware
        // we can store information inside req.session
        // req.session is available on every request done by the same client
        // as long as the session has not expired
        req.session.user = user;
        res.status(200).json({
          // the cookie will be sent automatically by the library
          message: `Welcome ${user.username}!, have a cookie!`,
        });
      } else {
        res.status(401).json({ message: "Invalid Credentials" });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});
```

- login using valid credentials.
- show the cookie in the cookies tab in Postman
- make a GET to `/api/users`. You're not logged in, because the server restarted and the session information is stored in memory.
- login again and then visit `/api/users`, should see the list of users.

**wait for students to catch up**

### You Do (estimated 10 minutes to complete)

Ask students to protect the `/api/users` endpoint so only authenticated users can access it.

Possible solution would be to write middleware:

```js
// this is all the content in the file, no need for bcrypt or Users anymore
module.exports = (req, res, next) => {
  // if the client is logged in, req.session.user will be set
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: "You shall not pass!" });
  }
};

// we can use it locally
server.get('/api/users', restricted, (req, res) => { //.. endpoint unchanged }
```

**wait for students to catch up, use a `yes/no` poll to let students tell you when they are done**

## Implement Logout

Add the following endpoint to `auth-router.js`.

```js
router.get("/logout", (req, res) => {
  if (req.session) {
    // the library exposes the destroy method that will remove the session for the client
    req.session.destroy(err => {
      if (err) {
        res.send(
          "you can checkout any time you like, but you can never leave...."
        );
      } else {
        res.send("bye, thanks for playing");
      }
    });
  } else {
    // if there is no session, just end the request or send a response
    // we chose to just end the request for the example
    res.end();
  }
});
```

- login again
- make a GET to `/api/users`
- make a GET to `/api/auth/logout`
- make a GET to `/api/users`, we're logged out!

On logout, the server will void the session, so even if a client had held on to the cookie and send it again, the server will not let them through because the session associated with the cookie is no longer valid.

**wait for students to catch up**

- login
- stop the server
- start the server
- make a GET to `/api/users`, we're not logged in! Bad panda.

We will store session information in the database, that way if the server is restarted logged in users will not need to login again.

## Store Sessions in a Database

- introduce [the library used to connect knex to express-session](https://www.npmjs.com/package/connect-session-knex).
- require it after `express-session`.

```js
const session = require("express-session");
const KnexSessionStore = require("connect-session-knex")(session);
// alternatively: const KnexSessionStore = require('connect-session-knex');
// and then KnexSessionStore(session);
```

- change the session configuration object to use a database to store session information

```js
const sessionConfig = {
  name: "monkey",
  secret: "keep it secret, keep it safe!",
  cookie: {
    maxAge: 1000 * 60 * 60, // in ms
    secure: false, // used over https only
  },
  httpOnly: true, // cannot access the cookie from js using document.cookie
  resave: false,
  saveUninitialized: false, // GDPR laws against setting cookies automatically

  // we add this to configure the way sessions are stored
  store: new KnexSessionStore({
    knex: require("../database/dbConfig.js"), // configured instance of knex
    tablename: "sessions", // table that will store sessions inside the db, name it anything you want
    sidfieldname: "sid", // column that will hold the session id, name it anything you want
    createtable: true, // if the table does not exist, it will create it automatically
    clearInterval: 1000 * 60 * 60, // time it takes to check for old sessions and remove them from the database to keep it clean and performant
  }),
};
```

- login
- stop the server
- start the server
- make a GET to `/api/users`, we're still logged in!
