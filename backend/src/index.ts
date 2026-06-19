import { app } from './app';
import { prisma } from './lib/prisma';

const PORT = process.env.PORT || 3001;

async function main() {
  await prisma.$connect();
  console.log('✅ Banco de dados conectado');

  app.listen(PORT, () => {
    console.log(`🚀 VN Life Style API rodando na porta ${PORT}`);
    console.log(`📖 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
}

main().catch((err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});
