export function getApiErrorMessage(error) {
  if (error.response?.data) {
    if (error.response.data.errors && error.response.data.errors.length > 0) {
      return error.response.data.errors[0].message
    }
    if (error.response.data.message) {
      return error.response.data.message
    }
  }
  if (error.message) {
    return error.message
  }
  return 'Ocurrió un error inesperado.'
}
