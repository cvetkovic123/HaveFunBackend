const { User } = require('../models/user');
const JWT = require('jsonwebtoken');
const mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN_NAME});

signToken = (body) => {
  console.log('body', body.local.email);
  return JWT.sign({
    iss: "HaveFun",
    sub: body.id,
    name: body.local.name,
    email: body.local.email,
    iat: new Date().getTime(),
    exp: new Date().setDate(new Date().getDate() + 1)
  }, process.env.USER_JWT_KEY);
}

module.exports = {
    signUp: async(req, res, next) => {
      const {
        name,
        email,
        password
      } = req.value.body;

      const checkUserEmail = await User.findOne({ "local.email": email});
      if (checkUserEmail) return res.status(403).send({ message: "EMAIL_EXISTS"});

      
      const user = new User({
        method: 'local',
        local: {
          name: name,
          email: email,
          password: password,
          isVerified: false
        }
      });
      const token = signToken(user);
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
      console.log(token);
      await user.save().
        then(() => res.status(200).send({ message: `Local Sign Up Success. Please verify email!`}))
        .catch((error) => res.status(400).send({ message: `Local Sign Up Failed!${error}`}));
    },

    emailVerification: async(req, res, next) => {

      const user = await User.findByIdAndUpdate(req.user.id,
        {"local.isVerified": true }, {new: true})
      if (!user) {
        res.send({message: "user not found"});
      }
      await user.save().
      then(() => res.status(200).send({ message: `Congrats dipshit. Email verified!`}))
      .catch((error) => res.status(400).send({ message: `YOU FUCKED UP AGAIN!:${error}`}));
      res.send({ message: 'Email verified dipshit'});

    },

    signIn: async(req, res, next) => {
      const token = signToken(req.user);
      res.status(200).send({ message: `${token}`});
    },

    imageUpload: async(req, res, next) => {
      const url = req.protocol + '://' + req.get('host');
      const fs = require('fs');
      const { promisify } = require('util');
      const unlinkAsync = promisify(fs.unlink);

      const checkIfUserHasProfileImage = await User.findById(req.user._id);
      if (checkIfUserHasProfileImage.local.profileImage) {
        unlinkAsync(checkIfUserHasProfileImage.local.profileImage.path);
      }
      
      const checkUser = await User.findByIdAndUpdate(req.user._id, 
        {"local.profileImage" : {
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
      if (!checkUser) {
        res.status(400).send({ message: 'Image could not be saved!'});
      }

      await checkUser.save().
        then(() => { res.status(200).send({ message: 'Image uploaded!', path: checkUser.local.profileImage.localPath})}).
        catch((error) => { res.status(404).send(`Error uploading!${error}`)});
    },

    getProfileImage: async(req, res, next) => {
      const getUser = await User.findById(req.user._id);
      if (!getUser) {
        res.status(404).send({ message: "User not found"});
      }

      res.status(200).send({message: getUser.local.profileImage.localPath});
    }
}