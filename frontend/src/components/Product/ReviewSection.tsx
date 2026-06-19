import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { productApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: { name: string };
}

interface ReviewData {
  reviews: Review[];
  average: number;
  total: number;
}

function Stars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={interactive ? 'button' : undefined}
          onClick={interactive && onChange ? () => onChange(star) : undefined}
          onMouseEnter={interactive ? () => setHover(star) : undefined}
          onMouseLeave={interactive ? () => setHover(0) : undefined}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          disabled={!interactive}
        >
          <Star
            size={interactive ? 20 : 14}
            className={`transition-colors ${
              star <= (hover || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-border fill-none'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = () => {
    productApi
      .getReviews(productId)
      .then(({ data: d }) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReviews(); }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await productApi.createReview(productId, { rating, comment: comment.trim() || undefined });
      toast.success('Avaliação enviada!');
      setComment('');
      setRating(5);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="mt-12 pt-10 border-t border-border">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-lg font-semibold text-text-primary">Avaliações</h2>
        {data && data.total > 0 && (
          <div className="flex items-center gap-2">
            <Stars rating={Math.round(data.average)} />
            <span className="text-text-primary font-semibold">{data.average}</span>
            <span className="text-text-muted text-sm">({data.total} avaliações)</span>
          </div>
        )}
      </div>

      {user && (
        <div className="card p-5 mb-6">
          <h3 className="text-sm font-medium text-text-secondary mb-4">Escrever uma avaliação</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <p className="text-xs text-text-muted mb-2">Sua nota</p>
              <Stars rating={rating} interactive onChange={setRating} />
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">Comentário (opcional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Conte sua experiência com este produto..."
                className="input-field w-full resize-none text-sm"
              />
            </div>
            <Button type="submit" loading={submitting} size="sm">
              Enviar avaliação
            </Button>
          </form>
        </div>
      )}

      {!data || data.total === 0 ? (
        <p className="text-text-muted text-sm">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
      ) : (
        <div className="space-y-4">
          {data.reviews.map((review) => (
            <div key={review.id} className="border-b border-border pb-4 last:border-0">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text-primary">{review.user.name}</span>
                  <Stars rating={review.rating} />
                </div>
                <span className="text-xs text-text-muted">
                  {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              {review.comment && (
                <p className="text-sm text-text-secondary">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
