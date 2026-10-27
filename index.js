

const idSchema = joi.object({
    id: joi.number().integer().positive().required()
})

