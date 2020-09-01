const router = require('express-promise-router')();
const passport = require('passport');
const passportConfig = require('../passport');
const multer = require('multer');

const PostsController = require('../controllers/posts');
const { validateBody, schemas } = require('../helpers/routerHelpers');
const { Post } = require('../models/posts');

const MIME_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif'
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid mime type");
        if (isValid) {
            error = null;
        }
        cb(error, "public/postsImage");
    },
    filename: (req, file, cb) => {
        const name = file.originalname.toLowerCase().split(' ').join('-');
        const ext = MIME_TYPE_MAP[file.mimetype];
        cb(null, name + '-' + Date.now() + '.' + ext);
    }
});

const userAuthorization = passport.authenticate('jwt', {session: false});



router.route('/newPost')
    .post(
        userAuthorization,
        multer({storage: storage}).single("image"),
        validateBody(schemas.postsSchema),
        PostsController.newPost);


router.route('/getOnePost/:id')
    .get(
        userAuthorization,
        PostsController.getOnePost);

router.route('/getAllUserPosts')
.get(
    userAuthorization,
    PostsController.getAllUserPosts);

router.route('/getAllPosts')
    .get(
        PostsController.getAllPosts);

router.route('/editPost/:id')
    .patch(
        userAuthorization,
        multer({storage: storage}).single("postImage"),
        validateBody(schemas.postsSchema),
        PostsController.editPost);

router.route('/deletePost/:id')
    .delete(
        userAuthorization,
        PostsController.deletePost);

router.route('/deleteAllPosts')
    .delete(
        userAuthorization,
        PostsController.deleteAllPosts);

module.exports = router;