const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    method: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        required: true
    },
    local: {
        name: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
        email: {
            type: String,
            unique: true,
            lowercase: true,
            required: true
        },
        date: {
            type: Date,
            default: Date.now
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
        }
    },
    facebook: {
        id: {
            type: String
        },
        email: {
            type: String,
            lowercase: true
        }
    }
});

// this will happen before the save() method in the controller
userSchema.pre('save', async function (next) { // next get used as a callback 
    try {
        if (!this.isModified('local.password')) {
            return next();
        }
        if (this.method !== 'local') {
            next();
        }
        // generate a salt
        const salt = await bcrypt.genSalt(10);
        // hash password with salt
        const passwordHash = await bcrypt.hash(this.local.password, salt);
        console.log('passwordHash', passwordHash);
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