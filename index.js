

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

