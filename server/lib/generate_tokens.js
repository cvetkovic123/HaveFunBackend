const JWT = require('jsonwebtoken');

/**
 * @param {*} user - The user object.  We need this to set the JWT `sub` payload property to the MongoDB user ID
 */

module.exports = {
    signToken: (body) => {
        return JWT.sign({
          iss: "HaveFun",
          sub: body.id,
          name: body.local.name,
          email: body.local.email,
          iat: new Date().getTime(),
          exp: new Date().setDate(new Date().getDate() + 1)
        }, process.env.USER_JWT_KEY);
      },

    passwordResetToken: (body) => {
    return JWT.sign({
        iss: "HaveFun",
        sub: body.email,
        iat: new Date().getTime(),
        exp: new Date().setDate(new Date().getDate()) + 450000
    }, process.env.PASSWORD_RESET_JWT_KEY)
    }
}
