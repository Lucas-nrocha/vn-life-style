import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { productApi } from '../services/api';
import { ProductCard } from '../components/Product/ProductCard';
import { SkeletonList } from '../components/ui/SkeletonCard';

export function Home() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi
      .list({ featured: true, limit: 4 })
      .then(({ data }) => setFeatured(data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main>
      <section className="relative min-h-[80vh] flex items-center bg-gradient-to-br from-background via-surface to-background overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="container-app relative z-10">
          <div className="max-w-2xl animate-slide-up">
            <span className="text-xs font-semibold tracking-[0.3em] text-text-muted uppercase mb-6 block">
              Nova Coleção 2024
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-text-primary leading-[1.1] mb-6">
              ESTILO
              <br />
              <span className="text-text-muted">SEM</span>
              <br />
              LIMITES
            </h1>
            <p className="text-text-secondary text-lg mb-8 max-w-md leading-relaxed">
              Roupas masculinas premium para o homem que sabe o que quer. Qualidade, conforto e estilo em cada peça.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/produtos" className="btn-primary inline-flex items-center gap-2 text-base">
                Explorar Coleção
                <ArrowRight size={18} />
              </Link>
              <Link to="/produtos?featured=true" className="btn-outline inline-flex items-center gap-2 text-base">
                Ver Destaques
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface border-y border-border py-6">
        <div className="container-app">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: 'Frete Grátis', desc: 'Compras acima de R$ 299' },
              { icon: Shield, title: 'Pagamento Seguro', desc: 'Ambiente 100% protegido' },
              { icon: RefreshCw, title: 'Troca Fácil', desc: 'Até 30 dias após a compra' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                  <Icon size={18} className="text-text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary text-sm">{title}</p>
                  <p className="text-text-muted text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app py-16">
        <div className="flex items-center justify-between mb-10">
          <h2 className="section-title">Destaques</h2>
          <Link to="/produtos?featured=true" className="text-text-secondary hover:text-text-primary text-sm font-medium flex items-center gap-1 transition-colors">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <SkeletonList count={4} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="container-app pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Camisetas', slug: 'camisetas', desc: 'Do básico ao exclusivo' },
            { name: 'Calças', slug: 'calcas', desc: 'Conforto e estilo' },
            { name: 'Jaquetas', slug: 'jaquetas', desc: 'Para todas as estações' },
          ].map(({ name, slug, desc }) => (
            <Link
              key={slug}
              to={`/produtos?category=${slug}`}
              className="group relative overflow-hidden rounded-lg bg-surface border border-border p-8 hover:border-border-light transition-all duration-300"
            >
              <p className="text-text-muted text-sm mb-1">{desc}</p>
              <h3 className="text-2xl font-bold text-text-primary group-hover:text-accent transition-colors">
                {name}
              </h3>
              <ArrowRight
                size={20}
                className="absolute bottom-8 right-8 text-text-muted group-hover:text-text-primary group-hover:translate-x-1 transition-all"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-surface border-t border-border py-16">
        <div className="container-app text-center">
          <h2 className="section-title mb-4">Use o cupom <span className="text-text-secondary">VNBEMVINDO</span></h2>
          <p className="text-text-muted mb-6">10% de desconto na sua primeira compra acima de R$ 100</p>
          <Link to="/produtos" className="btn-primary">
            Aproveitar Agora
          </Link>
        </div>
      </section>
    </main>
  );
}
