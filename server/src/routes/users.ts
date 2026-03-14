import { Router, Response } from 'express';
import { User } from '../models/User';
import { authenticate, requireAdmin, AuthRequest, signToken } from '../middleware/auth';
import { Types } from 'mongoose';

const router = Router();
router.use(authenticate);

// GET /api/users — list workspace users (admin)
router.get('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  const users = await User.find({ workspaceId: req.user!.workspaceId }).select('-password');
  res.json(users);
});

// POST /api/users — admin creates a collaborator
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) { res.status(400).json({ message: 'email, password, name required' }); return; }
    const existing = await User.findOne({ email });
    if (existing) { res.status(409).json({ message: 'Email already in use' }); return; }
    const user = await User.create({
      email, password, name,
      role: role === 'admin' ? 'admin' : 'collaborator',
      workspaceId: new Types.ObjectId(req.user!.workspaceId),
    });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role, workspaceId: user.workspaceId });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/:id
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const user = await User.findOne({ _id: req.params.id, workspaceId: req.user!.workspaceId });
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }
  await user.deleteOne();
  res.json({ message: 'Deleted' });
});

export default router;
