const router = require('express-promise-router')();
const passport = require('passport');
const multer = require('multer')

const UsersController = require('../controllers/users');
const { validateBody, schemas } = require('../helpers/routerHelpers');

const passportConfig = require('../passport');

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid mime type");
        if (isValid) {
            error = null;
        }
        cb(error, "public/profileImage");
    },
    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('-');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    }
});

const passportLocalSignIn = passport.authenticate('local', {session: false});
const passportLocalVerification = passport.authenticate('local-verification', {session: false});
const passportImageVerification = passport.authenticate('profileImageUpload', {session: false});
const passportLocalEmailAgainVerification = passport.authenticate('local-verification-again', {session: false});

const googleToken = passport.authenticate('googleOauth2', {scope: ['profile', 'email']}, {session: false});
const googleAuth = passport.authenticate(
    'googleOauth2', 
    {session: false, successRedirect: 'http://localhost:4200/popular', failureRedirect: 'http://localhost:4200/auth'});


const userAuthorization = passport.authenticate('jwt', {session: false});
const userAuthorizationPasswordChange = passport.authenticate('forgotPasswordChange', {session: false});


router.route('/signUp')
    .post(
        validateBody(schemas.signUpSchema), 
        UsersController.signUp);

router.route('/emailVerification')
    .get(
        passportLocalVerification,
        UsersController.emailVerification);

router.route('/signIn')
    .post(
        validateBody(schemas.signInSchema),
        passportLocalSignIn,
        UsersController.signIn);


router.route('/imageUpload')
    .post(
        passportImageVerification,
        multer({storage: storage}).single("image"),
        UsersController.imageUpload);

router.route('/getProfileImage')
    .get(
        passportImageVerification,
        UsersController.getProfileImage);


router.route('/auth/google')
    .get(
        // async (req, res, next) => {
        //     res.header("Access-Control-Allow-Origin", 'http://localhost:4200'); // update to match the domain you will make the request from
        //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
        //     console.log('bla');
        //     next();
        // },
        googleToken);
        
router.route('/auth/google/callback')
    .get(        
        googleAuth,
        UsersController.googleOauth);


router.route('/resendEmailVerification')
    .post( 
        passportLocalEmailAgainVerification,
        UsersController.resendEmailForVerification);

router.route('/forgotPassword')
    .post(
        validateBody(schemas.forgotPassword),
        UsersController.forgotPassword);

router.route('/forgotChangePassword')
    .patch(
        userAuthorizationPasswordChange,
        validateBody(schemas.forgotChangePassword),
        UsersController.forgotChangePassword);


router.route('/changePassword')
    .patch(
        userAuthorization,
        validateBody(schemas.passwordReset),
        UsersController.changePassword);

router.route('/editName')
    .patch(
        userAuthorization,
        validateBody(schemas.nameReset),
        UsersController.editName);

router.route('/deleteProfile')
    .delete(
        userAuthorization,
        UsersController.deleteProfile);

router.route('/secret')
    .get(
        passportImageVerification,
        UsersController.secret);

module.exports = router;