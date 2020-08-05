const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const { User } = require('./models/user');


// strategy for get requests -- VERY GOOD
passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: process.env.USER_JWT_KEY
}, async (payload, done) => {
    try {

        const checkUser = await User.findById(payload.sub);
        if (!checkUser) {
            return done(null, false);
        } 
        
        done(null, checkUser);
        
    } catch(error) {
        done(error, false);
    }
}));

passport.use('local-verification', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authentification'),
    secretOrKey: process.env.USER_JWT_KEY
}, async(payload, done) => {
    try {
        const checkUser = await User.findById(payload.sub);
        if (!checkUser) {
            return done('Email verification failed, your data could not be found in the database.', false);
        }

        if (checkUser.local.isVerified) {
            return done('Email is already verified!', false);
        }
        done(null, checkUser);
    } catch(error) {
        done(error, false)
    }
}))

// LOCAL SIGN IN STRATEGY
passport.use('local', new passportLocal({
    usernameField: 'email'
}, async(email, password, done) => {
    try {
        console.log('made it here');
        console.log(email);
        const checkUser = await User.findOne({ 'local.email': email});
        if (!checkUser) {
            return done('Email does not exist!', false);
        }
        if (!checkUser.local.isVerified) {
            return done('The account was not verified!', false);
        }
    
        const checkUserPassword = await checkUser.isValidPassword(password);
        if (!checkUserPassword) {
            return done('Password is not valid!', false);
        }
    
        done(null, checkUser);
    } catch(error) {
        done(error, false);
    }
}));

passport.use('profileImageUpload', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: process.env.USER_JWT_KEY
}, async(payload, done) => {
    try {
        const checkUser = await User.findById(payload.sub);
        if (!checkUser) {
            return done('Email not found!', false);
        }
        done(null, checkUser);
    } catch(error) {
        done(error, false);
    }
}))

