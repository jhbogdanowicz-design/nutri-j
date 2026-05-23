import { spawn } from 'child_process';
import path from 'path';

console.log('📦 Inicializando o Nutri J no Windows...');

// 1. Iniciar o servidor local de IA do Node (Porta 3001)
const apiServer = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

// 2. Iniciar o servidor Vite (Porta 3000 / 5173 / etc. com proxy configurado)
const viteServer = spawn('npx', ['vite', '--open'], {
  stdio: 'inherit',
  shell: true
});

// Monitorar encerramento de processos para garantir desligamento limpo
const cleanExit = () => {
  console.log('\n🛑 Encerrando servidores do Nutri J...');
  try {
    apiServer.kill();
  } catch (e) {}
  try {
    viteServer.kill();
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanExit);
process.on('SIGTERM', cleanExit);
apiServer.on('exit', cleanExit);
viteServer.on('exit', cleanExit);
