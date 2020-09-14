const router = require('express-promise-router')();
const passport = require('passport');
const passportConfig = require('../passport');

const { validateBody, schemas } = require('../helpers/routerHelpers');
const CommentsController = require('../controllers/comments');


const userAuthorization = passport.authenticate('jwt', {session: false});


router.route('/addComment')
    .post(
        userAuthorization,
        validateBody(schemas.comment),
        CommentsController.addComment);

router.route('/editComment/:id')
    .patch(
        userAuthorization,
        validateBody(schemas.comment),
        CommentsController.editComment);

router.route('/deleteComment/:postId/:commentId')
    .delete(
        userAuthorization,
        CommentsController.deleteComment);

router.route('/getAllComments/:postId')
    .get(
        userAuthorization,
        CommentsController.getAllComments);

module.exports = router;
