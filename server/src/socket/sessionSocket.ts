import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Session } from '../models/Session';
import { Card } from '../models/Card';
import { Vote } from '../models/Vote';
import { MiniGame } from '../models/MiniGame';
import { Action } from '../models/Action';
import { User } from '../models/User';
import { Types } from 'mongoose';

interface AuthPayload { userId: string; workspaceId: string; role: string; }

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
        const participant = session.participants.find(p => p.userId.toString() === user.userId);
        if (!participant) { socket.emit('error', { message: 'Not a participant' }); return; }

        socket.join(sessionId);
        participant.status = 'connected';
        participant.socketId = socket.id;
        participant.joinedAt = new Date();
        await session.save();

        socket.emit('session:state', session);
        io.to(sessionId).emit('session:participants', session.participants);
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

    // Vote on card
    socket.on('card:vote', async ({ sessionId, cardId, delta }: { sessionId: string; cardId: string; delta: number }) => {
      try {
        const session = await Session.findOne({ _id: sessionId, workspaceId: user.workspaceId });
        if (!session || !session.votingOpen) { socket.emit('error', { message: 'Voting is closed' }); return; }
        const participant = session.participants.find(p => p.userId.toString() === user.userId);
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

    // Admin: launch mini-game
    socket.on('minigame:launch', async ({ sessionId, question, options, correctAnswer, timeLimitSeconds }:
      { sessionId: string; question: string; options: string[]; correctAnswer: string; timeLimitSeconds: number }) => {
      if (user.role !== 'admin') return;
      const game = await MiniGame.create({
        sessionId: new Types.ObjectId(sessionId),
        workspaceId: new Types.ObjectId(user.workspaceId),
        question, options, correctAnswer, timeLimitSeconds,
        status: 'active',
        startedAt: new Date(),
        createdBy: new Types.ObjectId(user.userId),
      });
      io.to(sessionId).emit('minigame:started', game);
    });

    // Submit mini-game answer
    socket.on('minigame:answer', async ({ gameId, answer }: { gameId: string; answer: string }) => {
      const game = await MiniGame.findById(gameId);
      if (!game || game.status !== 'active') { socket.emit('error', { message: 'Game not active' }); return; }
      const alreadyAnswered = game.answers.find(a => a.userId.toString() === user.userId);
      if (alreadyAnswered) { socket.emit('error', { message: 'Already answered' }); return; }
      const elapsed = (Date.now() - (game.startedAt?.getTime() ?? 0)) / 1000;
      if (elapsed > game.timeLimitSeconds) { socket.emit('error', { message: 'Time is up' }); return; }

      const isCorrect = answer === game.correctAnswer;
      const effect = isCorrect ? 'plus_one' : 'minus_one';
      game.answers.push({ userId: new Types.ObjectId(user.userId), answer, answeredAt: new Date(), isCorrect, effect });
      await game.save();

      // Apply vote effect
      const session = await Session.findById(game.sessionId);
      if (session) {
        const participant = session.participants.find(p => p.userId.toString() === user.userId);
        if (participant) {
          const newVotes = Math.max(0, participant.remainingVotes + (isCorrect ? 1 : -1));
          participant.remainingVotes = newVotes;
          await session.save();
          socket.emit('session:votes_updated', { remainingVotes: newVotes });
        }
      }
      socket.emit('minigame:answer_accepted', { isCorrect, effect });
    });

    // Admin: reveal mini-game answer
    socket.on('minigame:reveal', async ({ gameId }: { gameId: string }) => {
      if (user.role !== 'admin') return;
      const game = await MiniGame.findByIdAndUpdate(gameId, { status: 'revealed', revealedAt: new Date() }, { new: true });
      if (!game) return;
      io.to(game.sessionId.toString()).emit('minigame:revealed', game);
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
