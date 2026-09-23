import { defineConfig } from 'vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

// O WebXR exige contexto seguro (HTTPS), inclusive na rede local, para abrir
// sessão de visor (Meta Quest e afins) ou de câmera (celular AR). O plugin
// basicSsl gera um certificado autoassinado, e é o que permite abrir a MESMA
// URL no desktop, no celular e no visor — que é como a Seção 9 pede para
// comparar os três regimes.
export default defineConfig({
  plugins: [basicSsl()],
  server: {
    host: true, // escuta em 0.0.0.0 -> acessível pelos outros aparelhos da rede
    port: 5173,
    // Aceita o host do túnel (ex.: *.trycloudflare.com) quando a página é
    // servida por uma URL pública, e não pelo IP local.
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
  },
});
