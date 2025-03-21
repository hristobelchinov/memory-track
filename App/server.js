require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const expressLayouts = require("express-ejs-layouts"); 
const cookieParser = require("cookie-parser"); 
const session = require('express-session');
const passport = require('passport');
const methodOverride = require('method-override');

const User = require('./Schemas/userSchema');
const {logger, attachUser} = require('./middleware/middleware');
const { fetchUserAndPosts } = require('./Utils/utils');
const { verifyJWT } = require('./JWT/jwtUtils');
require('./passportConfig');

const app = express();
const PORT = process.env.PORT || 5000;

// View engine, layouts, public setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));

// Parsers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Session & Passport setup
app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Method override
app.use(methodOverride('_method'));

// Custom middleware
app.use(logger);
app.use(attachUser);


// Routes
const AuthRouter = require('./Routes/authRouter');
const UserRouter = require('./Routes/userRouter');
app.use('/auth', AuthRouter);
app.use('/user', UserRouter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connection to DB: Established✅'))
.catch((err) => console.error(`Connection to DB: Unsuccessful❌ : ${err}`));

// Home Page route (Correct use of fetchUserAndPosts)
app.get('/', async (req, res) => {
    const { message } = req.cookies || null;

    const token = req.cookies.jwt;
    
const decoded = verifyJWT(token);
    // req.user = decoded;

    // const id = req.user.id;

    // const { currentUser, posts, error } = await fetchUserAndPosts(id);


    // // ✅ ADDED: Print posts clearly for debugging
    // console.log("Fetched posts for user:", posts);

    res.status(200).render('home'); // { currentUser, posts, message }
});


// About Page
app.get('/about', (req,res) => {
    res.render('about');
});

// Listen on port
app.listen(PORT, () =>{
    console.log(`Listening on Port ${PORT}`);
});
