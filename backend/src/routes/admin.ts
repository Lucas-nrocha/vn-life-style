import { Router } from 'express';
import {
  getDashboard,
  adminListOrders,
  adminListProducts,
  adminListUsers,
  createCategory,
  updateCategory,
  listCategories,
  addTrackingCode,
  refundOrder,
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  exportOrdersCsv,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

router.use(authenticate, isAdmin);

router.get('/dashboard', getDashboard);
router.get('/orders', adminListOrders);
router.get('/orders/export-csv', exportOrdersCsv);
router.get('/products', adminListProducts);
router.get('/users', adminListUsers);
router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.put('/orders/:id/tracking', addTrackingCode);
router.post('/orders/:id/refund', refundOrder);
router.get('/coupons', listCoupons);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

export default router;
