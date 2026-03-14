import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Session } from '../models/Session';
import { Card } from '../models/Card';
import { Vote } from '../models/Vote';
import { Action } from '../models/Action';
import { User } from '../models/User';
import { Types } from 'mongoose';

interface AuthPayload { userId: string; workspaceId: string; role: string; }

// In-memory card game states per session
interface CardGameState {
  cards: Array<{ idx: number; question: string; answer: string; isFlipped: boolean; isAnswerRevealed: boolean }>;
  currentPlayerIdx: number;
  playerOrder: Array<{ userId: string; name: string }>;
  status: 'idle' | 'active' | 'finished';
  currentFlippedCardIdx: number | null;
}
const cardGames = new Map<string, CardGameState>();

export function registerSocketHandlers(io: Server): void {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;

    // Join session room
    socket.on('session:join', async ({ sessionId }: { sessionId: string }) => {
      try {
        const session = await Session.findOne({ _id: sessionId, workspaceId: user.workspaceId });
        if (!session) { socket.emit('error', { message: 'Session not found' }); return; }
        let participant = session.participants.find(p => p.userId.toString() === user.userId);

        if (!participant) {
          // Fallback: add user as participant if missing (shouldn't happen with new session creation)
          if (user.role === 'admin') {
            const adminUser = await User.findById(user.userId);
            session.participants.unshift({
              userId: new Types.ObjectId(user.userId),
              name: adminUser?.name ?? 'Admin',
              status: 'connected',
              remainingVotes: session.templateSnapshot.initialVotes,
              socketId: socket.id,
              joinedAt: new Date(),
            } as any);
            await session.save();
            participant = session.participants[0];
          } else {
            socket.emit('error', { message: 'Not a participant' }); return;
          }
        }

        socket.join(sessionId);
        if (participant) {
          participant.status = 'connected';
          participant.socketId = socket.id;
          participant.joinedAt = new Date();
          await session.save();
        }

        socket.emit('session:state', session);
        socket.emit('session:votes_updated', { remainingVotes: participant?.remainingVotes ?? 0 });
        io.to(sessionId).emit('session:participants', session.participants);

        // If card game is active, send current state
        const game = cardGames.get(sessionId);
        if (game) {
          socket.emit('cardgame:state', game);
        }
      } catch (err) {
        socket.emit('error', { message: 'Join failed' });
      }
    });

    // Admin: advance step
    socket.on('session:next_step', async ({ sessionId }: { sessionId: string }) => {
      if (user.role !== 'admin') return;
      const session = await Session.findOne({ _id: sessionId, workspaceId: user.workspaceId });
      if (!session) return;
      session.currentSectionIndex = Math.min(
        session.currentSectionIndex + 1,
        session.templateSnapshot.sections.length - 1
      );
      session.votingOpen = false;
      session.timerEndsAt = null;
      await session.save();
      io.to(sessionId).emit('session:step_changed', {
        currentSectionIndex: session.currentSectionIndex,
        votingOpen: session.votingOpen,
      });
    });

    // Admin: previous step
    socket.on('session:prev_step', async ({ sessionId }: { sessionId: string }) => {
      if (user.role !== 'admin') return;
      const session = await Session.findOne({ _id: sessionId, workspaceId: user.workspaceId });
      if (!session) return;
      session.currentSectionIndex = Math.max(0, session.currentSectionIndex - 1);
      await session.save();
      io.to(sessionId).emit('session:step_changed', { currentSectionIndex: session.currentSectionIndex });
    });

    // Admin: jump to section (for onepage mode navigation)
    socket.on('session:go_to_step', async ({ sessionId, index }: { sessionId: string; index: number }) => {
      if (user.role !== 'admin') return;
      const session = await Session.findOne({ _id: sessionId, workspaceId: user.workspaceId });
      if (!session) return;
      const clamped = Math.max(0, Math.min(index, session.templateSnapshot.sections.length - 1));
      session.currentSectionIndex = clamped;
      session.votingOpen = false;
      session.timerEndsAt = null;
      await session.save();
      io.to(sessionId).emit('session:step_changed', {
        currentSectionIndex: session.currentSectionIndex,
        votingOpen: session.votingOpen,
      });
    });

    // Admin: start timer
    socket.on('session:start_timer', async ({ sessionId, seconds }: { sessionId: string; seconds: number }) => {
      if (user.role !== 'admin') return;
      const session = await Session.findOneAndUpdate(
        { _id: sessionId, workspaceId: user.workspaceId },
        { timerEndsAt: new Date(Date.now() + seconds * 1000) },
        { new: true }
      );
      if (!session) return;
      io.to(sessionId).emit('session:timer_started', { timerEndsAt: session.timerEndsAt });
    });

    // Admin: open/close voting
    socket.on('session:toggle_voting', async ({ sessionId, open }: { sessionId: string; open: boolean }) => {
      if (user.role !== 'admin') return;
      const session = await Session.findOneAndUpdate(
        { _id: sessionId, workspaceId: user.workspaceId },
        { votingOpen: open },
        { new: true }
      );
      if (!session) return;
      io.to(sessionId).emit('session:voting_changed', { votingOpen: session.votingOpen });
    });

    // Add card
    socket.on('card:create', async ({ sessionId, sectionId, content }: { sessionId: string; sectionId: string; content: string }) => {
      try {
        const session = await Session.findOne({ _id: sessionId, workspaceId: user.workspaceId });
        if (!session || session.status !== 'active') { socket.emit('error', { message: 'Session not active' }); return; }
        const card = await Card.create({
          sessionId: new Types.ObjectId(sessionId),
          sectionId: new Types.ObjectId(sectionId),
          workspaceId: new Types.ObjectId(user.workspaceId),
          authorId: new Types.ObjectId(user.userId),
          authorName: (await User.findById(user.userId))?.name ?? 'Unknown',
          content,
        });
        io.to(sessionId).emit('card:created', card);
      } catch {
        socket.emit('error', { message: 'Failed to create card' });
      }
    });

    // Update card
    socket.on('card:update', async ({ cardId, content }: { cardId: string; content: string }) => {
      const card = await Card.findById(cardId);
      if (!card) return;
      const isAdmin = user.role === 'admin';
      const isAuthor = card.authorId.toString() === user.userId;
      if (!isAdmin && !isAuthor) { socket.emit('error', { message: 'Forbidden' }); return; }
      card.content = content;
      await card.save();
      io.to(card.sessionId.toString()).emit('card:updated', card);
    });

    // Delete card
    socket.on('card:delete', async ({ cardId }: { cardId: string }) => {
      const card = await Card.findById(cardId);
      if (!card) return;
      const isAdmin = user.role === 'admin';
      const isAuthor = card.authorId.toString() === user.userId;
      if (!isAdmin && !isAuthor) { socket.emit('error', { message: 'Forbidden' }); return; }
      const sessionId = card.sessionId.toString();
      await card.deleteOne();
      io.to(sessionId).emit('card:deleted', { cardId });
    });

    // Vote on card (admin and participants can vote)
    socket.on('card:vote', async ({ sessionId, cardId, delta }: { sessionId: string; cardId: string; delta: number }) => {
      try {
        const session = await Session.findOne({ _id: sessionId, workspaceId: user.workspaceId });
        if (!session || !session.votingOpen) { socket.emit('error', { message: 'Voting is closed' }); return; }
        let participant = session.participants.find(p => p.userId.toString() === user.userId);
        if (!participant) { socket.emit('error', { message: 'Not a participant' }); return; }
        if (delta > 0 && participant.remainingVotes < delta) {
          socket.emit('error', { message: 'Not enough votes' }); return;
        }
        const card = await Card.findById(cardId);
        if (!card) { socket.emit('error', { message: 'Card not found' }); return; }

        let vote = await Vote.findOne({ sessionId, cardId, userId: user.userId });
        if (!vote) {
          if (delta < 0) { socket.emit('error', { message: 'No votes to remove' }); return; }
          vote = await Vote.create({ sessionId, cardId, userId: user.userId, count: delta });
        } else {
          const newCount = vote.count + delta;
          if (newCount < 0) { socket.emit('error', { message: 'Cannot have negative votes on card' }); return; }
          vote.count = newCount;
          await vote.save();
        }
        card.voteCount += delta;
        await card.save();
        participant.remainingVotes -= delta;
        await session.save();

        io.to(sessionId).emit('card:voted', { cardId, voteCount: card.voteCount });
        socket.emit('session:votes_updated', { remainingVotes: participant.remainingVotes });
      } catch {
        socket.emit('error', { message: 'Vote failed' });
      }
    });

    // Admin: promote card to action with priority
    socket.on('action:create', async ({ sessionId, cardId, priority }:
      { sessionId: string; cardId: string; priority: string }) => {
      if (user.role !== 'admin') return;
      try {
        const session = await Session.findOne({ _id: sessionId, workspaceId: user.workspaceId });
        if (!session) return;
        const card = await Card.findById(cardId);
        if (!card) return;
        // Check if already an action
        const existing = await Action.findOne({ sessionId, sourceCardId: cardId });
        if (existing) {
          // Update priority if needed
          if (existing.priority !== priority) {
            existing.priority = priority as any;
            await existing.save();
            io.to(sessionId).emit('action:updated', existing);
          }
          return;
        }
        // Find admin user as owner
        const adminUser = await User.findById(user.userId);
        const action = await Action.create({
          title: card.content,
          description: '',
          workspaceId: new Types.ObjectId(user.workspaceId),
          sessionId: new Types.ObjectId(sessionId),
          sourceCardId: new Types.ObjectId(cardId),
          ownerId: new Types.ObjectId(user.userId),
          ownerName: adminUser?.name ?? 'Admin',
          priority: priority as any,
          status: 'todo',
          createdBy: new Types.ObjectId(user.userId),
        });
        io.to(sessionId).emit('action:created', action);
      } catch {
        socket.emit('error', { message: 'Failed to create action' });
      }
    });

    // Cursor move event (real-time cursor tracking)
    socket.on('cursor:move', ({ sessionId, x, y, name }: { sessionId: string; x: number; y: number; name: string }) => {
      socket.to(sessionId).emit('cursor:moved', { userId: user.userId, name, x, y });
    });

    // Typing indicator
    socket.on('user:typing', ({ sessionId, sectionId, name }: { sessionId: string; sectionId: string; name: string }) => {
      socket.to(sessionId).emit('user:typing', { userId: user.userId, sectionId, name });
    });
    socket.on('user:stopped_typing', ({ sessionId, sectionId }: { sessionId: string; sectionId: string }) => {
      socket.to(sessionId).emit('user:stopped_typing', { userId: user.userId, sectionId });
    });

    // ===== CARD FLIP GAME =====

    // Admin: start card game
    socket.on('cardgame:start', async ({ sessionId, sectionId }: { sessionId: string; sectionId: string }) => {
      if (user.role !== 'admin') return;
      const session = await Session.findOne({ _id: sessionId, workspaceId: user.workspaceId });
      if (!session) return;

      const section = session.templateSnapshot.sections.find((s: any) => s._id.toString() === sectionId);
      if (!section || section.type !== 'minigame') return;

      const options = section.options ?? [];
      const cards = options.map((opt: any, idx: number) => ({
        idx,
        question: opt.title ?? '',
        answer: opt.answer ?? '',
        isFlipped: false,
        isAnswerRevealed: false,
      }));

      // Player order: all connected participants
      const playerOrder = session.participants
        .filter((p: any) => p.status === 'connected')
        .map((p: any) => ({ userId: p.userId.toString(), name: p.name }));

      const gameState: CardGameState = {
        cards,
        currentPlayerIdx: 0,
        playerOrder,
        status: 'active',
        currentFlippedCardIdx: null,
      };
      cardGames.set(sessionId, gameState);
      io.to(sessionId).emit('cardgame:state', gameState);
    });

    // Player: flip a card
    socket.on('cardgame:flip', ({ sessionId, cardIdx }: { sessionId: string; cardIdx: number }) => {
      const game = cardGames.get(sessionId);
      if (!game || game.status !== 'active') return;
      // Only current player can flip
      const currentPlayer = game.playerOrder[game.currentPlayerIdx];
      if (!currentPlayer || currentPlayer.userId !== user.userId) {
        // Admin can also flip for demonstration
        if (user.role !== 'admin') return;
      }
      if (game.cards[cardIdx]?.isFlipped) return; // already flipped
      game.cards[cardIdx].isFlipped = true;
      game.currentFlippedCardIdx = cardIdx;
      io.to(sessionId).emit('cardgame:state', game);
    });

    // Anyone: reveal the answer
    socket.on('cardgame:reveal', ({ sessionId, cardIdx }: { sessionId: string; cardIdx: number }) => {
      const game = cardGames.get(sessionId);
      if (!game || game.status !== 'active') return;
      if (game.cards[cardIdx]) {
        game.cards[cardIdx].isAnswerRevealed = true;
        io.to(sessionId).emit('cardgame:state', game);
      }
    });

    // Admin: next player
    socket.on('cardgame:next_player', ({ sessionId }: { sessionId: string }) => {
      if (user.role !== 'admin') return;
      const game = cardGames.get(sessionId);
      if (!game || game.status !== 'active') return;
      game.currentPlayerIdx = (game.currentPlayerIdx + 1) % game.playerOrder.length;
      game.currentFlippedCardIdx = null;
      // Check if all cards flipped
      const allFlipped = game.cards.every(c => c.isFlipped);
      if (allFlipped) {
        game.status = 'finished';
      }
      io.to(sessionId).emit('cardgame:state', game);
    });

    // Admin: reset card game
    socket.on('cardgame:reset', ({ sessionId }: { sessionId: string }) => {
      if (user.role !== 'admin') return;
      cardGames.delete(sessionId);
      io.to(sessionId).emit('cardgame:state', null);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      const sessions = await Session.find({ 'participants.socketId': socket.id });
      for (const session of sessions) {
        const participant = session.participants.find(p => p.socketId === socket.id);
        if (participant) {
          participant.status = 'absent';
          participant.socketId = null;
          await session.save();
          io.to(session._id.toString()).emit('session:participants', session.participants);
        }
      }
    });
  });
}
