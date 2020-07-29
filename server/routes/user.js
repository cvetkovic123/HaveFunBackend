const router = require('express-promise-router')();
const passport = require('passport');

const UsersController = require('../controllers/users');
const { validateBody, schemas } = require('../helpers/routerHelpers');
const passportConfig = require('../passport');

const passportLocalSignIn = passport.authenticate('local', {session: false});
const passportJWTGetStuff = passport.authenticate('jwt', {session: false});
const passportLocalVerification = passport.authenticate('local-verification', {session: false});

router.route('/signUp')
    .post(validateBody(schemas.signUpSchema), UsersController.signUp);

router.route('/emailVerification')
    .get(
        passportLocalVerification,
        UsersController.emailVerification);

router.route('/signIn')
    .post(
        validateBody(schemas.signInSchema),
        passportLocalSignIn,
        UsersController.signIn);

router.route('/secret')
    .get(passportJWTGetStuff,
        UsersController.secret);

module.exports = router;