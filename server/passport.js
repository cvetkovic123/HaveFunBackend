const passport = require('passport');
const passportLocal = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const googleStrategy = require('passport-google-oauth20').Strategy;
const { ExtractJwt } = require('passport-jwt');
const { User } = require('./models/user');
const JWT = require('jsonwebtoken');





// strategy for geeting data -- VERY GOOD
passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: process.env.USER_JWT_KEY
}, async (payload, done) => {
    try {
        const isExpired = (payload.exp - Date.now()) < 0;
        if (isExpired) return done(new Error('Token Expired'), false);

        const checkUser = await User.findById(payload.sub);
        if (!checkUser) {
            return done('User was not found', false);
        } 
        
        done(null, checkUser);
        
    } catch(error) {
        done(error, false);
    }
}));


passport.use('forgotPasswordChange', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: process.env.PASSWORD_RESET_JWT_KEY
}, async (payload, done) => {
    try {
        const isExpired = (payload.exp - Date.now()) < 0;
        if (isExpired) return done(new Error('Token Expired'), false);

        console.log('payload', payload);
        const checkUser = await User.findOne({"local.email": payload.sub}).select('local.name local.email');
        if (!checkUser) {
            return done('User was not found', false);
        } 
        
        done(null, checkUser);
        
    } catch(error) {
        done(error, false);
    }
}));


// LOCAL SIGN IN
passport.use('local-verification', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authentification'),
    secretOrKey: process.env.USER_JWT_KEY
}, async(payload, done) => {
    try {
        const isExpired = (payload.exp - Date.now()) < 0;
        if (isExpired) return done(new Error('Token Expired'), false);

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

// if user did not verify email
passport.use('local-verification-again', new passportLocal({
    usernameField: 'email'
}, async(email, password, done) => {
    try {
        const checkUser = await User.findOne({ 'local.email': email});
        if (!checkUser) {
            return done('Email does not exist!', false);
        }
        if (checkUser.local.isVerified) {
            return done('This account was already verified!', false);
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

passport.use('googleOauth2', new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/users/auth/google/callback'
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('accessToken', accessToken);
            console.log('refeshToken', refreshToken);
            console.log('profile', profile);
            
        const checkUser = await User.findOne({"google.id": profile.id}, function (err, user) {
            return done(err, user);
        }); 
        
        if (!checkUser) {
            done("User already signed up", null);
        }

        const newUser = new User({
            method: 'google',
            google: {
                id: profile.id,
                email: profile.emails[0].value,
                name: profile.name.givenName
            }
        });
        
        await newUser.save();
        done(null, newUser);
        } catch(error) {
            console.log('Error backend', error);
        }
    }
));

passport.use('profileImageUpload', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromHeader('authorization'),
    secretOrKey: process.env.USER_JWT_KEY
}, async(payload, done) => {
    try {
        const isExpired = (payload.exp - Date.now()) < 0;
        if (isExpired) return done(new Error('Token Expired'), false);

        const checkUser = await User.findById(payload.sub);
        if (!checkUser) {
            return done('Email not found!', false);
        }
        done(null, checkUser);
    } catch(error) {
        done(error, false);
    }
}))

