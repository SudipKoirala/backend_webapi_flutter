import { Router } from 'express';
import * as PostController from '../controllers/post.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadMedia } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/', uploadMedia.single('media'), PostController.createPost);
router.get('/feed', PostController.getFeed);
router.delete('/:id', PostController.deletePost);
router.post('/:id/like', PostController.likePost);
router.post('/:id/comments', PostController.addComment);
router.get('/:id/comments', PostController.getComments);

export default router;
