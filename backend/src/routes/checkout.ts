import { Router } from 'express';
import { createPayment, webhook, getOrderStatus } from '../controllers/checkoutController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/create-payment', authenticate, createPayment);
router.post('/webhook', webhook);
router.get('/order-status/:orderId', authenticate, getOrderStatus);

export default router;
