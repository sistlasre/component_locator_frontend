import axios from 'axios';

// Base API URL - update this with your actual API Gateway URL
const API_BASE_URL = 'https://obkg1pw61g.execute-api.us-west-2.amazonaws.com/prod';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('component-locator-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          // Remove the Authorization header if it already exists
          if (config.headers.Authorization) {
            delete config.headers.Authorization;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('component-locator-token');
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.api.defaults.headers.common['Authorization'];
    }
  }

  // Authentication endpoints
  async login(username, password) {
    return this.api.post('/user/signin', { username, password });
  }

  async register(email, password, firstName='', lastName='') {
    return this.api.post('/user/register', {
      email,
      password,
      firstName,
      lastName
    });
  }

  async createSupplier(payload) {
    return this.api.post('/supplier/create', payload);
  }

  async search(field, searchValue, searchType, searchSource='search_bar') {
    return this.api.post('/search', {
        search_type: searchType,
        search_source: searchSource,
        field,
        field_value: searchValue
    });
  }

  async verifyUser() {
    return this.api.get('/user/verify');
  }

}

export const apiService = new ApiService();
