import { Router, Response } from 'express';
import { Server as SocketServer } from 'socket.io';
import { Action } from '../models/Action';
import { Card } from '../models/Card';
import { Session } from '../models/Session';
import { User } from '../models/User';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';

export function createActionRouter(io: SocketServer) {
const router = Router();
router.use(authenticate);

// GET /api/actions — all workspace actions
router.get('/', async (req: AuthRequest, res: Response) => {
  const actions = await Action.find({ workspaceId: req.user!.workspaceId }).sort({ createdAt: -1 });
  res.json(actions);
});

// POST /api/actions — convert card to action (admin)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, sessionId, sourceCardId, ownerId, dueDate, priority } = req.body;
    const session = await Session.findOne({ _id: sessionId, workspaceId: req.user!.workspaceId });
    if (!session) { res.status(404).json({ message: 'Session not found' }); return; }
    const owner = await User.findOne({ _id: ownerId, workspaceId: req.user!.workspaceId });
    if (!owner) { res.status(400).json({ message: 'Owner must belong to workspace' }); return; }
    if (sourceCardId) {
      const already = await Action.findOne({ sessionId, sourceCardId });
      if (already) { res.status(409).json({ message: 'Card already converted to action' }); return; }
    }
    const action = await Action.create({
      title, description,
      workspaceId: new Types.ObjectId(req.user!.workspaceId),
      sessionId: new Types.ObjectId(sessionId),
      sourceCardId: sourceCardId ? new Types.ObjectId(sourceCardId) : null,
      ownerId: owner._id,
      ownerName: owner.name,
      priority: priority ?? null,
      dueDate: dueDate ?? null,
      createdBy: new Types.ObjectId(req.user!.userId),
    });
    res.status(201).json(action);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/actions/:id — update status / owner (admin or owner)
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  const action = await Action.findOne({ _id: req.params.id, workspaceId: req.user!.workspaceId });
  if (!action) { res.status(404).json({ message: 'Not found' }); return; }
  const isAdmin = req.user!.role === 'admin';
  const isOwner = action.ownerId.toString() === req.user!.userId;
  if (!isAdmin && !isOwner) { res.status(403).json({ message: 'Forbidden' }); return; }
  const { status, dueDate, priority } = req.body;
  if (status) action.status = status;
  if (priority !== undefined) action.priority = priority;
  if (dueDate !== undefined) action.dueDate = dueDate;
  if (req.body.ownerId && isAdmin) {
    const owner = await User.findOne({ _id: req.body.ownerId, workspaceId: req.user!.workspaceId });
    if (!owner) { res.status(400).json({ message: 'Invalid owner' }); return; }
    action.ownerId = owner._id;
    action.ownerName = owner.name;
  }
  await action.save();
  // Broadcast to all connected clients in the session room
  io.to(action.sessionId.toString()).emit('action:updated', action);
  res.json(action);
});

return router;
}
