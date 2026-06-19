import { Router } from 'express';
import { createOrder, listOrders, getOrder, updateOrderStatus, validateCoupon, cancelOrder } from '../controllers/orderController';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = Router();

router.use(authenticate);

router.get('/validate-coupon', validateCoupon);
router.post('/', createOrder);
router.get('/', listOrders);
router.get('/:id', getOrder);
router.put('/:id/status', isAdmin, updateOrderStatus);
router.post('/:id/cancel', cancelOrder);

export default router;
