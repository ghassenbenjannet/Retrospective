import { Router, Response } from 'express';
import { Session } from '../models/Session';
import { Template } from '../models/Template';
import { User } from '../models/User';
import { Card } from '../models/Card';
import { Action } from '../models/Action';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';

const router = Router();
router.use(authenticate);

// GET /api/sessions
router.get('/', async (req: AuthRequest, res: Response) => {
  const sessions = await Session.find({ workspaceId: req.user!.workspaceId }).sort({ createdAt: -1 });
  res.json(sessions);
});

// GET /api/sessions/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const s = await Session.findOne({ _id: req.params.id, workspaceId: req.user!.workspaceId });
  if (!s) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(s);
});

// POST /api/sessions (admin)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, templateId, participantIds, maxActions } = req.body;
    const template = await Template.findOne({ _id: templateId, workspaceId: req.user!.workspaceId, status: 'active' });
    if (!template) { res.status(400).json({ message: 'Template not found or not active' }); return; }

    const users = await User.find({ _id: { $in: participantIds }, workspaceId: req.user!.workspaceId });
    const participants = users.map(u => ({
      userId: u._id,
      name: u.name,
      status: 'invited' as const,
      remainingVotes: template.initialVotes,
      socketId: null,
      joinedAt: null,
    }));

    const session = await Session.create({
      name,
      workspaceId: new Types.ObjectId(req.user!.workspaceId),
      templateId: template._id,
      templateSnapshot: {
        name: template.name,
        sections: template.sections,
        initialVotes: template.initialVotes,
        allowMultipleVotesPerCard: template.allowMultipleVotesPerCard,
        theme: template.theme,
      },
      participants,
      maxActions: maxActions ?? 3,
      createdBy: new Types.ObjectId(req.user!.userId),
    });
    res.status(201).json(session);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/sessions/:id/status (admin)
router.patch('/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const allowed = ['draft', 'planned', 'lobby', 'active', 'finished', 'archived'];
  if (!allowed.includes(status)) { res.status(400).json({ message: 'Invalid status' }); return; }
  const s = await Session.findOneAndUpdate(
    { _id: req.params.id, workspaceId: req.user!.workspaceId },
    { status },
    { new: true }
  );
  if (!s) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(s);
});

// GET /api/sessions/:id/cards
router.get('/:id/cards', async (req: AuthRequest, res: Response) => {
  const cards = await Card.find({ sessionId: req.params.id });
  res.json(cards);
});

// GET /api/sessions/:id/actions
router.get('/:id/actions', async (req: AuthRequest, res: Response) => {
  const actions = await Action.find({ sessionId: req.params.id });
  res.json(actions);
});

export default router;
