import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadMedia } from '../middleware/upload.middleware';
import * as StoryController from '../controllers/story.controller';

const router = Router();

router.use(authenticate);

router.post('/', uploadMedia.single('media'), StoryController.createStory);
router.get('/feed', StoryController.getStoryFeed);
router.delete('/:id', StoryController.deleteStory);

export default router;
