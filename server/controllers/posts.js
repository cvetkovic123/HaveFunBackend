const { Post } = require('../models/posts');
const { User } = require('../models/user');
const fs = require('fs');
const { promisify } = require('util');
const { func } = require('@hapi/joi');
const e = require('express');
const unlinkAsync = promisify(fs.unlink);

const json5 = require('json5');
const { use } = require('passport');

module.exports = {

    newPost: async(req, res, next) => {
        const url = req.protocol + '://' + req.get('host');
        
        const {
            title
        } = req.body;
        
        const post = new Post({
            userId: req.user._id,
            title: title,
            points: 0,
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

        const allUsers = await User.find();
        const usersIdHolder = [];
        console.log('allUsers', allUsers);
        for (const user of allUsers) {
            usersIdHolder.push(user._id);
        }
        await post.save().
        then( async(result) => {

                User.findOneAndUpdate({"_id": req.user._id}, { $push: {"posts": post._id}}, {new: true}, function(error, result) {
                    if (error) {
                        console.log('Error while updating worker new post.', error);
                    }
                    console.log('result', result);
                });
                for (let i = 0; i < usersIdHolder.length; i++) {
                    await Post.findOneAndUpdate({"_id": post._id}, { $push: {"whoUpvoted": {
                        "userId": usersIdHolder[i],
                        "isUpvoted": false
                    }}});
                }

                const allPosts = await Post.find();
 
                return res.status(200).send({ message: allPosts});
            });
    },

    upvote: async(req, res, next) => {
        let newUser;
        console.log('user token id which gets saved in the  whoUpvotedUserID', req.user.id);
        // check if post exits
        const post = await Post.findById(req.body.postId);
        if (!post) return res.status(400).send({ message: 'Post not found!'});


        // post does not yet have any upvotes, so check if it has length
        // then push the first person who upvoted 
        if (post.whoUpvoted.length === 0) {
            console.log('true');
            const downVoteUpvote = await Post.findByIdAndUpdate(req.body.postId, 
                { $push: {"whoUpvoted": {"userId": req.user.id, "isUpvoted": true}}, $inc: {"points": 1}});
            if (!downVoteUpvote) return res.status(404).send({message: 'Post could not be found or edited'});
            
            return res.status(200).send({ message: downVoteUpvote});
        } 
        // if whoUpvoted has length, meaning no first one- we hit a snag
        // you need to sort through db in search of if the post exists and if whoUpvoted already exists or not
        
        
        // now only list through all whoUpvoted in array and deduce what needs be done
        for (let upvotee in post.whoUpvoted) {
            const userWhoIsUpvoting =  json5.stringify(req.user.id);
            const dbUpvotees = json5.stringify(post.whoUpvoted[upvotee].userId);
            if (dbUpvotees === userWhoIsUpvoting) {
                const flipValue =  !post.whoUpvoted[upvotee].isUpvoted;
                let addValue;
                if (flipValue) {
                    addValue = 1;
                } else {
                    addValue = -1;
                }
                // if this dude already upvoted, then we just need to edit the isUpvoted from true to false without creating a new object
                // console.log('alo isti suu');
                const oldUpvoteGoingDownvotee = await Post.findOneAndUpdate({"_id": req.body.postId, "whoUpvoted.userId": req.user.id}, 
                {$set: {"whoUpvoted.$.isUpvoted": flipValue}, $inc: {points: addValue}}, {new: true, overwrite: true})
                console.log(oldUpvoteGoingDownvotee);
                return res.status(200).send({ message: oldUpvoteGoingDownvotee});
            } 
            newUser = userWhoIsUpvoting;
        }
        // console.log('newUser', newUser);
        var result = newUser.substring(1, newUser.length-1);
        // // if a new upvotee comes along, we need to create a totaly new object for him
        const upvote = await Post.findByIdAndUpdate(req.body.postId, {$push: {"whoUpvoted": {"userId": result, "isUpvoted": true}}, $inc: {"points": 1}});
        if (!upvote) return res.status(404).send({message: 'Post could not be found or edited'});
        return res.status(200).send({ message: upvote});
    },

    getOnePost: async(req, res, next) => {
        const checkPost = await Post.findById(req.params.postId);
        if (!checkPost) return res.status(200).send({ message: false});

        res.status(200).send({message: true});
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

    getAllFreshPosts: async(req, res, next) => {
        // get every post with points bellow 5 
        const checkPosts = await Post.find({"points": { $lt: 5}}).select('-__v');
        if (!checkPosts) res.status(200).send({message: "No posts found"});
        const reverseCheckPosts = checkPosts.slice().reverse();
        // success
        res.status(200).send({message: reverseCheckPosts});
    },

    getAllTrendingPosts: async(req, res, next) => {
        // get every post with point below 25
        const checkPosts = await Post.find({"points": { $lt: 25, $gt: 5}}).select('-__v');
        if (!checkPosts) res.status(200).send({message: "No posts found"});
        const reverseCheckPosts = checkPosts.slice().reverse();
        // success
        res.status(200).send({message: reverseCheckPosts});
    },

    getAllPopularPosts: async(req, res, next) => {
        // get EVERYTHING
        const checkPosts = await Post.find({"points": { $gt: 25}}).select('-__v');
        if (!checkPosts) res.status(200).send({message: "No posts found"});
        const reverseCheckPosts = checkPosts.slice().reverse();
        // success
        res.status(200).send({message: reverseCheckPosts});
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
        console.log('alo');
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