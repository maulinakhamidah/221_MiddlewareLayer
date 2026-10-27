

// JOI SCHEMAS
const biodataSchema = joi.object({
    id: joi.number().integer().positive(),
    nama: joi.string().trim().min(2).max(100).required(),
    nim: joi.string().trim().min(1).max(20).required(),
    kelas: joi.string().trim().min(1).max(20).required(),
})

