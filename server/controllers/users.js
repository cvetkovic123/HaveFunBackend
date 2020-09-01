const { User } = require('../models/user');
const mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN_NAME});
const bcrypt = require('bcrypt');
const utils = require('../lib/utils');

const fs = require('fs');
const { promisify } = require('util');
const { Post } = require('../models/posts');
const unlinkAsync = promisify(fs.unlink);



// 1800000
module.exports = {

    //SIGN UP
    signUp: async(req, res, next) => {
      // get data from body
      const {
        name,
        email,
        password
      } = req.value.body;

      // check if email exists locally
      const checkLocalUserEmail = await User.findOne({ "local.email": email});
      // const checkGoogleUserEmail = await User.findOne({ "google.email": email});
      if (checkLocalUserEmail ) return res.status(200).send({ message: "This email is already registered. :)"});

      // create user
      const user = new User({
        method: 'local',
        local: {
          name: name,
          email: email,
          password: password,
          isVerified: false
        }
      });
      // create signed token
      const token = utils.signToken(user);
      // set url for host if it exists ( for production, or instead use client url)
      const url = process.env.HOST_URL || process.env.CLIENT_URL;
      // prepare mailgun
      const data = {
        from: 'alexanderGrieves42@gmail.com',
        to: 'bojan.cvetkovic337@gmail.com',
        subject: 'HaveFun activation link',
        text: `
        <p>${url}/auth/activate?id=${token}</p>
        `
      };
        
      // send mailgun 
      mailgun.messages().send(data, function (error, body) {
        console.log(body);
        if (error) return res.status(500).send({message: "Could not send mailgun message for user verification"});
      });

      // success
      await user.save().
        then(() => res.status(200).send({ message: `Local Sign Up Success. Please verify email!`}))
        .catch((error) => res.status(400).send({ message: `Local Sign Up Failed!${error}`}));
    },


    // EMAIL VERIFICATION
    emailVerification: async(req, res, next) => {
      // check if user is verified
      const user = await User.findByIdAndUpdate(req.user.id,
        {"local.isVerified": true }, {new: true})
      if (!user) return res.send({message: "User not found"});
      // success
      res.send({ message: 'Email successfully verified'});
    },


    // SIGN IN 
    signIn: async(req, res, next) => {
      // make token out of authentification token
      const token = utils.signToken(req.user);
      // success
      res.status(200).send({ message: `${token}`});
    },

    // FORGOT PASSWORD

    forgotPassword: async(req, res, next) => {

      // check if user exists
      const user = await User.findOne({"local.email": req.body.email});

      if (!user) return res.status(400).send({ message: "EMAIL_NOT_FOUND"});
      // if user is not verified 
      if (!user.local.isVerified) return res.status(400).send({ message: "This email exists, but it was not verified"});


      const token = utils.passwordResetToken(req.body);

      const url = process.env.HOST_URL || process.env.CLIENT_URL;
      // prepare mailgun
      const data = {
        from: 'alexanderGrieves42@gmail.com',
        to: 'bojan.cvetkovic337@gmail.com',
        subject: 'HaveFun activation link',
        text: `
        <p>${url}/auth/passwordReset?id=${token}</p>
        `
      };
        
      // send mailgun 
      mailgun.messages().send(data, function (error, body) {
        console.log(body);
        if (error) return res.status(500).send({message: "Could not send mailgun message for user verification"});
      });

      res.status(200).send({ message: "A password reset token was sent to your email."});
    },


    forgotChangePassword: async(req, res, next) => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(req.body.newPassword, salt);
      
      // update new hashed password with old one
      const newPasswordUpdate = await User.findByIdAndUpdate(req.user._id,{ "local.password": passwordHash});

      // if fails 
      if (!newPasswordUpdate) return res.status(404).send({ message: "New password could not be updated"});

      // success
      res.status(200).send({ message: "Password changed successfully"});
    },


    // GOOGLE OAUTH
    googleOauth: async(req, res, next) => {
      console.log('made it here', req);
      const token = signGoogleToken(req.user);

      res.status(200).send({ message: token});
    },

    // IMAGE UPLOAD
    imageUpload: async(req, res, next) => {
      // create url for image path
      const url = req.protocol + '://' + req.get('host');

      const user = await User.findById(req.user._id);
      // check if user exists and if he already has a profile picture
      if (!user && user.profileImage) {
        unlinkAsync(user.profileImage.path);
      }
      
      // update profile image
      const checkUser = await User.findByIdAndUpdate(req.user._id, 
        {"profileImage" : {
          fieldname: req.file.fieldname,
          originalname: req.file.originalname,
          encoding: req.file.encoding,
          mimetype: req.file.mimetype,
          destination: req.file.destination,
          filename: req.file.filename,
          path: req.file.path,
          localPath: url + "/profileImage/" + req.file.filename,
          size: req.file.size
        }}, {new: true});
        // if an error occured
        if (!checkUser) return res.status(400).send({ message: 'Image could not be saved!'});

        // success
        await checkUser.save().
          then(() => { res.status(200).send({ message: 'Image uploaded!', path: checkUser.profileImage.localPath})}).
          catch((error) => { res.status(400).send(`Error uploading!${error}`)});
    },

    // GET PROFILE IMAGE
    getProfileImage: async(req, res, next) => {

      const getUser = await User.findById(req.user._id);
      if (!getUser) return res.status(404).send({ message: "User not found"});

      if (!getUser.profileImage) return res.status(200).send({ message: "User has not yet uploaded a profile image"});
      
      res.status(200).send({message: getUser.profileImage.localPath});
    },


    // EMAIL RE-VERIFICATION
    resendEmailForVerification: async(req, res, next) => {

      const getUser = await User.findOne({"local.email": req.body.email});
      if (!getUser) return res.status(404).send({ message: "EMAIL_DOES_NOT_EXIST" });

      const token = utils.signToken(getUser);
      const url = process.env.HOST_URL || process.env.CLIENT_URL;
      const data = {
        from: 'alexanderGrieves42@gmail.com',
        to: 'bojan.cvetkovic337@gmail.com',
        subject: 'HaveFun activation link',
        text: `
        <p>${url}/auth/activate?id=${token}</p>
        `
      };
       
      mailgun.messages().send(data, function (error, body) {
        console.log(body);
      });
      await getUser.save()
        .then(() => res.status(200).send({ message: `Email was resent,try again to verify your email!`}))
        .catch((error) => res.status(400).send({ message: `Local Sign Up Failed!${error}`}));
    },

    changePassword: async(req, res, next) => {
      // get user we want to edit
      const checkUser = await User.findById(req.user._id);
      if (!checkUser) return res.status(404).send({ message: 'User not found when changing password - logged In!'});

      // check if old password is still valid, just to be safe
      const isValidOldPassword = checkUser.isValidPassword(req.body.password);
      if (!isValidOldPassword) return res.status(400).send({ message: "Old password not correct!"});


      // salt new password and hash it
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(req.body.newPassword, salt);
      
      // update new hashed password with old one
      const newPasswordUpdate = await User.findByIdAndUpdate(req.user._id,{ "local.password": passwordHash});

      // if fails 
      if (!newPasswordUpdate) return res.status(404).send({ message: "New password could not be updated"});


      // success
      res.status(200).send({ message: "Password changed successfully"});
    },

    editName: async(req, res, next) => {
      // find name and update it, using patch crud here so it only updates that single piece of data
      const changeName = await User.findByIdAndUpdate(req.user._id,{"local.name": req.body.name}, {new: true});
      if (!changeName) return res.status(400).send({ message: "Name could not be updated"});

      // success
      res.status(200).send({ message: "Name updated successfully"});
    },


    deleteProfile: async(req, res, next) => {
      // delete profile picture from storage
      const user = await User.findById(req.user._id);
      if (user.profileImage) {
        unlinkAsync(user.profileImage.path);
      }      

      const userPosts = user.posts;
      // list through post id's in user posts
      for (let postCounter in userPosts) {
        // delete images of each post from storage if it exists
        const post = await Post.findById(userPosts[postCounter]);
        if (post.picture) {
          unlinkAsync(post.picture.path);
        }
        // delete post associated with user
        await Post.findByIdAndDelete(userPosts[postCounter]);
      }

      // find and delete profile with id supplied in header
      const deleteProfile = await User.findByIdAndDelete(req.user._id);
      if (!deleteProfile) return res.status(400).send({ message: "Profile could not be deleted"});

      // if deleted 
      res.status(200).send({message: "Profile deleted successfully"});
    },
  
    // SECRET
    secret: async(req, res, next) => {
      console.log('made it here');
      res.send({ secret: "Resource"});
    }

}
