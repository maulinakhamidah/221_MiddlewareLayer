import express from 'express'
import pg from 'pg'
import joi from 'joi'

const app = express()
const port = 3000
const { Pool } = pg

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'mahasiswa',
    password: 'maulina123',
    port: 5432
})

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// MIDDLEWARE
app.use((req, res, next) => {
    const start = Date.now()

    res.on('finish', () => {
        const duration = Date.now() - start 

        console.log({
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`
        })
    })

    next()
})

// RESPONSE ENVELOPE 
function successResponse(res, message, data = null, status = 200) {
    return res.status(status).json({
        success: true,
        message,
        data,
        error: null,
    })
}

// RESPONSE ENVELOPE (ERROR)
function errorResponse(res, message, status = 500, error = null) {
    return res.status(status).json({
        success: false,
        message,
        data: null,
        error,
    })
}

// JOI SCHEMAS
const biodataSchema = joi.object({
    id: joi.number().integer().positive(),
    nama: joi.string().trim().min(2).max(100).required(),
    nim: joi.string().trim().min(1).max(20).required(),
    kelas: joi.string().trim().min(1).max(20).required(),
})

const idSchema = joi.object({
    id: joi.number().integer().positive().required()
})

// MIDDLEWARE VALIDATION BODY
function validateBody(schema) {
    return (req, res, next) => {
        const { value, error } = schema.validate(req.body, { 
            abortEarly: false,
            convert: true,
            allowUnknown: false,
        })

        if (error) {
            return errorResponse(
                res, 
                'Validation error', 
                400, 
                error.details.map(item => ({
                    field: item.path.join('.'),
                    message: item.message,
                }))
            )
        }

        req.body = value
        next()
    }
}

// MIDDLEWARE VALIDATION PARAMETER
function validateParams(schema) {
    return (req, res, next) => {
        const { value, error } = schema.validate(req.params, { 
            abortEarly: false,
            convert: true,
            allowUnknown: false,
        })

        if (error) {
            return errorResponse(
                res, 
                'Parameter tidak valid', 
                400, 
                error.details.map(item => ({
                    field: item.path.join('.'),
                    message: item.message,
                }))
            )
        }

        req.params = value
        next()
    }
}

// METHOD GET (Mendapatkan semua data)
app.get('/biodata', async (req, res) => {
    const result = await pool.query(
        'SELECT * FROM biodata ORDER BY id'
    )

    return successResponse(res, 'Data berhasil diambil', result.rows)
})

// METHOD POST (Menambah data ke /biodata)
app.post(
    '/biodata', 
    validateBody(biodataSchema), 
    async (req, res) => {
        const { id, nama, nim, kelas } = req.body

        let result
        if (id) {
            result = await pool.query(
                'INSERT INTO biodata (id, nama, nim, kelas) VALUES ($1, $2, $3, $4) RETURNING *',
                [id, nama, nim, kelas]
            )
        } else {
            result = await pool.query(
                'INSERT INTO biodata (nama, nim, kelas) VALUES ($1, $2, $3) RETURNING *',
                [nama, nim, kelas]
            )
        }

        return successResponse(
            res, 
            'Data berhasil ditambahkan', 
            result.rows[0], 
            201
        )
    }
)

// METHOD PUT (Mengubah data berdasarkan ID)
app.put(
    '/biodata/:id',
    validateParams(idSchema),
    validateBody(biodataSchema.fork(
        ['nama', 'nim', 'kelas'], 
        field => field.optional()
    ).fork(['id'], field => field.forbidden())),
    async (req, res) => {
        const { id } = req.params
        const { nama, nim, kelas } = req.body

        const result = await pool.query(
            'UPDATE biodata SET nama = COALESCE($1, nama), nim = COALESCE($2, nim), kelas = COALESCE($3, kelas) WHERE id = $4 RETURNING *',
            [nama, nim, kelas, id]
        )

        if (result.rowCount === 0) {
            return errorResponse(res, 'Data tidak ditemukan', 404)
        }

        return successResponse(
            res, 
            'Data berhasil diupdate',
            result.rows[0]
        )
    }
)

// METHOD DELETE (Menghapus data berdasarkan ID)
app.delete(
    '/biodata/:id',
    validateParams(idSchema),
    async (req, res) => {
        const { id } = req.params

        const result = await pool.query(
            'DELETE FROM biodata WHERE id = $1 RETURNING *',
            [id]
        )

        if (result.rowCount === 0) {
            return errorResponse(res, 'Data tidak ditemukan', 404)
        }

        return successResponse(
            res,
            'Data berhasil dihapus',
            result.rows[0]
        )
    }
)

// ROUTE TIDAK DITEMUKAN (404)
app.use((req, res) => {
    return errorResponse(
        res,
        'Endpoint tidak ditemukan',
        404
    )
})

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error(err)

    if (res.headersSent) {
        return next(err)
    }

    return errorResponse(
        res,
        'Terjadi kesalahan pada server',
        500
    )
})

app.listen(port, () => {
    console.log(`App running on port ${port}`)
})