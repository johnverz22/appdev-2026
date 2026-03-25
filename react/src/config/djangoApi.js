import axios from 'axios';

const djangoApi = axios.create({
    baseURL: import.meta.env.VITE_DJANGO_API_URL || 'http://localhost:8082',
    withCredentials: true,   // sends the HttpOnly 'jwt' cookie set by Spring Boot
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default djangoApi;
