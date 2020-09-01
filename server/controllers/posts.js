const { Post } = require('../models/posts');
const { User } = require('../models/user');
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

module.exports = {

    newPost: async(req, res, next) => {
        const url = req.protocol + '://' + req.get('host');
        
        console.log(req.file);
        const {
            title,
            content
        } = req.body;
        
        const post = new Post({
            userId: req.user._id,
            title: title,
            content: content,
            picture: {
                fieldname: req.file.fieldname,
                originalname: req.file.originalname,
                encoding: req.file.encoding,
                mimetype: req.file.mimetype,
                destination: req.file.destination,
                filename: req.file.filename,
                path: req.file.path,
                localPath: url + "/postsImage/" + req.file.filename,
                size: req.file.size
            }
        });

        await post.save().
            then(() => {
                User.findOneAndUpdate({"_id": req.user._id}, { $push: {"posts": post._id}}, {new: true}, function(error, result) {
                    if (error) {
                        console.log('Error while updating worker new post.', error);
                    }
                    console.log('result', result);
                });
                res.status(200).send({ message: 'New post created'});
            })
    },

    getOnePost: async(req, res, next) => {
        const checkPost = await Post.findById(req.params.id);
        if (!checkPost) return res.status(404).send({ message: "Post not found"});
        const checkPostUser = await User.findOne({"posts": checkPost});
        if (!checkPostUser) return res.status(404).send({ message: "Post not found in user"});

        res.status(200).send({message: checkPost});
    },

    getAllUserPosts: async(req, res, next) => {

        // get only user posts id
        const userPosts = await User.findById(req.user.id).select('posts');
        console.log(userPosts.posts);
        

        // create new container array for the objects
        const userPostsContent = [];

        // list through array and get each post individually and stuff 'em into storage
        for( let post in userPosts.posts) {
            const postId = userPosts.posts[post];
            const postContent = await Post.findById(postId).select('-userId -__v');
            userPostsContent.push(postContent);
        }
        
        // success ( turkey made)
        res.status(200).send({message: userPostsContent});

    },

    getAllPosts: async(req, res, next) => {
        // get EVERYTHING
        const checkPosts = await Post.find();
        if (!checkPosts) res.status(200).send({message: "No posts found"});

        // success
        res.status(200).send({message: checkPosts});
    },

    editPost: async(req, res, next) => {
        const url = req.protocol + '://' + req.get('host');
        console.log('body', req.file);
        // check if post exists
        const checkPost = await Post.findById(req.params.id);
        if (!checkPost) return res.status(404).send({ message: "Post not found"});
        
        // if exists delete old web image from folder
        if (checkPost.picture) {
            console.log('true', checkPost.picture);
            unlinkAsync(checkPost.picture.path);
        }

        // check if post id exists in user id
        const checkPostUser = await User.findOne({"posts": checkPost});
        if (!checkPostUser) return res.status(404).send({ message: "Post not found in user"});        
        
        const newReqBody = {
            "title": req.body.title,
            "content": req.body.content,
            "picture": {
                "fieldname": req.file.fieldname,
                "originalname": req.file.originalname,
                "encoding": req.file.encoding,
                "mimetype": req.file.mimetype,
                "destination": req.file.destination,
                "filename": req.file.filename,
                "path": req.file.path,
                "localPath": url + "/postsImage/" + req.file.filename,
                "size": req.file.size
            }
        };

        // find post with id and replace with new 
        const newEditedPost = await Post.findByIdAndUpdate(req.params.id, newReqBody ).setOptions({new: true, overwrite: true});
        if (!newEditedPost) res.status(400).send({ message: 'Error with edit post'});

        // success
        res.status(200).send({ message: 'Post successfully edited'});
    },

    deletePost: async(req, res, next) => {
        // delete post with param id        
        const checkPost = await Post.findByIdAndDelete(req.params.id);
        
        // if post could not be found
        if (!checkPost) {
            res.status(404).send({ message: 'Post not found!'});
        }
        // delete only the one id from user posts- best method found so far
        const findPostIdInUserAndDelete = await User.findById( req.user._id, function (error, user) {
            user.posts.pull(req.params.id);
            user.save();
        });

        // if delete fails for some reason
        if (!findPostIdInUserAndDelete) {
            res.status(404).send({ message: 'Post id not found in user posts!'});
        }

        // success
        res.status(200).send({ message: 'Post successfully deleted'});
    },


    deleteAllPosts: async(req, res, next) => {
        // get user for posts
        const user = await User.findById(req.user._id);     

        // if user does not exist, double check
        if (!user) {
            res.status(404).send({ message: "Could not find user"});
        }

        // check if user has any posts to delete
        const userPosts = user.posts;
        if (userPosts.length === 0) {
            res.status(200).send({ message: "No posts to delete"});
        }

        // // list through post id's in user posts
        for (let postCounter in userPosts) {
            // delete images of each post from storage if it exists
            const post = await Post.findById(userPosts[postCounter]);
            if (post.picture) {
            unlinkAsync(post.picture.path);
            }
            // delete post associated with user
            await Post.findByIdAndDelete(userPosts[postCounter]);
        }

        // delete ( set to empty xD) post id(s) from user.posts array 
        await User.findByIdAndUpdate(req.user._id, { $set: {"posts": []}}, {multi: true}, function(error, result) {
            if (error) {
                res.status(400).send({ message: error});
            }
        });

        // success
        res.status(200).send({ message: "Posts deleted successfully"});
    }

}