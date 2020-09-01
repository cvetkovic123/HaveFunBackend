const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const imageSchema = new Schema({
    fieldname: String,
    originalname: String,
    encoding: String,
    mimeptype: String,
    destination: String,
    filename: String,
    path: String,
    localPath: String,
    size: Number
});

const postSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String
    },
    content: {
        type: String
    },
    likes: {
        type: Number
    },
    dislikes: {
        type: Number
    },

    created_at: {
        type: Date,
        default: Date.now
    },
    comments: [{
        type: Schema.Types.ObjectId,
        ref: 'Comments'
    }],
    picture: imageSchema
});

const Post = new mongoose.model('Post', postSchema);

exports.Post = Post;