import { useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { ProductFilters } from '../../types';

const SIZES = ['P', 'M', 'G', 'GG', '38', '40', '42', '44'];
const COLORS = ['Preto', 'Branco', 'Grafite', 'Azul Marinho', 'Caqui'];

interface ProductFilterProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
}

export function ProductFilter({ filters, onChange }: ProductFilterProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const applyFilters = () => {
    onChange(localFilters);
    setOpen(false);
  };

  const clearFilters = () => {
    const cleared: ProductFilters = {};
    setLocalFilters(cleared);
    onChange(cleared);
    setOpen(false);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
          hasActiveFilters
            ? 'border-accent text-text-primary bg-surface-2'
            : 'border-border text-text-secondary hover:text-text-primary hover:border-border-light'
        }`}
      >
        <SlidersHorizontal size={16} />
        Filtros
        {hasActiveFilters && (
          <span className="bg-accent text-background text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
            •
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full sm:w-80 bg-surface border-l border-border z-50 flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-text-primary">Filtros</h2>
              <button onClick={() => setOpen(false)} className="text-text-secondary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3 uppercase tracking-wider">
                  Preço
                </h3>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Mín"
                    value={localFilters.minPrice || ''}
                    onChange={(e) => setLocalFilters({ ...localFilters, minPrice: Number(e.target.value) || undefined })}
                    className="input-field text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Máx"
                    value={localFilters.maxPrice || ''}
                    onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: Number(e.target.value) || undefined })}
                    className="input-field text-sm"
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3 uppercase tracking-wider">
                  Tamanho
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() =>
                        setLocalFilters({
                          ...localFilters,
                          size: localFilters.size === size ? undefined : size,
                        })
                      }
                      className={`py-2 text-sm rounded border transition-colors ${
                        localFilters.size === size
                          ? 'border-accent bg-accent text-background font-medium'
                          : 'border-border text-text-secondary hover:border-border-light'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-primary mb-3 uppercase tracking-wider">
                  Cor
                </h3>
                <div className="space-y-2">
                  {COLORS.map((color) => (
                    <label key={color} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="color"
                        checked={localFilters.color === color}
                        onChange={() =>
                          setLocalFilters({
                            ...localFilters,
                            color: localFilters.color === color ? undefined : color,
                          })
                        }
                        className="accent-white"
                      />
                      <span className="text-sm text-text-secondary">{color}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localFilters.featured === true}
                    onChange={(e) =>
                      setLocalFilters({ ...localFilters, featured: e.target.checked || undefined })
                    }
                    className="accent-white"
                  />
                  <span className="text-sm text-text-secondary">Apenas destaques</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button onClick={clearFilters} className="btn-outline flex-1">
                Limpar
              </button>
              <button onClick={applyFilters} className="btn-primary flex-1">
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
