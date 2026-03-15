import { Router, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { Workspace } from '../models/Workspace';
import { User } from '../models/User';
import { Types } from 'mongoose';

const router = Router();
router.use(authenticate);

// GET /api/settings — workspace email settings
router.get('/', async (req: AuthRequest, res: Response) => {
  const workspace = await Workspace.findById(req.user!.workspaceId);
  if (!workspace) { res.status(404).json({ message: 'Workspace not found' }); return; }
  res.json(workspace.emailSettings ?? { defaultSenderUserId: null, sectionTypesToInclude: [] });
});

// PATCH /api/settings — update email settings (admin only)
router.patch('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { defaultSenderUserId, sectionTypesToInclude } = req.body;
  const workspace = await Workspace.findById(req.user!.workspaceId);
  if (!workspace) { res.status(404).json({ message: 'Workspace not found' }); return; }

  if (defaultSenderUserId !== undefined) {
    if (defaultSenderUserId === null) {
      workspace.emailSettings.defaultSenderUserId = null;
    } else {
      const user = await User.findOne({ _id: defaultSenderUserId, workspaceId: req.user!.workspaceId });
      if (!user) { res.status(400).json({ message: 'User not found' }); return; }
      workspace.emailSettings.defaultSenderUserId = new Types.ObjectId(defaultSenderUserId);
    }
  }
  if (Array.isArray(sectionTypesToInclude)) {
    workspace.emailSettings.sectionTypesToInclude = sectionTypesToInclude;
  }
  await workspace.save();
  res.json(workspace.emailSettings);
});

export default router;
