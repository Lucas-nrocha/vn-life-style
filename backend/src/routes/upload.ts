import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';
import { uploadImage } from '../middleware/upload';
import { uploadProductImage } from '../controllers/uploadController';

const router = Router();

router.post('/produtos', authenticate, isAdmin, uploadImage.single('image'), uploadProductImage);

export default router;
