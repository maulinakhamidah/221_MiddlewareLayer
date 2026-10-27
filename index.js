

// RESPONSE ENVELOPE 
function successResponse(res, message, data = null, status = 200) {
    return res.status(status).json({
        success: true,
        message,
        data,
        error: null,
    })
}

