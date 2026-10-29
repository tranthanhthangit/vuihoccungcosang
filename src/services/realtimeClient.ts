import { Game, GameSettings, SessionState, ConnectedTeam, TeamPreset } from '../types/game';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

type EventCallback = (data: any) => void;

export const DEFAULT_TEAM_PRESETS: TeamPreset[] = [
  { id: 'team_sun', name: 'máy 1', icon: '☀️', colorName: 'Đỏ Mặt Trời', bgColor: 'bg-rose-500', textColor: 'text-rose-600', borderColor: 'border-rose-400', ringColor: 'ring-rose-400' },
  { id: 'team_rainbow', name: 'máy 2', icon: '🌈', colorName: 'Xanh Lam', bgColor: 'bg-sky-500', textColor: 'text-sky-600', borderColor: 'border-sky-400', ringColor: 'ring-sky-400' },
  { id: 'team_flower', name: 'máy 3', icon: '🌸', colorName: 'Hồng Phấn', bgColor: 'bg-pink-500', textColor: 'text-pink-600', borderColor: 'border-pink-400', ringColor: 'ring-pink-400' },
  { id: 'team_leaf', name: 'máy 4', icon: '🍃', colorName: 'Xanh Lá', bgColor: 'bg-emerald-500', textColor: 'text-emerald-600', borderColor: 'border-emerald-400', ringColor: 'ring-emerald-400' },
  { id: 'team_star', name: 'máy 5', icon: '⭐', colorName: 'Vàng Sao', bgColor: 'bg-amber-500', textColor: 'text-amber-600', borderColor: 'border-amber-400', ringColor: 'ring-amber-400' },
  { id: 'team_cloud', name: 'máy 6', icon: '☁️', colorName: 'Xanh Lơ', bgColor: 'bg-cyan-500', textColor: 'text-cyan-600', borderColor: 'border-cyan-400', ringColor: 'ring-cyan-400' },
  { id: 'team_elephant', name: 'máy 7', icon: '🐘', colorName: 'Tím Biếc', bgColor: 'bg-purple-500', textColor: 'text-purple-600', borderColor: 'border-purple-400', ringColor: 'ring-purple-400' },
  { id: 'team_rabbit', name: 'máy 8', icon: '🐰', colorName: 'Cam Cà Rốt', bgColor: 'bg-orange-500', textColor: 'text-orange-600', borderColor: 'border-orange-400', ringColor: 'ring-orange-400' },
  { id: 'team_lion', name: 'máy 9', icon: '🦁', colorName: 'Vàng Hổ Phách', bgColor: 'bg-amber-600', textColor: 'text-amber-700', borderColor: 'border-amber-500', ringColor: 'ring-amber-500' },
  { id: 'team_dolphin', name: 'máy 10', icon: '🐬', colorName: 'Xanh Đại Dương', bgColor: 'bg-blue-600', textColor: 'text-blue-700', borderColor: 'border-blue-500', ringColor: 'ring-blue-500' },
  { id: 'team_chick', name: 'máy 11', icon: '🐥', colorName: 'Xanh Lá Non', bgColor: 'bg-lime-500', textColor: 'text-lime-700', borderColor: 'border-lime-400', ringColor: 'ring-lime-400' },
  { id: 'team_strawberry', name: 'máy 12', icon: '🍓', colorName: 'Đỏ Ruby', bgColor: 'bg-red-500', textColor: 'text-red-600', borderColor: 'border-red-400', ringColor: 'ring-red-400' },
];

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private supabaseChannel: RealtimeChannel | null = null;
  private supabaseChannelSubscribed: boolean = false;
  private pendingBroadcastQueue: object[] = [];
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: number | null = null;
  private isConnected: boolean = false;
  private currentRoomCode: string | null = null;
  private currentRole: 'host' | 'player' | null = null;
  private currentTeamId: string | null = null;
  private currentCustomTeamName?: string;
  private currentDeviceId: string | null = null;
  private pendingQueue: string[] = [];
  private serverTimeOffset: number = 0;

  // Serverless in-memory coordinator state when running on Cloudflare without a Node.js server
  private serverlessSession: SessionState | null = null;

  constructor() {
    this.initNetworkListeners();
    if (this.shouldConnectLocalWs()) {
      this.connect();
    } else {
      // Running on Cloudflare Pages/Workers or remote production
      // Connection status relies on Supabase Realtime channel status
      this.isConnected = isSupabaseConfigured();
    }
  }

  private shouldConnectLocalWs(): boolean {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname.toLowerCase();
    // Only disable local Node WS if hosted on static-only serverless platforms
    if (
      hostname.endsWith('.pages.dev') ||
      hostname.endsWith('.workers.dev') ||
      hostname.endsWith('.netlify.app') ||
      hostname.endsWith('.vercel.app')
    ) {
      return false;
    }
    return true;
  }

  private initNetworkListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (this.shouldConnectLocalWs()) {
          this.connect();
        } else if (isSupabaseConfigured()) {
          this.isConnected = true;
          this.emit('connection_change', { status: 'connected', online: true });
        }
      });

      window.addEventListener('offline', () => {
        this.isConnected = false;
        this.emit('connection_change', { status: 'offline', online: false });
      });
    }
  }

  private getWsUrl(): string {
    if (typeof window === 'undefined') return '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }

  public connect() {
    if (typeof window === 'undefined') return;
    if (!this.shouldConnectLocalWs()) {
      this.isConnected = isSupabaseConfigured();
      return;
    }

    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      const url = this.getWsUrl();
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emit('connection_change', { status: 'connected', online: true });

        if (this.currentRoomCode && this.currentRole) {
          this.send({
            type: 'sync_request',
            roomCode: this.currentRoomCode,
            role: this.currentRole,
            teamId: this.currentTeamId,
            deviceId: this.currentDeviceId,
          });
        }

        while (this.pendingQueue.length > 0) {
          const msg = this.pendingQueue.shift();
          if (msg && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(msg);
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.serverTime) {
            this.serverTimeOffset = payload.serverTime - Date.now();
          }

          if (payload.type === 'session_created' && payload.data?.session?.roomCode) {
            this.currentRoomCode = payload.data.session.roomCode.toUpperCase();
            this.currentRole = 'host';
          }
          if (payload.type === 'session_updated' && payload.data?.session?.roomCode && this.currentRole === 'host') {
            this.currentRoomCode = payload.data.session.roomCode.toUpperCase();
          }

          if (payload.type) {
            this.emit(payload.type, payload.data ?? payload);
          }
        } catch (err) {
          console.error('[RealtimeClient] Parse error', err);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = isSupabaseConfigured();
        if (this.shouldConnectLocalWs()) {
          this.emit('connection_change', { status: 'disconnected', online: navigator.onLine });
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        if (this.shouldConnectLocalWs()) {
          console.warn('[RealtimeClient] WS error', err);
          this.isConnected = false;
          this.emit('connection_change', { status: 'error', online: navigator.onLine });
        }
      };
    } catch (err) {
      if (this.shouldConnectLocalWs()) {
        console.error('[RealtimeClient] Connection error', err);
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (!this.shouldConnectLocalWs()) return;
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }

  /**
   * Initializes or subscribes to a Supabase Realtime Channel for serverless room communication
   */
  public initSupabaseRoom(roomCode: string, role: 'host' | 'player') {
    if (!supabase || !isSupabaseConfigured() || !roomCode) {
      if (!this.shouldConnectLocalWs()) {
        this.isConnected = true;
      }
      return;
    }

    const channelName = `room:${roomCode.toUpperCase()}`;
    if (this.supabaseChannel && this.supabaseChannel.topic === `realtime:${channelName}`) {
      return;
    }

    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.unsubscribe();
      } catch {}
      this.supabaseChannel = null;
      this.supabaseChannelSubscribed = false;
    }

    this.supabaseChannelSubscribed = false;
    this.supabaseChannel = supabase.channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: this.currentDeviceId || this.currentTeamId || `${role}_${Date.now()}` },
      },
    });

    this.supabaseChannel
      .on('broadcast', { event: '*' }, ({ event, payload }) => {
        if (!payload) return;
        if (payload.serverTime) {
          this.serverTimeOffset = payload.serverTime - Date.now();
        }

        const eventType = payload.type || event;

        // Serverless Host Coordinator: Process incoming player requests
        if (this.currentRole === 'host' && this.serverlessSession) {
          this.handleServerlessHostIncoming(eventType, payload);
        }

        // Emit locally for UI consumption
        this.emit(eventType, payload.data ?? payload);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = this.supabaseChannel?.presenceState() || {};
        const onlineTeams: Record<string, { online: boolean; teamId: string; teamName?: string }> = {};
        Object.values(state).forEach((presences: any) => {
          if (Array.isArray(presences)) {
            presences.forEach((p: any) => {
              if (p.teamId) {
                onlineTeams[p.teamId] = {
                  online: true,
                  teamId: p.teamId,
                  teamName: p.teamName,
                };
              }
            });
          }
        });
        if (Object.keys(onlineTeams).length > 0) {
          this.emit('teams_updated', { roomCode: roomCode.toUpperCase(), teams: onlineTeams });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.supabaseChannelSubscribed = true;
          this.isConnected = true;
          this.emit('connection_change', { status: 'connected', online: true });

          // Flush queued broadcasts now that channel is ready
          while (this.pendingBroadcastQueue.length > 0) {
            const queued = this.pendingBroadcastQueue.shift();
            if (queued) {
              this.broadcast(queued);
            }
          }

          if (role === 'player') {
            if (this.currentTeamId) {
              this.supabaseChannel?.track({
                teamId: this.currentTeamId,
                deviceId: this.currentDeviceId,
                online: true,
                role: 'player',
                joinedAt: Date.now(),
              });
              // Ensure player:join is sent immediately once channel is ready
              this.send({
                type: 'player:join',
                roomCode: roomCode.toUpperCase(),
                teamId: this.currentTeamId,
                deviceId: this.currentDeviceId,
                customTeamName: this.currentCustomTeamName,
              });
              this.send({
                type: 'sync_request',
                roomCode: roomCode.toUpperCase(),
                role: 'player',
                teamId: this.currentTeamId,
                deviceId: this.currentDeviceId,
              });
            } else {
              // Request current room state snapshot
              this.send({
                type: 'sync_request',
                roomCode: roomCode.toUpperCase(),
              });
            }
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          this.supabaseChannelSubscribed = false;
        }
      });
  }

  private persistServerlessSession() {
    if (this.serverlessSession && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          `vuihoc_active_session_${this.serverlessSession.roomCode}`,
          JSON.stringify(this.serverlessSession)
        );
      } catch {}
    }
  }

  /**
   * Serverless Host Event Processor: Handles player actions when running without Node server
   */
  private handleServerlessHostIncoming(type: string, payload: any) {
    if (!this.serverlessSession) return;

    if (type === 'player:watch_room' || type === 'sync_request') {
      this.broadcast({
        type: 'room_snapshot',
        data: {
          session: this.serverlessSession,
        },
      });
      this.broadcast({
        type: 'teams_updated',
        data: {
          roomCode: this.serverlessSession.roomCode,
          teams: this.serverlessSession.teams,
        },
      });
      this.broadcastSession(this.serverlessSession);
      return;
    }

    if (type === 'player:join') {
      const { teamId, customTeamName, deviceId } = payload;
      const preset = DEFAULT_TEAM_PRESETS.find(p => p.id === teamId);
      const teamNumber = (DEFAULT_TEAM_PRESETS.findIndex(p => p.id === teamId) + 1) || Object.keys(this.serverlessSession.teams).length + 1;

      const team: ConnectedTeam = {
        teamId,
        teamNumber,
        teamName: customTeamName?.trim() || preset?.name || `Đội ${teamNumber}`,
        icon: preset?.icon || '⭐',
        color: preset?.bgColor || 'bg-indigo-500',
        deviceId: deviceId || '',
        joinedAt: Date.now(),
        online: true,
        score: 0,
        lastSeen: Date.now(),
        assignedSet: this.serverlessSession.teamAssignments?.[teamId] || 'A',
      };

      this.serverlessSession.teams[teamId] = team;
      this.persistServerlessSession();

      // Broadcast join_success and session_updated to all players
      this.broadcast({
        type: 'join_success',
        data: {
          session: this.serverlessSession,
          team,
        },
      });

      this.broadcast({
        type: 'team_joined',
        data: {
          team,
          teams: this.serverlessSession.teams,
        },
      });

      this.broadcastSession(this.serverlessSession);
      this.emit('team_joined', { team, teams: this.serverlessSession.teams });
      this.emit('session_updated', { session: this.serverlessSession });
    } else if (type === 'player:heartbeat') {
      const { teamId } = payload;
      if (teamId && this.serverlessSession.teams[teamId]) {
        this.serverlessSession.teams[teamId].online = true;
        this.serverlessSession.teams[teamId].lastSeen = Date.now();
      }
    } else if (type === 'player:leave') {
      const { teamId } = payload;
      if (teamId && this.serverlessSession.teams[teamId]) {
        this.serverlessSession.teams[teamId].online = false;
        this.persistServerlessSession();
        this.broadcastSession(this.serverlessSession);
        this.emit('team_presence_changed', { teamId, online: false });
      }
    } else if (type === 'player:submit_answer') {
      const { teamId, questionIndex, answerId, answerIds, chosenLetter, htmlGameResult, openEnded } = payload;
      const assigned = this.serverlessSession.teams[teamId]?.assignedSet || this.serverlessSession.teamAssignments?.[teamId] || 'A';
      const question = (this.serverlessSession.isDualMode && assigned === 'B' && this.serverlessSession.gameB)
        ? this.serverlessSession.gameB.questions[questionIndex]
        : this.serverlessSession.game.questions[questionIndex];

      let isCorrect = false;
      let pointsAwarded = 0;
      let effectiveAnswerText = '';

      if (question) {
        if (question.type === 'multiple_choice' || question.type === 'true_false' || question.type === 'letter_recognition' || question.type === 'counting') {
          const opt = question.options?.find(o => o.id === answerId);
          isCorrect = Boolean(opt?.isCorrect);
          pointsAwarded = isCorrect ? (question.points || 10) : 0;
          effectiveAnswerText = opt?.text || answerId || '';
        } else if (question.type === 'word_choice' && answerIds) {
          const correctIds = question.options?.filter(o => o.isCorrect).map(o => o.id) || [];
          isCorrect = correctIds.length === answerIds.length && correctIds.every(id => answerIds.includes(id));
          pointsAwarded = isCorrect ? (question.points || 10) : 0;
          effectiveAnswerText = answerIds.join(', ');
        } else if (question.type === 'word_drag_drop' && chosenLetter) {
          isCorrect = Boolean(chosenLetter && question.title?.toLowerCase().includes(chosenLetter.toLowerCase()));
          pointsAwarded = isCorrect ? (question.points || 10) : 0;
          effectiveAnswerText = `Bé ghép chữ "${chosenLetter}"`;
        } else if (htmlGameResult) {
          const maxPoints = question.points || 30;
          if (htmlGameResult.score !== undefined) {
            pointsAwarded = Math.round(htmlGameResult.score);
            isCorrect = Boolean(htmlGameResult.isCorrect ?? (pointsAwarded > 0));
          } else {
            isCorrect = Boolean(htmlGameResult.isCorrect);
            pointsAwarded = isCorrect ? maxPoints : 0;
          }
          effectiveAnswerText = htmlGameResult.summary || `Đạt ${pointsAwarded} điểm`;
        } else if (question.type === 'open_ended' || openEnded) {
          // Open-ended drawing question: score is awarded when teacher grades it
          isCorrect = false;
          pointsAwarded = 0;
          const drawing = openEnded?.drawingDataUrl || this.serverlessSession.drafts?.[questionIndex]?.[teamId]?.drawingDataUrl || '';
          const text = (openEnded?.textAnswer || this.serverlessSession.drafts?.[questionIndex]?.[teamId]?.textAnswer || '').trim();
          effectiveAnswerText = text
            ? `Tự luận: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`
            : (drawing ? 'Bé đã vẽ tranh câu trả lời 🎨' : 'Đã nộp bài tự luận');
        } else {
          isCorrect = true;
          pointsAwarded = question.points || 10;
        }
      }

      const qAns = this.serverlessSession.answers[questionIndex] || {};
      const team = this.serverlessSession.teams[teamId];
      const prevAns = qAns[teamId];
      const prevPoints = prevAns ? (prevAns.pointsAwarded || 0) : 0;

      // Deduct previous points for this question before adding new points to prevent duplicate scoring
      if (team) {
        team.score = Math.max(0, (team.score || 0) - prevPoints + pointsAwarded);
      }

      const effectiveDrawing = openEnded?.drawingDataUrl || this.serverlessSession.drafts?.[questionIndex]?.[teamId]?.drawingDataUrl || '';
      const effectiveText = (openEnded?.textAnswer || this.serverlessSession.drafts?.[questionIndex]?.[teamId]?.textAnswer || '').trim();

      qAns[teamId] = {
        sessionId: this.serverlessSession.sessionId,
        questionIndex,
        questionId: question?.id || '',
        teamId,
        teamName: team?.teamName || teamId,
        answerId: answerId || (effectiveDrawing ? 'open_ended_submitted' : 'submission'),
        answerIds: answerIds || [],
        answerText: effectiveAnswerText || openEnded?.textAnswer || '',
        submittedAt: Date.now(),
        responseTimeMs: Date.now() - (this.serverlessSession.questionStartTime || Date.now()),
        isCorrect,
        pointsAwarded,
        assignedSet: assigned,
        openEnded: (question?.type === 'open_ended' || openEnded || effectiveDrawing) ? {
          textAnswer: effectiveText,
          drawingDataUrl: effectiveDrawing,
          hasDrawn: Boolean(effectiveDrawing && effectiveDrawing.length > 20),
          teacherGrade: prevAns?.openEnded?.teacherGrade || openEnded?.teacherGrade || 'pending',
          teacherPoints: prevAns?.openEnded?.teacherPoints ?? (question?.points || 10),
          teacherFeedback: prevAns?.openEnded?.teacherFeedback || '',
          gradedAt: Date.now(),
        } : undefined,
      };

      this.serverlessSession.answers[questionIndex] = qAns;
      this.persistServerlessSession();

      const answeredTeams: Record<string, any> = {};
      Object.keys(qAns).forEach(tId => {
        answeredTeams[tId] = { submittedAt: qAns[tId].submittedAt };
      });

      this.broadcast({
        type: 'answer_status_updated',
        data: {
          questionIndex,
          answeredTeams,
        },
      });

      this.emit('answer_status_updated', {
        questionIndex,
        answeredTeams,
      });
    } else if (type === 'player:save_open_ended_draft') {
      const { teamId, questionIndex, textAnswer, drawingDataUrl, hasDrawn } = payload;
      if (!this.serverlessSession.drafts) this.serverlessSession.drafts = {};
      if (!this.serverlessSession.drafts[questionIndex]) this.serverlessSession.drafts[questionIndex] = {};
      this.serverlessSession.drafts[questionIndex][teamId] = {
        textAnswer,
        drawingDataUrl,
        hasDrawn,
        updatedAt: Date.now(),
      };
      this.persistServerlessSession();

      this.broadcast({
        type: 'draft_updated',
        data: {
          questionIndex,
          teamId,
          draft: this.serverlessSession.drafts[questionIndex][teamId],
        },
      });

      this.emit('draft_updated', {
        questionIndex,
        teamId,
        draft: this.serverlessSession.drafts[questionIndex][teamId],
      });
    } else if (type === 'host:start_question') {
      const qIndex = Number(payload.questionIndex ?? 0);
      this.serverlessSession.status = 'playing';
      this.serverlessSession.questionStatus = 'active';
      this.serverlessSession.currentQuestionIndex = qIndex;
      this.serverlessSession.questionStartTime = Date.now();
      if (!this.serverlessSession.startedAt) {
        this.serverlessSession.startedAt = Date.now();
      }
      if (!this.serverlessSession.answers[qIndex]) {
        this.serverlessSession.answers[qIndex] = {};
      }
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    } else if (type === 'host:next_question') {
      const maxQuestions = this.serverlessSession.isDualMode
        ? Math.max(this.serverlessSession.game.questions.length, this.serverlessSession.gameB?.questions?.length || 0)
        : this.serverlessSession.game.questions.length;
      const nextIndex = this.serverlessSession.currentQuestionIndex + 1;
      if (nextIndex >= maxQuestions) {
        this.serverlessSession.status = 'ended';
        this.serverlessSession.endedAt = Date.now();
        this.serverlessSession.questionStatus = 'results';
        this.persistServerlessSession();
        this.broadcastSession(this.serverlessSession);
        this.broadcast({
          type: 'game_ended',
          data: { session: this.serverlessSession },
        });
        this.emit('session_updated', { session: this.serverlessSession });
        this.emit('game_ended', { session: this.serverlessSession });
      } else {
        this.serverlessSession.status = 'playing';
        this.serverlessSession.currentQuestionIndex = nextIndex;
        this.serverlessSession.questionStatus = 'active';
        this.serverlessSession.questionStartTime = Date.now();
        if (!this.serverlessSession.answers[nextIndex]) {
          this.serverlessSession.answers[nextIndex] = {};
        }
        this.persistServerlessSession();
        this.broadcastSession(this.serverlessSession);
        this.emit('session_updated', { session: this.serverlessSession });
      }
    } else if (type === 'host:end_question') {
      this.serverlessSession.status = 'playing';
      this.serverlessSession.questionStatus = 'results';
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    } else if (type === 'host:show_leaderboard') {
      this.serverlessSession.status = 'playing';
      this.serverlessSession.questionStatus = 'leaderboard';
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    } else if (type === 'host:restart_game') {
      this.serverlessSession.status = 'lobby';
      this.serverlessSession.currentQuestionIndex = 0;
      this.serverlessSession.questionStatus = 'waiting';
      this.serverlessSession.answers = {};
      this.serverlessSession.questionStartTime = null;
      this.serverlessSession.startedAt = null;
      this.serverlessSession.endedAt = null;
      Object.values(this.serverlessSession.teams).forEach(t => {
        t.score = 0;
      });
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    } else if (type === 'host:end_game') {
      this.serverlessSession.status = 'ended';
      this.serverlessSession.endedAt = Date.now();
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.broadcast({
        type: 'game_ended',
        data: { session: this.serverlessSession },
      });
      this.emit('session_updated', { session: this.serverlessSession });
      this.emit('game_ended', { session: this.serverlessSession });
    } else if (type === 'host:assign_team_set') {
      const { teamId, set } = payload;
      if (this.serverlessSession.teams[teamId]) {
        this.serverlessSession.teams[teamId].assignedSet = set;
        if (!this.serverlessSession.teamAssignments) this.serverlessSession.teamAssignments = {};
        this.serverlessSession.teamAssignments[teamId] = set;
        this.persistServerlessSession();
        this.broadcastSession(this.serverlessSession);
        this.emit('session_updated', { session: this.serverlessSession });
      }
    }
  }

  public broadcastSession(session: SessionState) {
    this.broadcast({
      type: 'session_updated',
      data: { session },
    });
  }

  public broadcast(payload: object) {
    if (!supabase || !isSupabaseConfigured()) return;

    if (!this.supabaseChannel || !this.supabaseChannelSubscribed) {
      this.pendingBroadcastQueue.push(payload);
      return;
    }

    const eventName = (payload as any).type || 'message';
    this.supabaseChannel.send({
      type: 'broadcast',
      event: eventName,
      payload: {
        ...payload,
        serverTime: Date.now(),
      },
    }).catch((err) => {
      console.warn('[RealtimeClient] Supabase broadcast error:', err);
    });
  }

  public send(payload: object) {
    const raw = JSON.stringify(payload);

    // 1. Send via local WebSocket if running in local Node development environment
    if (this.shouldConnectLocalWs()) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(raw);
      } else {
        this.pendingQueue.push(raw);
        this.connect();
      }
    }

    // 2. Broadcast through Supabase Realtime Channel if configured
    this.broadcast(payload);
  }

  public on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => {
      this.off(event, callback);
    };
  }

  public off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: unknown) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[RealtimeClient] Listener error on event '${event}'`, err);
        }
      });
    }
  }

  public getIsConnected(): boolean {
    if (!this.shouldConnectLocalWs()) {
      return isSupabaseConfigured() ? true : true; // In static mode, host acts as authority
    }
    return this.isConnected;
  }

  public getServerNow(): number {
    return Date.now() + this.serverTimeOffset;
  }

  // High-level Actions
  public createSession(game: Game, settings?: GameSettings) {
    this.currentRole = 'host';
    const useServerless = !this.shouldConnectLocalWs();

    if (useServerless) {
      // Serverless mode (Cloudflare + Supabase or local offline)
      const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
      this.currentRoomCode = roomCode;
      this.initSupabaseRoom(roomCode, 'host');

      const initialSession: SessionState = {
        sessionId: `session_${Date.now()}_${roomCode}`,
        roomCode,
        gameId: game.id,
        game,
        status: 'lobby',
        currentQuestionIndex: 0,
        questionStatus: 'waiting',
        questionStartTime: null,
        questionTimeLimit: settings?.timePerQuestion ?? 30,
        teams: {},
        answers: {},
        settings: {
          timePerQuestion: settings?.timePerQuestion ?? 30,
          soundEffects: settings?.soundEffects ?? true,
          maxTeams: settings?.maxTeams ?? 12,
          speedBonus: settings?.speedBonus ?? true,
        },
        createdAt: Date.now(),
        startedAt: null,
        endedAt: null,
      };

      this.serverlessSession = initialSession;
      this.persistServerlessSession();

      setTimeout(() => {
        this.emit('session_created', { session: initialSession });
        this.emit('session_updated', { session: initialSession });
        this.broadcastSession(initialSession);
      }, 50);
      return;
    }

    this.send({
      type: 'host:create_session',
      game,
      settings: settings || game.settings,
    });
  }

  public createDualSession(gameA: Game, gameB: Game, settings?: GameSettings) {
    this.currentRole = 'host';
    const useServerless = !this.shouldConnectLocalWs();

    if (useServerless) {
      const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
      this.currentRoomCode = roomCode;
      this.initSupabaseRoom(roomCode, 'host');

      const initialSession: SessionState = {
        sessionId: `session_dual_${Date.now()}_${roomCode}`,
        roomCode,
        gameId: gameA.id,
        game: gameA,
        gameB,
        isDualMode: true,
        status: 'lobby',
        currentQuestionIndex: 0,
        questionStatus: 'waiting',
        questionStartTime: null,
        questionTimeLimit: settings?.timePerQuestion ?? 30,
        teams: {},
        answers: {},
        teamAssignments: {},
        settings: {
          timePerQuestion: settings?.timePerQuestion ?? 30,
          soundEffects: settings?.soundEffects ?? true,
          maxTeams: settings?.maxTeams ?? 12,
          speedBonus: settings?.speedBonus ?? true,
        },
        createdAt: Date.now(),
        startedAt: null,
        endedAt: null,
      };

      this.serverlessSession = initialSession;
      this.persistServerlessSession();

      setTimeout(() => {
        this.emit('session_created', { session: initialSession });
        this.emit('session_updated', { session: initialSession });
        this.broadcastSession(initialSession);
      }, 50);
      return;
    }

    this.send({
      type: 'host:create_session',
      game: gameA,
      gameB,
      isDualMode: true,
      settings: settings || gameA.settings,
    });
  }

  public assignTeamSet(roomCode: string, teamId: string, set: 'A' | 'B') {
    if (this.serverlessSession && this.serverlessSession.teams[teamId]) {
      this.serverlessSession.teams[teamId].assignedSet = set;
      if (!this.serverlessSession.teamAssignments) this.serverlessSession.teamAssignments = {};
      this.serverlessSession.teamAssignments[teamId] = set;
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:assign_team_set',
      roomCode: roomCode.toUpperCase(),
      teamId,
      set,
    });
  }

  public setAllTeamAssignments(roomCode: string, assignments: Record<string, 'A' | 'B'>) {
    if (this.serverlessSession) {
      this.serverlessSession.teamAssignments = assignments;
      Object.entries(assignments).forEach(([tId, s]) => {
        if (this.serverlessSession?.teams[tId]) {
          this.serverlessSession.teams[tId].assignedSet = s;
        }
      });
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:set_all_team_assignments',
      roomCode: roomCode.toUpperCase(),
      assignments,
    });
  }

  private heartbeatTimer: number | null = null;

  public startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      if (this.currentRole === 'player' && this.currentRoomCode && this.currentTeamId) {
        this.send({
          type: 'player:heartbeat',
          roomCode: this.currentRoomCode,
          teamId: this.currentTeamId,
          deviceId: this.currentDeviceId,
        });
      }
    }, 3000);
  }

  public stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  public joinRoom(roomCode: string, teamId: string, deviceId: string, customTeamName?: string) {
    this.currentRoomCode = roomCode.toUpperCase();
    this.currentRole = 'player';
    this.currentTeamId = teamId;
    this.currentDeviceId = deviceId;
    this.currentCustomTeamName = customTeamName?.trim() || undefined;
    this.initSupabaseRoom(this.currentRoomCode, 'player');

    this.send({
      type: 'player:join',
      roomCode: this.currentRoomCode,
      teamId,
      deviceId,
      customTeamName: this.currentCustomTeamName,
    });

    this.startHeartbeat();
  }

  public watchRoom(roomCode: string, deviceId?: string) {
    this.currentRoomCode = roomCode.toUpperCase();
    this.initSupabaseRoom(this.currentRoomCode, 'player');
    this.send({
      type: 'player:watch_room',
      roomCode: this.currentRoomCode,
      deviceId: deviceId || this.currentDeviceId,
    });
  }

  public leaveRoom(roomCode: string, teamId: string, deviceId: string) {
    this.stopHeartbeat();
    this.send({
      type: 'player:leave',
      roomCode: roomCode.toUpperCase(),
      teamId,
      deviceId,
    });
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.untrack();
        this.supabaseChannel.unsubscribe();
      } catch {}
      this.supabaseChannel = null;
    }
    this.currentRoomCode = null;
    this.currentRole = null;
    this.currentTeamId = null;
  }

  public kickTeam(roomCode: string, teamId: string) {
    if (this.serverlessSession && this.serverlessSession.teams[teamId]) {
      delete this.serverlessSession.teams[teamId];
      this.persistServerlessSession();
      this.broadcast({ type: 'team_removed', data: { teamId } });
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:kick_team',
      roomCode: roomCode.toUpperCase(),
      teamId,
    });
  }

  public updateTeamName(roomCode: string, teamId: string, customTeamName: string) {
    if (this.serverlessSession && this.serverlessSession.teams[teamId]) {
      this.serverlessSession.teams[teamId].teamName = customTeamName.trim();
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'player:update_team_name',
      roomCode: roomCode.toUpperCase(),
      teamId,
      customTeamName: customTeamName.trim(),
    });
  }

  public registerHost(roomCode: string) {
    this.currentRoomCode = roomCode.toUpperCase();
    this.currentRole = 'host';

    // Restore serverlessSession from localStorage if available
    if (!this.serverlessSession && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`vuihoc_active_session_${this.currentRoomCode}`);
        if (saved) {
          this.serverlessSession = JSON.parse(saved);
        }
      } catch {}
    }

    this.initSupabaseRoom(this.currentRoomCode, 'host');
    this.send({
      type: 'host:register',
      roomCode: this.currentRoomCode,
    });

    if (this.serverlessSession) {
      setTimeout(() => {
        this.emit('session_created', { session: this.serverlessSession });
        this.emit('session_updated', { session: this.serverlessSession });
        this.broadcastSession(this.serverlessSession!);
      }, 100);
    }
  }

  public updateRoomSettings(roomCode: string, settings: Partial<GameSettings>) {
    if (this.serverlessSession) {
      this.serverlessSession.settings = {
        ...this.serverlessSession.settings,
        ...settings,
      };
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:update_room_settings',
      roomCode: roomCode.toUpperCase(),
      settings,
    });
  }

  public setServerlessSession(session: SessionState) {
    this.serverlessSession = session;
    this.persistServerlessSession();
  }

  public startQuestion(roomCode: string, questionIndex: number) {
    if (!this.serverlessSession && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`vuihoc_active_session_${roomCode.toUpperCase()}`);
        if (saved) this.serverlessSession = JSON.parse(saved);
      } catch {}
    }

    if (this.serverlessSession) {
      this.serverlessSession.status = 'playing';
      this.serverlessSession.questionStatus = 'active';
      this.serverlessSession.currentQuestionIndex = questionIndex;
      this.serverlessSession.questionStartTime = Date.now();
      if (!this.serverlessSession.startedAt) {
        this.serverlessSession.startedAt = Date.now();
      }
      if (!this.serverlessSession.answers[questionIndex]) {
        this.serverlessSession.answers[questionIndex] = {};
      }
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:start_question',
      roomCode: roomCode.toUpperCase(),
      questionIndex,
    });
  }

  public submitAnswer(
    roomCode: string,
    teamId: string,
    questionIndex: number,
    answerId: string,
    answerIds?: string[]
  ) {
    this.send({
      type: 'player:submit_answer',
      roomCode: roomCode.toUpperCase(),
      teamId,
      questionIndex,
      answerId,
      answerIds,
    });
  }

  public saveOpenEndedDraft(
    roomCode: string,
    teamId: string,
    questionIndex: number,
    textAnswer: string,
    drawingDataUrl: string,
    hasDrawn?: boolean
  ) {
    this.send({
      type: 'player:save_open_ended_draft',
      roomCode: roomCode.toUpperCase(),
      teamId,
      questionIndex,
      textAnswer,
      drawingDataUrl,
      hasDrawn,
    });
  }

  public endQuestion(roomCode: string) {
    if (this.serverlessSession) {
      this.serverlessSession.status = 'playing';
      this.serverlessSession.questionStatus = 'results';
      const qIdx = this.serverlessSession.currentQuestionIndex;
      if (!this.serverlessSession.answers[qIdx]) {
        this.serverlessSession.answers[qIdx] = {};
      }
      // Fill answers for any teams that didn't submit
      Object.keys(this.serverlessSession.teams).forEach(teamId => {
        if (!this.serverlessSession!.answers[qIdx][teamId]) {
          const team = this.serverlessSession!.teams[teamId];
          const question = this.serverlessSession!.game.questions[qIdx];
          const draft = this.serverlessSession!.drafts?.[qIdx]?.[teamId] ||
            this.serverlessSession!.drafts?.[String(qIdx)]?.[teamId] ||
            this.serverlessSession!.drafts?.[qIdx]?.[teamId.toLowerCase()] ||
            this.serverlessSession!.drafts?.[String(qIdx)]?.[teamId.toLowerCase()];

          const hasDrawing = Boolean(draft?.drawingDataUrl && draft.drawingDataUrl.length > 20);
          const hasText = Boolean(draft?.textAnswer && draft.textAnswer.trim());
          const isOpenEnded = question?.type === 'open_ended';

          if (isOpenEnded) {
            const drawing = draft?.drawingDataUrl || '';
            const text = (draft?.textAnswer || '').trim();
            const hasWork = Boolean(hasDrawing || hasText || draft?.hasDrawn);
            this.serverlessSession!.answers[qIdx][teamId] = {
              sessionId: this.serverlessSession!.sessionId,
              questionIndex: qIdx,
              questionId: question?.id || '',
              teamId,
              teamName: team?.teamName || teamId,
              answerId: hasWork ? 'draft_auto_submitted_end_question' : 'auto_submitted_end_question',
              answerText: text
                ? `Tự luận: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`
                : (drawing ? 'Bé đã vẽ tranh câu trả lời 🎨' : 'Đã nộp bài tự luận'),
              submittedAt: Date.now(),
              responseTimeMs: 0,
              isCorrect: false,
              pointsAwarded: 0,
              openEnded: {
                textAnswer: text,
                drawingDataUrl: drawing,
                hasDrawn: Boolean(hasWork),
                teacherGrade: 'pending',
                teacherPoints: question?.points || 10,
                teacherFeedback: '',
                gradedAt: Date.now(),
              },
            };
          } else {
            this.serverlessSession!.answers[qIdx][teamId] = {
              sessionId: this.serverlessSession!.sessionId,
              questionIndex: qIdx,
              questionId: question?.id || '',
              teamId,
              teamName: team?.teamName || teamId,
              answerId: 'timeout',
              answerText: 'Hết giờ (chưa trả lời)',
              submittedAt: Date.now(),
              responseTimeMs: 0,
              isCorrect: false,
              pointsAwarded: 0,
            };
          }
        }
      });
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:end_question',
      roomCode: roomCode.toUpperCase(),
    });
  }

  public nextQuestion(roomCode: string) {
    if (this.serverlessSession) {
      const maxQuestions = this.serverlessSession.isDualMode
        ? Math.max(this.serverlessSession.game.questions.length, this.serverlessSession.gameB?.questions?.length || 0)
        : this.serverlessSession.game.questions.length;
      const nextIndex = this.serverlessSession.currentQuestionIndex + 1;

      if (nextIndex >= maxQuestions) {
        this.serverlessSession.status = 'ended';
        this.serverlessSession.endedAt = Date.now();
        this.serverlessSession.questionStatus = 'results';
        this.persistServerlessSession();
        this.broadcastSession(this.serverlessSession);
        this.broadcast({
          type: 'game_ended',
          data: { session: this.serverlessSession },
        });
        this.emit('session_updated', { session: this.serverlessSession });
        this.emit('game_ended', { session: this.serverlessSession });
      } else {
        this.serverlessSession.status = 'playing';
        this.serverlessSession.currentQuestionIndex = nextIndex;
        this.serverlessSession.questionStatus = 'active';
        this.serverlessSession.questionStartTime = Date.now();
        if (!this.serverlessSession.answers[nextIndex]) {
          this.serverlessSession.answers[nextIndex] = {};
        }
        this.persistServerlessSession();
        this.broadcastSession(this.serverlessSession);
        this.emit('session_updated', { session: this.serverlessSession });
      }
    }

    this.send({
      type: 'host:next_question',
      roomCode: roomCode.toUpperCase(),
    });
  }

  public showLeaderboard(roomCode: string) {
    if (this.serverlessSession) {
      this.serverlessSession.status = 'playing';
      this.serverlessSession.questionStatus = 'leaderboard';
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:show_leaderboard',
      roomCode: roomCode.toUpperCase(),
    });
  }

  public endGame(roomCode: string) {
    if (this.serverlessSession) {
      this.serverlessSession.status = 'ended';
      this.serverlessSession.endedAt = Date.now();
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.broadcast({
        type: 'game_ended',
        data: { session: this.serverlessSession },
      });
      this.emit('session_updated', { session: this.serverlessSession });
      this.emit('game_ended', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:end_game',
      roomCode: roomCode.toUpperCase(),
    });
  }

  public restartGame(roomCode: string) {
    if (this.serverlessSession) {
      this.serverlessSession.status = 'lobby';
      this.serverlessSession.currentQuestionIndex = 0;
      this.serverlessSession.questionStatus = 'waiting';
      this.serverlessSession.answers = {};
      this.serverlessSession.questionStartTime = null;
      this.serverlessSession.startedAt = null;
      this.serverlessSession.endedAt = null;
      Object.values(this.serverlessSession.teams).forEach(t => {
        t.score = 0;
      });
      this.persistServerlessSession();
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:restart_game',
      roomCode: roomCode.toUpperCase(),
    });
  }

  public terminateSession(roomCode: string) {
    this.serverlessSession = null;
    this.send({
      type: 'host:terminate_session',
      roomCode: roomCode.toUpperCase(),
    });
  }

  public gradeOpenEndedAnswer(
    roomCode: string,
    questionIndex: number,
    teamId: string,
    points: number,
    isCorrect: boolean,
    feedback: string,
    annotatedDrawingDataUrl?: string
  ) {
    if (this.serverlessSession) {
      const qAns = this.serverlessSession.answers[questionIndex] || {};
      if (qAns[teamId]) {
        qAns[teamId].pointsAwarded = points;
        qAns[teamId].isCorrect = isCorrect;
        if (!qAns[teamId].openEnded) {
          qAns[teamId].openEnded = {};
        }
        qAns[teamId].openEnded!.teacherFeedback = feedback;
        qAns[teamId].openEnded!.teacherPoints = points;
        qAns[teamId].openEnded!.teacherGrade = isCorrect ? 'correct' : 'wrong';
        qAns[teamId].openEnded!.annotatedDrawingDataUrl = annotatedDrawingDataUrl;
        qAns[teamId].openEnded!.gradedAt = Date.now();
      }
      this.serverlessSession.answers[questionIndex] = qAns;
      if (this.serverlessSession.teams[teamId]) {
        this.serverlessSession.teams[teamId].score = (this.serverlessSession.teams[teamId].score || 0) + points;
      }
      this.broadcastSession(this.serverlessSession);
      this.emit('session_updated', { session: this.serverlessSession });
    }

    this.send({
      type: 'host:grade_open_ended',
      roomCode: roomCode.toUpperCase(),
      questionIndex,
      teamId,
      points,
      isCorrect,
      feedback,
      annotatedDrawingDataUrl,
    });
  }

  public requestSync(roomCode: string, role: 'host' | 'player', teamId?: string) {
    this.currentRoomCode = roomCode.toUpperCase();
    this.currentRole = role;
    if (teamId) this.currentTeamId = teamId;
    if (role === 'player' && this.serverlessSession) {
      this.emit('session_updated', { session: this.serverlessSession });
    }
    this.send({
      type: 'sync_request',
      roomCode: this.currentRoomCode,
      role,
      teamId,
      deviceId: this.currentDeviceId,
    });
  }

  public getCurrentRoomCode(): string | null {
    return this.currentRoomCode;
  }

  public getCurrentTeamId(): string | null {
    return this.currentTeamId;
  }

  public async fetchSessionState(roomCode: string, teamId?: string): Promise<SessionState | null> {
    if (this.serverlessSession && this.serverlessSession.roomCode === roomCode.toUpperCase()) {
      return this.serverlessSession;
    }
    if (this.shouldConnectLocalWs()) {
      try {
        const query = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
        const res = await fetch(`/api/session/${encodeURIComponent(roomCode.toUpperCase())}${query}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.session;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const realtime = new RealtimeClient();
