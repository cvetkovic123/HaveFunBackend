const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
    size: Number,
    created_at: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new Schema({
    method: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        required: true
    },
    local: {
        name: {
            type: String
        },
        password: {
            type: String
        },
        email: {
            type: String,
            unique: true,
            lowercase: true
        },
        isVerified: {
            type: Boolean,
        },
        isAdmin: {
            type: Boolean
        }
    },
    google: {
        id: {
            type: String
        },
        email: {
            type: String,
            lowercase: true
        },
        name: {
            type: String
        }
    },
    facebook: {
        id: {
            type: String
        },
        email: {
            type: String,
            lowercase: true
        },
        name: {
            type: String
        }
    },
    profileImage: imageSchema,
    date: {
        type: Date,
        default: Date.now
    },
    posts: [{
        type: Schema.Types.ObjectId,
        ref: 'Post',
    }]
});

// this will happen before the save() method in the controller
userSchema.pre('save', async function (next) { // next get used as a callback 
    try {
        if (this.method !== 'local') {
            next();
        }
        if (!this.isModified('local.password')) {
            return next();
        }
        // generate a salt
        const salt = await bcrypt.genSalt(10);
        // hash password with salt
        const passwordHash = await bcrypt.hash(this.local.password, salt);
        // reasign password with the hash version of the password 
        this.local.password = passwordHash;
        next();
    } catch (error) {
        next(error);
    }


});

userSchema.methods.isValidPassword = async function (newPassword) {
    try {
        console.log('password to check', newPassword);
        return await bcrypt.compare(newPassword, this.local.password)
        .then(data => {
            console.log('result', data);
            if (data) {
                return data;
            } else {
                return false;
            }
        });
    } catch (err) {
        throw new Error(err);
    }
}

const User = new mongoose.model('User', userSchema);

exports.User = User;