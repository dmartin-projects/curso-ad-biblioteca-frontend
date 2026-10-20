export const environment = {
  production: true,
  apiUrl: '/api/v1', // mismo dominio con nginx
  wsUrl: '/ws', // relativa: wss:// y el host salen de la página al conectar (NotificacionesWs)
  sentryDsn: '', // el DSN es público: puede ir aquí
};
