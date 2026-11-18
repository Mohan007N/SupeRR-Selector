import axios from 'axios'
import { API_BASE_URL } from '../config.js'

// Shared Axios instance. Base URL comes from VITE_API_BASE_URL.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

// Turn any Axios failure into a readable Error for the UI's error states.
apiClient.interceptors.response.use(
  function onSuccess(response) {
    return response
  },
  function onFailure(error) {
    let message = 'Could not reach the analytics API.'
    if (error.response) {
      const detail = error.response.data && error.response.data.detail
      message = 'API error ' + error.response.status + (detail ? ': ' + String(detail) : '')
    } else if (error.code === 'ECONNABORTED') {
      message = 'The analytics API took too long to respond.'
    }
    return Promise.reject(new Error(message))
  },
)
