const Joi = require('@hapi/joi');

module.exports = { 
    schemas: {
        signUpSchema : Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            password: Joi.string().required()
        }),
    
        signInSchema : Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
        })
    },

    validateBody: (schema) => {
        return (req, res, next) => {
            const validate = schema.validate(req.body);
            if (validate.error) {
            res.status(400).send(validate.error.details[0].message);
          }
          if (!req.value) { req.value = {} };
          req.value['body'] = validate.value;
          next();
        }
    }
}   