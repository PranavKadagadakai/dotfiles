import api from './api';

export const getBookReviews = (bookId) => api.get(`/books/${bookId}/reviews`);
export const addReview = (bookId, data) => api.post(`/books/${bookId}/reviews`, data);