

// RESPONSE ENVELOPE (ERROR)
function errorResponse(res, message, status = 500, error = null) {
    return res.status(status).json({
        success: false,
        message,
        data: null,
        error,
    })
}

