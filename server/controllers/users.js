const { User } = require('../models/user');
const JWT = require('jsonwebtoken');
const mailgun = require('mailgun-js')({apiKey: process.env.MAILGUN_API_KEY, domain: process.env.MAILGUN_DOMAIN_NAME});

signToken = (body) => {
  console.log('body', body.local.email);
  return JWT.sign({
    iss: "HaveFun",
    sub: body.id,
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

      const data = {
        from: 'alexanderGrieves42@gmail.com',
        to: 'bojan.cvetkovic337@gmail.com',
        subject: 'HaveFun activation link',
        text: `
        <p>${process.env.CLIENT_URL}/auth/activate?id=${token}</p>
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

    secret: async(req, res, next) => {
      res.status(200).send(`UsersContoller secret called!`);
    }
}