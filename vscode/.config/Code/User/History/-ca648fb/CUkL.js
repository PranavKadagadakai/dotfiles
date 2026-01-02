import api from './api';

export const getBooks = (page = 1) => api.get(`/books?page=${page}`);
export const getBook = (id) => api.get(`/books/${id}`);