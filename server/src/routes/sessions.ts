import { Router, Response } from 'express';
import nodemailer from 'nodemailer';
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

    // Always include admin as first participant (they're the PO, they participate too)
    const adminUser = await User.findById(req.user!.userId);
    const otherIds = (participantIds ?? []).filter((pid: string) => pid !== req.user!.userId);
    const users = await User.find({ _id: { $in: otherIds }, workspaceId: req.user!.workspaceId });

    const participants: any[] = [
      {
        userId: new Types.ObjectId(req.user!.userId),
        name: adminUser?.name ?? 'Admin',
        status: 'invited' as const,
        remainingVotes: template.initialVotes,
        socketId: null,
        joinedAt: null,
      },
      ...users.map(u => ({
        userId: u._id,
        name: u.name,
        status: 'invited' as const,
        remainingVotes: template.initialVotes,
        socketId: null,
        joinedAt: null,
      })),
    ];

    const session = await Session.create({
      name,
      workspaceId: new Types.ObjectId(req.user!.workspaceId),
      templateId: template._id,
      templateSnapshot: {
        name: template.name,
        sections: template.sections,
        initialVotes: template.initialVotes,
        allowMultipleVotesPerCard: template.allowMultipleVotesPerCard,
        displayMode: template.displayMode ?? 'sections',
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

// POST /api/sessions/:id/send-email (admin)
router.post('/:id/send-email', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, workspaceId: req.user!.workspaceId });
    if (!session) { res.status(404).json({ message: 'Session not found' }); return; }

    const actions = await Action.find({ sessionId: req.params.id }).sort({ createdAt: 1 });

    // Get all participant users for their emails
    const participantIds = session.participants.map(p => p.userId);
    const users = await User.find({ _id: { $in: participantIds }, workspaceId: req.user!.workspaceId });
    const recipientEmails = users.map(u => u.email).filter(Boolean);

    if (recipientEmails.length === 0) {
      res.status(400).json({ message: 'No participant emails found' }); return;
    }

    const priorityLabel: Record<string, string> = {
      prio: '🔴 Prioritaire',
      top1: '🥇 Top 1',
      top2: '🥈 Top 2',
      top3: '🥉 Top 3',
    };

    const coverImage = session.templateSnapshot.theme.coverImage;

    // Build action table HTML
    const actionRows = actions.map(a => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${a.title}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${priorityLabel[a.priority as string] ?? '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${a.ownerName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${a.status === 'todo' ? '📋 À faire' : a.status === 'in_progress' ? '⏳ En cours' : a.status === 'done' ? '✅ Terminé' : '❌ Abandonné'}</td>
      </tr>`).join('');

    const emailHtml = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#4f46e5;margin-bottom:4px;">${session.name}</h2>
        <p style="color:#6b7280;margin-top:0;">Récapitulatif de la session rétrospective</p>
        ${coverImage ? `<img src="${coverImage}" alt="cover" style="width:100%;height:180px;object-fit:cover;border-radius:12px;margin-bottom:20px;" />` : ''}
        <h3 style="color:#111827;margin-bottom:12px;">Tableau des actions</h3>
        ${actions.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Action</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Priorité</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Responsable</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Statut</th>
            </tr>
          </thead>
          <tbody>${actionRows}</tbody>
        </table>
        ` : '<p style="color:#6b7280;">Aucune action définie pour cette session.</p>'}
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Envoyé depuis Retrospective Live</p>
      </div>
    `;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      to: recipientEmails.join(', '),
      subject: `Rétrospective : ${session.name}`,
      html: emailHtml,
    });

    res.json({ message: 'Emails envoyés avec succès', count: recipientEmails.length });
  } catch (err: any) {
    console.error('Email error:', err);
    res.status(500).json({ message: `Erreur d'envoi : ${err.message}` });
  }
});

export default router;
