const router = require('express-promise-router')();
const passport = require('passport');
const UsersController = require('../controllers/users');
const multer = require('multer')
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
const passportJWTGetStuff = passport.authenticate('jwt', {session: false});
const passportLocalVerification = passport.authenticate('local-verification', {session: false});
const passportImageVerification = passport.authenticate('profileImageUpload', {session: false});

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

router.route('/imageUpload')
    .post(
        passportImageVerification,
        multer({storage: storage}).single("image"),
        UsersController.imageUpload
        );

router.route('/getProfileImage')
        .get(
            passportImageVerification,
            UsersController.getProfileImage
        )
module.exports = router;