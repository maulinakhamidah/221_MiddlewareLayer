

// MIDDLEWARE VALIDATION BODY
function validateBody(schema) {
    return (req, res, next) => {
        const { value, error } = schema.validate(req.body, { 
            abortEarly: false,
            convert: true,
            allowUnknown: false,
        })

      