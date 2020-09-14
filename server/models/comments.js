const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    postsId: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    comments: [{
        whoWroteItId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        name: {
            type: String
        },
        image: {
            type: String
        },
        comment: {
            type: String
        },
        commentDate: {
            type: Date,
            default: Date.now
        }
    }],
    postCommentDate: {
        type: Date,
        default: Date.now
    },
});

const Comment = new mongoose.model('Comment', CommentSchema);

exports.Comment = Comment;




