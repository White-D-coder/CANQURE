export class BaseController {
    success(res, data, message = "Success", statusCode = 200) {
        return res.status(statusCode).json(data);
    }

    error(res, message = "Internal Server Error", statusCode = 500, error = null) {
        if (error) {
            console.error(message, error);
        }
        return res.status(statusCode).json({ message, error: error ? error.message : null });
    }
}
