const Joi = require('@hapi/joi');

module.exports = { 
    schemas: {
        signUpSchema: Joi.object({
            name: Joi.string().min(5).max(25),
            email: Joi.string().email(),
            password: Joi.string().min(6).max(25)
        }),
    
        signInSchema: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        }),

        postsSchema: Joi.object({
            title: Joi.string().required()
        }),

        comment: Joi.object({
            postId: Joi.string().min(24).max(24).required(),
            comment: Joi.string().max(500).required()
        }),

        passwordReset: Joi.object({
            email: Joi.string().min(5).max(25).required(),
            password: Joi.string().min(5).max(25).required(),
            newPassword: Joi.string().min(5).max(25).required()
        }),

        nameReset: Joi.object({
            name: Joi.string().min(5).max(25)
        }),

        forgotPassword: Joi.object({
            email: Joi.string().email().required()
        }),

        forgotChangePassword: Joi.object({
            email: Joi.string().email().required(),
            newPassword: Joi.string().min(5).max(25).required()
        })
    },

    validateBody: (schema) => {
        return (req, res, next) => {
            const validate = schema.validate(req.body);
            if (validate.error) {
            return res.status(400).send(validate.error.details[0].message);
          }
          if (!req.value) { req.value = {} };
          req.value['body'] = validate.value;
          next();
        }
    }
}   