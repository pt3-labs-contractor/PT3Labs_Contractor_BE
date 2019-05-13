const express = require('express')
const server = express()
const passport = require('passport')

const GoogleStrategy = require('passport-google-oauth20').Strategy // .Strategy??
const HaveACookie = require('express-session')

// give me a cookie baby
server.use(
	HaveACookie({
		name: 'notsession', // default is connect.sid
		secret: 'when life gives you lemon, have a cookie',
		cookie: {
			maxAge: 1 * 1 * 60 * 60 * 1000, //session for 1 hour in millisecond
			secure: true // only set cookies over https. Server will not send back a cookie over http.
		}, // 1 day in milliseconds
		httpOnly: true, // don't let JS code access cookies. Browser extensions run JS code on your browser!
		resave: false,
		saveUninitialized: false
	})
)

server.use(passport.initialize()) // initialize passport
//server.use(passport.session()) // persist login sessions
// Configure view engine to render EJS templates.
// Configure view engine to render EJS templates.
server.set('views', __dirname + '/views')
server.set('view engine', 'ejs')

// Google Strategy

passport.use(
	new GoogleStrategy(
		{
			clientID:
				'638199845142-pll5b3gadnre2abn6415qqsabjdag7m6.apps.googleusercontent.com', // your client id here
			clientSecret: '-7eRhUgTXc-fAZRfU0i6IBPV', // your client secret here
			callbackURL: 'http://localhost:5000/auth/google/callback'
		},
		(accessToken, refreshToken, profile, done) => {
			done(null, profile) // passes the profile data to serializeUser
		}
	)
)

// Used to stuff a piece of information into a cookie
passport.serializeUser((user, done) => {
	done(null, user)
})

// Used to decode the received cookie and persist session
passport.deserializeUser((user, done) => {
	done(null, user)
})

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
	passport.authenticate('google', {
		scope: ['profile'] // Used to specify the required data
	})
)

// The middleware receives the data from Google and runs the function on Strategy config
server.get(
	'/auth/google/callback',
	passport.authenticate('google'),
	(req, res) => {
		res.redirect('/secret')
	}
)

// Secret endpoint
server.get('/secret', isUserAuthenticated, (req, res) => {
	res.send('You have reached the secret route')
})

// Logout endpoint
server.get('/logout', (req, res) => {
	req.logout()
	res.redirect('/')
})

server.listen(5000, console.log('Server is running on port 5000'))
