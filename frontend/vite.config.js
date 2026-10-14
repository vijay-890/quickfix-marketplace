import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const tunnelHost = process.env.QUICKFIX_TUNNEL_HOST?.trim();
export default defineConfig({ plugins: [react()], server: { port: 5173, allowedHosts: tunnelHost ? [tunnelHost] : [], proxy: { '/api': 'http://localhost:5000', '/uploads': 'http://localhost:5000', '/socket.io': { target: 'http://localhost:5000', ws: true } } } });
