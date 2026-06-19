import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addVariant,
  updateVariant,
  deleteVariant,
} from '../controllers/productController';
import { getProductReviews, createReview, deleteReview } from '../controllers/reviewController';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', authenticate, isAdmin, createProduct);
router.put('/:id', authenticate, isAdmin, updateProduct);
router.delete('/:id', authenticate, isAdmin, deleteProduct);

router.post('/:id/variants', authenticate, isAdmin, addVariant);
router.put('/:id/variants/:variantId', authenticate, isAdmin, updateVariant);
router.delete('/:id/variants/:variantId', authenticate, isAdmin, deleteVariant);

router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', authenticate, createReview);
router.delete('/:id/reviews', authenticate, deleteReview);

export default router;
