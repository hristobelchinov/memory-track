require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const expressLayouts = require("express-ejs-layouts"); 
const cookieParser = require("cookie-parser"); 
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');

const User = require('./Schemas/userSchema'); // require the User Schema
const {logger , accessCheckJWT, attachUser} = require('./middleware/middleware'); // require the middleware
require('./passportConfig'); // require the passport configuration

const app = express();
const PORT = process.env.PORT || 5000;

// # View Engine & Layouts & Public Folder - Setup
app.set('view engine', 'ejs'); // + npm i ejs
app.use(expressLayouts ); // express-ejs-layouts
app.use(express.static('public')); // static files ( CSS & JS )

// # Cookie & Json & UrlEncoded - Setup
app.use(cookieParser()); // cookies for JWT
app.use(express.json()); // json format responses
app.use(express.urlencoded({extended: true}));

// # Session & Passport - Setup
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// # Custom Middleware 
app.use(logger); // custom middleware
app.use(attachUser); // custom middleware

app.use(methodOverride('_method')); // Override method for http patch and delete

// # Routes - Setup
const AuthRouter = require('./Routes/authRouter'); // require Authentication Router 
const UserRouter = require('./Routes/userRouter'); // require User   Account Router 
// const PostRouter = require('./Routes/postRouter'); // require Post Account Router 
app.use('/auth', AuthRouter); // use the router
app.use('/user', UserRouter); // use the router
// app.use('/user', PostRouter); // use the router

// # MongoDB Connection
mongoose 
.connect(process.env.MONGODB_URI) // net start MongoDB
.then( () => console.log('Connection to DB: Esablished✅'))
.catch( (err) => console.error(`Connection to DB: Unsuccessful❌ : ${err}`));

// # Home Page
app.get('/', async(req, res) => {
    const {message} = req.cookies || null;
    res.status(200).render('home');
});

// # About Page 
app.get('/about', (req,res) => {
    res.render('about');
})

// # Listen on port
app.listen(PORT, () =>{
    console.log(`Listening on Port ${PORT}`);
});