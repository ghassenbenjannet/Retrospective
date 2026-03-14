import { Router, Response } from 'express';
import { Template } from '../models/Template';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';

const router = Router();
router.use(authenticate);

// GET /api/templates
router.get('/', async (req: AuthRequest, res: Response) => {
  const templates = await Template.find({ workspaceId: req.user!.workspaceId });
  res.json(templates);
});

// GET /api/templates/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const t = await Template.findOne({ _id: req.params.id, workspaceId: req.user!.workspaceId });
  if (!t) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(t);
});

// POST /api/templates (admin)
router.post('/', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const t = await Template.create({
      ...req.body,
      workspaceId: new Types.ObjectId(req.user!.workspaceId),
      createdBy: new Types.ObjectId(req.user!.userId),
    });
    res.status(201).json(t);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/templates/:id (admin)
router.put('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const t = await Template.findOneAndUpdate(
    { _id: req.params.id, workspaceId: req.user!.workspaceId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!t) { res.status(404).json({ message: 'Not found' }); return; }
  res.json(t);
});

// DELETE /api/templates/:id (admin)
router.delete('/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
  const t = await Template.findOneAndDelete({ _id: req.params.id, workspaceId: req.user!.workspaceId });
  if (!t) { res.status(404).json({ message: 'Not found' }); return; }
  res.json({ message: 'Deleted' });
});

// POST /api/templates/:id/duplicate (admin)
router.post('/:id/duplicate', requireAdmin, async (req: AuthRequest, res: Response) => {
  const src = await Template.findOne({ _id: req.params.id, workspaceId: req.user!.workspaceId });
  if (!src) { res.status(404).json({ message: 'Not found' }); return; }
  const copy = await Template.create({
    name: `${src.name} (copy)`,
    workspaceId: src.workspaceId,
    createdBy: new Types.ObjectId(req.user!.userId),
    status: 'draft',
    sections: src.sections,
    initialVotes: src.initialVotes,
    allowMultipleVotesPerCard: src.allowMultipleVotesPerCard,
    theme: src.theme,
  });
  res.status(201).json(copy);
});

export default router;
