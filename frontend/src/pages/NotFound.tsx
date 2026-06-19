import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <main className="container-app py-32 text-center">
      <p className="text-8xl font-bold text-surface-2 mb-4">404</p>
      <h1 className="text-2xl font-bold text-text-primary mb-2">Página não encontrada</h1>
      <p className="text-text-muted mb-8">A página que você está procurando não existe.</p>
      <Link to="/" className="btn-primary">Voltar ao início</Link>
    </main>
  );
}
