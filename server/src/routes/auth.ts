import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { Workspace } from '../models/Workspace';
import { signToken, authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/auth/register-admin  — first admin creates workspace
router.post('/register-admin', async (req: Request, res: Response) => {
  try {
    const { email, password, name, workspaceName } = req.body;
    if (!email || !password || !name || !workspaceName) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }
    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }
    // create workspace first with a temp ObjectId, then update
    const workspace = await Workspace.create({ name: workspaceName, createdBy: new (require('mongoose').Types.ObjectId)() });
    const user = await User.create({ email, password, name, role: 'admin', workspaceId: workspace._id });
    workspace.createdBy = user._id;
    await workspace.save();
    const token = signToken(user._id, workspace._id, user.role);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, workspaceId: workspace._id } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const token = signToken(user._id, user.workspaceId, user.role);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role, workspaceId: user.workspaceId } });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, workspaceId: user.workspaceId });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
