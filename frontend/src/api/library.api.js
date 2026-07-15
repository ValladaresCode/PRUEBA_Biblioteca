import { libraryApi } from './http'

export function listBooks(filters = {}) {
  return libraryApi.get('/books', { params: filters })
}

export function createBook(payload) {
  return libraryApi.post('/books', payload)
}

export function updateBook(id, payload) {
  return libraryApi.put(`/books/${id}`, payload)
}

export function deleteBook(id) {
  return libraryApi.delete(`/books/${id}`)
}

export function listLoans(status) {
  const params = status ? { status } : {}
  return libraryApi.get('/loans', { params })
}

export function createLoan(payload) {
  return libraryApi.post('/loans', payload)
}

export function returnLoan(loanId) {
  return libraryApi.post('/returns', { loanId })
}
