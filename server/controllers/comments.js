const { Post } = require('../models/posts');
const { User } = require('../models/user');
const { Comment } = require('../models/comments');

const json5 = require('json5');


module.exports = {
    addComment: async(req, res, next) => {

        // check if postExists
        console.log('addCommentBody', req.body);
        const postIfExists = await Post.findById(req.body.postId);
        if (!postIfExists) return res.status(404).send({ message: "This post was deleted."});

        let profileImagePath = '';
        if (req.user.profileImage) {
            profileImagePath = req.user.profileImage.localPath;
        } else {
            profileImagePath = 'https://mekanabak.com/images/avatar/no-avatar.jpg';
        }

        // check if a comment was made before- if not basically init the comment here
        if (!postIfExists.comments) {
            console.log('Def should not be executed now!?')
            const firstComment = new Comment({
                postsId: req.body.postId,
                comments: [{
                    whoWroteItId: req.user._id,
                    name: req.user.local.name,
                    image: profileImagePath,
                    comment: req.body.comment
                }]
            }); 
            await firstComment.save().
                then((result) => {
                    Post.findOneAndUpdate({"_id": req.body.postId}, {"comments": firstComment._id}, {new: true}, function (error, result) {
                        if (error) {
                            console.log('Error while creating first comment.', error);
                        }
                        console.log('success', result);
                    });
                    return res.status(200).send({ message: result})}).
                catch(err => res.status(400).send({ message: "Something went wrong", err}));
        }
        
        // for new comments just push a new comment
        console.log(req.user.local.email);
        const newComments = await Comment.findByIdAndUpdate(postIfExists.comments, {$push: {
            "comments": {
                "whoWroteItId": req.user._id,
                "name": req.user.local.name,
                "image": profileImagePath,
                "comment": req.body.comment
            }
        }});

        if (!newComments) return res.status(400).send({ message: "Comment either not added or something else wen't wrong."});
        
        const returnAllComments = await Comment.findById(postIfExists.comments);


        return res.status(200).send({ message: returnAllComments});

    },

    editComment: async(req, res, next) => {

        // check if postExists
        const postIfExists = await Post.findById(req.body.postId);
        if (!postIfExists) return res.status(404).send({ message: "This post was deleted."})


        // check if comment exits
        // console.log(!postIfExists.comments);
        if (!postIfExists.comments) return res.status(404).send({ message: "The comments were deleted by the user who made the post."});

        // find comments by id that's in the post comments 
        const comments = await Comment.findById(postIfExists.comments);

        // console.log(comments);
        for (let comment in comments.comments) {
            const whichCommentIWantEdited = json5.stringify(req.params.id);
            const dbComments = json5.stringify(comments.comments[comment]._id);
            // console.log(comments.comments[comment]);
            // const 
            if (dbComments === whichCommentIWantEdited) {
                // console.log('found', comments.comments[comment]._id);
                const editedComment = await Comment.findOneAndUpdate({"_id": postIfExists.comments, "comments._id": req.params.id},
                    {$set: {"comments.$.comment": req.body.comment}}, {new: true});

                if (!editedComment) return res.status(400).send({ message: "Something went wrong when updating specific comment"});
                
                return res.status(200).send({message: editedComment});
            }
        }

        res.status(400).send({message: "Comment not found"});

    },

    getAllComments: async(req, res, next) => {
        console.log(req.params.postId);
        // check if postExists
        const postIfExists = await Post.findById(req.params.postId);
        if (!postIfExists) return res.status(404).send({ message: "This post was deleted."})


        // check if comment exits
        if (!postIfExists.comments) return res.status(200).send({ message: postIfExists});
        console.log('postIfExists comments', postIfExists.comments);
        const comments = await Comment.findById(postIfExists.comments).select('-__v');
        console.log('comments', postIfExists);
        
        res.status(200).send({ message: comments});

        // console.log(req.params.commentId);
    },

    deleteComment: async(req, res, next) => {

        // check if postExists
        const postIfExists = await Post.findById(req.params.postId);
        if (!postIfExists) return res.status(404).send({ message: "This post was deleted."})

        // return here if the comments don't exist 
        if (!postIfExists.comments) return res.status(404).send({ message: "The comments were deleted by the user who made the post."});
    
        // get the comments with the comments- genius naming
        const comments = await Comment.findById(postIfExists.comments);

        for (let comment in comments.comments) {
            const whichCommentIWantDeleted = json5.stringify(req.params.commentId);
            const dbComments = json5.stringify(comments.comments[comment]._id);
            // console.log('whichCommentIWantDeleted', whichCommentIWantDeleted, 'dbComments', dbComments);
            // const 
            // console.log(dbComments ===  whichCommentIWantDeleted);
            if (dbComments === whichCommentIWantDeleted) {
                console.log('found', comments.comments[comment]._id);
                const deletedComment = await Comment.findById(postIfExists.comments, function(error, data) {
                    if (error) {
                        console.log('error while deleting comment', error);
                    }
                    data.comments.pull(comments.comments[comment]._id);
                    data.save();
                })
                
                return res.status(200).send({message: deletedComment});
            }
        }

        res.status(400).send({message: "Comment not found"});

    }

}
