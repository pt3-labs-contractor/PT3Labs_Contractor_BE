require('dotenv').config()
const express = require('express')

const passport = require('passport')
const haveACookie = require('express-session')
const GoogleStrategy = require('passport-google-oauth20').Strategy

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: 'http://localhost:5000/auth/google/callback'
		},
		function(accessToken, refreshToken, profile, cb) {
			return cb(null, profile)
		}
	)
)

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialize
passport.serializeUser(function(user, cb) {
	cb(null, user)
})

passport.deserializeUser(function(obj, cb) {
	cb(null, obj)
})

const server = express()
// Configure view engine to render EJS templates.
server.set('views', __dirname + '/views')
server.set('view engine', 'ejs')

server.use(require('morgan')('combined'))
server.use(require('cookie-parser')())
server.use(require('body-parser').urlencoded({ extended: true }))
server.use(
	require('express-session')({
		secret: 'keyboard cat',
		resave: true,
		saveUninitialized: true
	})
)

// Initialize Passport and restore authentication state, if any, from the
// session.
server.use(passport.initialize()) // initialize passport
server.use(passport.session()) // persist login sessions

// // give me a cookie baby
// server.use(
// 	haveACookie({
// 		name: 'notsession', // default is connect.sid
// 		secret: 'when life gives you lemon, have a cookie',
// 		cookie: {
// 			maxAge: 1 * 1 * 60 * 60 * 1000, //session for 1 hour in millisecond
// 			secure: true // only set cookies over https. Server will not send back a cookie over http.
// 		}, // 1 day in milliseconds
// 		httpOnly: true, // don't let JS code access cookies. Browser extensions run JS code on your browser!
// 		resave: false,
// 		saveUninitialized: false
// 	})
// )

// Define routes.
// server.get('/', function(req, res) {
// 	res.render('home', { user: req.user })
// })

// server.get('/login', function(req, res) {
// 	res.render('login')
// })

// server.get(
// 	'/login/google',
// 	passport.authenticate('google', { scope: ['profile'] })
// )

// server.get(
// 	'/return',
// 	passport.authenticate('google', { failureRedirect: '/' }),
// 	function(req, res) {
// 		res.redirect('/')
// 	}
// )

// server.get(
// 	'/profile',
// 	require('connect-ensure-login').ensureLoggedIn(),
// 	function(req, res) {
// 		res.render('profile', { user: req.user })
// 	}
// )

// Used to stuff a piece of information into a cookie
// passport.serializeUser((user, done) => {
// 	done(null, user)
// })

// Used to decode the received cookie and persist session
// passport.deserializeUser((user, done) => {
// 	done(null, user)
// })

// Middleware to check if the user is authenticated
function isUserAuthenticated(req, res, next) {
	if (req.user) {
		next()
	} else {
		res.send('not authorized, please log in now!')
	}
}

// end points
server.get('/', (req, res) => {
	res.render('index.ejs')
})

// passport.authenticate(middleware), specifying 'google' strategy for the requests
server.get(
	'/auth/google',
	passport.authenticate(
		'google',
		{ scope: ['profile'] } // Used to specify the required data
	)
)

// The middleware receives the data from Google and runs the function on Strategy config
server.get(
	'/auth/google/callback',
	passport.authenticate('google'),
	(req, res) => {
		res.redirect('/') // successful authentication, redirect home
	}
)

//Secret endpoint
server.get('/secret', isUserAuthenticated, (req, res) => {
	res.send('You have reached the secret route')
})

// Logout endpoint
server.get('/logout', (req, res) => {
	req.logout()
	res.redirect('/')
})

server.listen(process.env['PORT'] || 5000)

// server.listen(5000, console.log('Server is running on port 5000'))
