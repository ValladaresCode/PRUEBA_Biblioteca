import cors from 'cors';

const ACCEPTED_ORIGINS = [
  'https://banco-movil.up.railway.app',
  'http://localhost:3000',
  'http://localhost:4200',
  'http://localhost:5173'
];

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Permitir explícitamente los orígenes listados y peticiones sin origen (como Postman o curl)
    if (!origin || ACCEPTED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    // En caso de que se necesite admitir de forma global temporalmente:
    return callback(null, origin || '*');
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'x-token'
  ]
});
