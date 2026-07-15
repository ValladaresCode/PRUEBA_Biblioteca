import { validationResult } from 'express-validator'

export const handleValidationErrors = (req, res, next) => {
  const result = validationResult(req)

  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Los datos enviados no son válidos',
      errors: result.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    })
  }

  return next()
}
