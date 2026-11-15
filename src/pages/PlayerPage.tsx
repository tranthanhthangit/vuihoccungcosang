import React, { useEffect, useState, useRef, useCallback } from 'react';
import { SessionState, ConnectedTeam, TeamAnswer } from '../types/game';
import { realtime } from '../services/realtimeClient';
import { PlayerJoin } from '../components/player/PlayerJoin';
import { PlayerWaiting } from '../components/player/PlayerWaiting';
import { PlayerQuestion } from '../components/player/PlayerQuestion';
import { PlayerDragDropQuestion } from '../components/player/PlayerDragDropQuestion';
import { PlayerHtmlQuestion } from '../components/player/PlayerHtmlQuestion';
import { PlayerOpenEndedQuestion } from '../components/player/PlayerOpenEndedQuestion';
import { PlayerWordDragQuestion } from '../components/player/PlayerWordDragQuestion';
import { PlayerResult } from '../components/player/PlayerResult';
import { PlayerQuestionsCompleted } from '../components/player/PlayerQuestionsCompleted';
import { sounds } from '../utils/sound';
import { Modal } from '../components/common/Modal';
import { stopSpeaking } from '../utils/speechVoice';

interface PlayerPageProps {
  initialRoomCode?: string;
  onExit: () => void;
  onJoinedStateChange?: (isJoined: boolean) => void;
}

export const PlayerPage: React.FC<PlayerPageProps> = ({
  initialRoomCode = '',
  onExit,
  onJoinedStateChange,
}) => {
  const [session, setSession] = useState<SessionState | null>(null);
  const [joinedTeam, setJoinedTeam] = useState<ConnectedTeam | null>(null);
  const [roomCode, setRoomCode] = useState<string>(() => {
    if (initialRoomCode && initialRoomCode.trim()) return initialRoomCode.trim().toUpperCase();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('room');
      if (urlRoom && urlRoom.trim()) return urlRoom.trim().toUpperCase();
      const savedRoom = localStorage.getItem('vuihoc_player_room');
      if (savedRoom && savedRoom.trim()) return savedRoom.trim().toUpperCase();
    }
    return '';
  });
  const [isConnected, setIsConnected] = useState(realtime.getIsConnected());
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const joinRetryTimerRef = useRef<number | null>(null);
  const joinTimeoutTimerRef = useRef<number | null>(null);
  const attemptedTeamIdRef = useRef<string | null>(null);
  const sessionRef = useRef<SessionState | null>(session);
  sessionRef.current = session;
  const joinedTeamRef = useRef<ConnectedTeam | null>(joinedTeam);
  joinedTeamRef.current = joinedTeam;

  const clearJoinTimers = () => {
    if (joinRetryTimerRef.current) {
      clearInterval(joinRetryTimerRef.current);
      joinRetryTimerRef.current = null;
    }
    if (joinTimeoutTimerRef.current) {
      clearTimeout(joinTimeoutTimerRef.current);
      joinTimeoutTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearJoinTimers();
    };
  }, []);

  // Keep mobile/tablet screen awake (Screen Wake Lock API) while child waits or plays
  // Prevents tablet from auto-sleeping during the 15-minute sequential device setup!
  useEffect(() => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    let wakeLockSentinel: any = null;

    const requestWakeLock = async () => {
      try {
        if (document.visibilityState === 'visible') {
          wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Silently ignore if browser requires user gesture first
      }
    };

    requestWakeLock();

    const handleVisibilityOrTouch = () => {
      if (document.visibilityState === 'visible' && !wakeLockSentinel) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrTouch);
    window.addEventListener('touchstart', handleVisibilityOrTouch, { passive: true });
    window.addEventListener('click', handleVisibilityOrTouch, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrTouch);
      window.removeEventListener('touchstart', handleVisibilityOrTouch);
      window.removeEventListener('click', handleVisibilityOrTouch);
      if (wakeLockSentinel) {
        try {
          wakeLockSentinel.release();
        } catch {}
      }
    };
  }, []);

  // Restore saved team and room on phone refresh (only for SAME room)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = (urlParams.get('room') || initialRoomCode || '').trim().toUpperCase();
      const savedRoom = (
        sessionStorage.getItem('vuihoc_player_room') ||
        localStorage.getItem('vuihoc_player_room') ||
        ''
      ).trim().toUpperCase();
      const savedTeamId =
        sessionStorage.getItem('vuihoc_player_team_id') ||
        localStorage.getItem('vuihoc_player_team_id');
      const savedDeviceId =
        sessionStorage.getItem('vuihoc_device_id') ||
        localStorage.getItem('vuihoc_device_id');

      // If URL has a specific room that is different from previously saved room:
      // This is a NEW room scanned via QR code! Clear old team and do NOT auto-join!
      if (urlRoom && savedRoom && urlRoom !== savedRoom) {
        sessionStorage.removeItem('vuihoc_player_room');
        sessionStorage.removeItem('vuihoc_player_team_id');
        localStorage.removeItem('vuihoc_player_room');
        localStorage.removeItem('vuihoc_player_team_id');
        setRoomCode(urlRoom);
        return;
      }

      const targetRoom = urlRoom || savedRoom;
      if (targetRoom) {
        setRoomCode(targetRoom);
      }

      // ONLY auto-rejoin if it's the exact same room previously joined by this student
      if (targetRoom && targetRoom === savedRoom && savedTeamId && savedDeviceId) {
        setIsJoining(true);
        realtime.joinRoom(targetRoom, savedTeamId, savedDeviceId);
      }
    }
  }, [initialRoomCode]);

  useEffect(() => {
    // Listen to connection changes
    const unsubConn = realtime.on('connection_change', (data: any) => {
      const connected = data.status === 'connected';
      setIsConnected(connected);
      const curSession = sessionRef.current;
      const curTeam = joinedTeamRef.current;
      if (connected && curSession && curTeam) {
        realtime.requestSync(curSession.roomCode, 'player', curTeam.teamId);
      }
    });

    // Listen to join success (ONLY for this device/attempted team)
    const unsubJoin = realtime.on('join_success', (data: any) => {
      const myDevId =
        typeof window !== 'undefined'
          ? sessionStorage.getItem('vuihoc_device_id') || localStorage.getItem('vuihoc_device_id')
          : null;
      const curTeam = joinedTeamRef.current;

      // Only accept if this join_success is for our own device or requested team
      const isForMe = (myDevId && data.team?.deviceId && data.team.deviceId === myDevId) ||
        (attemptedTeamIdRef.current && data.team?.teamId === attemptedTeamIdRef.current) ||
        (curTeam && data.team?.teamId === curTeam.teamId);

      if (!isForMe) {
        // Do NOT overwrite our session or team with another device's data
        return;
      }

      clearJoinTimers();
      setSession(data.session);
      setJoinedTeam(data.team);
      setIsJoining(false);
      setJoinError(null);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('vuihoc_player_room', data.session.roomCode);
        sessionStorage.setItem('vuihoc_player_team_id', data.team.teamId);
        localStorage.setItem('vuihoc_player_room', data.session.roomCode);
        localStorage.setItem('vuihoc_player_team_id', data.team.teamId);
        window.history.replaceState({}, '', `/join?room=${data.session.roomCode}`);
      }
    });

    // Listen to authoritative session updates
    const unsubUpdate = realtime.on('session_updated', (data: any) => {
      if (!data || !data.session) return;
      setSession(data.session);
      const curTeam = joinedTeamRef.current;
      if (curTeam) {
        const remoteTeam = data.session.teams?.[curTeam.teamId];
        if (remoteTeam) {
          const nextSet = remoteTeam.assignedSet || data.session.teamAssignments?.[curTeam.teamId] || curTeam.assignedSet || 'A';
          if (
            remoteTeam.score !== curTeam.score ||
            remoteTeam.teamName !== curTeam.teamName ||
            remoteTeam.online !== curTeam.online ||
            nextSet !== curTeam.assignedSet
          ) {
            setJoinedTeam({
              ...remoteTeam,
              assignedSet: nextSet,
            });
          }
        }
      }
    });

    // Listen to game ended
    const unsubGameEnded = realtime.on('game_ended', (data: any) => {
      sounds.playFanfare();
      setSession(data.session);
    });

    // Listen to errors
    const unsubError = realtime.on('error', (data: any) => {
      clearJoinTimers();
      setJoinError(data.message || 'Lỗi khi tham gia phòng');
      setIsJoining(false);

      if (data.message && data.message.includes('không tồn tại')) {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('vuihoc_player_room');
          sessionStorage.removeItem('vuihoc_player_team_id');
          localStorage.removeItem('vuihoc_player_room');
          localStorage.removeItem('vuihoc_player_team_id');
        }
      }
    });

    // Listen to team removed by host
    const unsubTeamRemoved = realtime.on('team_removed', (data: any) => {
      const curTeam = joinedTeamRef.current;
      if (curTeam && data.teamId === curTeam.teamId) {
        clearJoinTimers();
        setJoinError('Đội của bạn đã được đưa ra khỏi phòng.');
        setJoinedTeam(null);
      }
    });

    return () => {
      unsubConn();
      unsubJoin();
      unsubUpdate();
      unsubGameEnded();
      unsubError();
      unsubTeamRemoved();
    };
  }, []);

  // Sync joined state to parent App (for conditional header logo/home prompt)
  useEffect(() => {
    onJoinedStateChange?.(Boolean(joinedTeam && session));
  }, [joinedTeam, session, onJoinedStateChange]);

  useEffect(() => {
    return () => {
      onJoinedStateChange?.(false);
    };
  }, [onJoinedStateChange]);

  // Stop any active speech when round results or ended screen shows up
  useEffect(() => {
    if (session?.questionStatus !== 'active' || session?.status !== 'playing') {
      stopSpeaking();
    }
  }, [session?.questionStatus, session?.status]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Continuous sync during BOTH waiting lobby and active gameplay:
  // 1. Keeps the student's presence online via HTTP + WebSocket even if WebSocket briefly drops during 15-minute setup.
  // 2. Ensures immediate transition when host starts question 1, advances to next question, or shows results.
  useEffect(() => {
    if (!session || !joinedTeam || session.status === 'ended') return;

    const intervalMs = session.status === 'lobby' ? 2500 : 3500;
    const syncInterval = window.setInterval(async () => {
      // 1. Send realtime sync request
      realtime.requestSync(session.roomCode, 'player', joinedTeam.teamId);

      // 2. Fetch session snapshot from REST API as fallback with team-specific query
      try {
        const latest = await realtime.fetchSessionState(session.roomCode, joinedTeam.teamId);
        if (latest) {
          setSession((prev) => {
            if (!prev) return latest;
            const prevMyAns = prev.answers?.[prev.currentQuestionIndex]?.[joinedTeam.teamId];
            const nextMyAns = latest.answers?.[latest.currentQuestionIndex]?.[joinedTeam.teamId];
            const prevSet = prev.teamAssignments?.[joinedTeam.teamId];
            const nextSet = latest.teamAssignments?.[joinedTeam.teamId];
            // Update if status, question index, question status, start time, assignment, or my answer/grade changed
            if (
              prev.status !== latest.status ||
              prev.currentQuestionIndex !== latest.currentQuestionIndex ||
              prev.questionStatus !== latest.questionStatus ||
              prev.questionStartTime !== latest.questionStartTime ||
              prev.isDualMode !== latest.isDualMode ||
              prev.myAssignedSet !== latest.myAssignedSet ||
              prevSet !== nextSet ||
              prevMyAns?.submittedAt !== nextMyAns?.submittedAt ||
              prevMyAns?.pointsAwarded !== nextMyAns?.pointsAwarded ||
              prevMyAns?.openEnded?.teacherGrade !== nextMyAns?.openEnded?.teacherGrade ||
              prevMyAns?.openEnded?.teacherFeedback !== nextMyAns?.openEnded?.teacherFeedback ||
              prevMyAns?.openEnded?.annotatedDrawingDataUrl !== nextMyAns?.openEnded?.annotatedDrawingDataUrl
            ) {
              return latest;
            }
            return prev;
          });
          if (latest.teams?.[joinedTeam.teamId]) {
            const upd = latest.teams[joinedTeam.teamId];
            const nextSet = upd.assignedSet || latest.teamAssignments?.[joinedTeam.teamId] || joinedTeam.assignedSet || 'A';
            setJoinedTeam((prevTeam) => {
              if (!prevTeam) return { ...upd, assignedSet: nextSet };
              if (
                prevTeam.score === upd.score &&
                prevTeam.teamName === upd.teamName &&
                prevTeam.online === upd.online &&
                prevTeam.assignedSet === nextSet
              ) {
                return prevTeam;
              }
              return { ...upd, assignedSet: nextSet };
            });
          }
        }
      } catch {}
    }, intervalMs);

    return () => clearInterval(syncInterval);
  }, [session?.status, session?.roomCode, joinedTeam?.teamId]);

  // Notify server only when browser tab is definitively closed
  useEffect(() => {
    const handleUnload = () => {
      const curSession = sessionRef.current;
      const curTeam = joinedTeamRef.current;
      if (curSession && curTeam) {
        realtime.leaveRoom(curSession.roomCode, curTeam.teamId, curTeam.deviceId);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  const handleJoin = (code: string, teamId: string, devId: string, customTeamName?: string) => {
    setIsJoining(true);
    setJoinError(null);
    setRoomCode(code);
    attemptedTeamIdRef.current = teamId;
    clearJoinTimers();

    realtime.joinRoom(code, teamId, devId, customTeamName);

    // Retry sending player:join every 1.5 seconds (up to 4 times) in case channel was connecting
    let attempt = 0;
    joinRetryTimerRef.current = window.setInterval(() => {
      attempt++;
      if (attempt >= 4) {
        if (joinRetryTimerRef.current) clearInterval(joinRetryTimerRef.current);
        return;
      }
      realtime.send({
        type: 'player:join',
        roomCode: code.toUpperCase(),
        teamId,
        deviceId: devId,
        customTeamName: customTeamName?.trim() || undefined,
      });
    }, 1500);

    // Timeout safety: after 8 seconds without response, release UI and show friendly message
    joinTimeoutTimerRef.current = window.setTimeout(() => {
      clearJoinTimers();
      setIsJoining(false);
      setJoinError(`Chưa thấy phòng ${code} phản hồi. Bạn hãy kiểm tra xem cô giáo đã ấn "Tạo phòng" chưa nhé!`);
    }, 8000);
  };

  const handleSubmitAnswer = useCallback((answerId: string, answerIds?: string[]) => {
    const curSession = sessionRef.current;
    const curTeam = joinedTeamRef.current;
    if (!curSession || !curTeam) return;
    realtime.submitAnswer(
      curSession.roomCode,
      curTeam.teamId,
      curSession.currentQuestionIndex,
      answerId,
      answerIds
    );
  }, []);

  const handleSubmitDragPlacements = useCallback((placements: Record<string, string>, isFinal: boolean) => {
    const curSession = sessionRef.current;
    const curTeam = joinedTeamRef.current;
    if (!curSession || !curTeam) return;
    realtime.send({
      type: 'player:submit_answer',
      roomCode: curSession.roomCode,
      teamId: curTeam.teamId,
      questionIndex: curSession.currentQuestionIndex,
      placements,
      liveProgress: !isFinal,
    });
  }, []);

  const handleSubmitHtmlGameResult = useCallback((result: any) => {
    const curSession = sessionRef.current;
    const curTeam = joinedTeamRef.current;
    if (!curSession || !curTeam) return;
    realtime.send({
      type: 'player:submit_answer',
      roomCode: curSession.roomCode,
      teamId: curTeam.teamId,
      questionIndex: curSession.currentQuestionIndex,
      htmlGameResult: result,
      answerId: 'html_game_complete',
    });
  }, []);

  const handleSubmitOpenEnded = useCallback((textAnswer: string, drawingDataUrl: string, explicitQIndex?: number) => {
    const curSession = sessionRef.current;
    const curTeam = joinedTeamRef.current;
    if (!curSession || !curTeam) return;
    const targetQIdx = explicitQIndex !== undefined ? explicitQIndex : curSession.currentQuestionIndex;
    realtime.send({
      type: 'player:submit_answer',
      roomCode: curSession.roomCode,
      teamId: curTeam.teamId,
      questionIndex: targetQIdx,
      answerId: 'open_ended_submitted',
      openEnded: {
        textAnswer,
        drawingDataUrl,
      },
    });
  }, []);

  const handleSubmitWordDrag = useCallback((chosenLetter: string, _isCorrect: boolean) => {
    const curSession = sessionRef.current;
    const curTeam = joinedTeamRef.current;
    if (!curSession || !curTeam) return;
    realtime.send({
      type: 'player:submit_answer',
      roomCode: curSession.roomCode,
      teamId: curTeam.teamId,
      questionIndex: curSession.currentQuestionIndex,
      answerId: chosenLetter,
      answerIds: [chosenLetter],
      chosenLetter,
    });
  }, []);


  const handleExitToHome = () => {
    sounds.playClick();
    stopSpeaking();
    if (session && joinedTeam) {
      realtime.leaveRoom(session.roomCode, joinedTeam.teamId, joinedTeam.deviceId);
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('vuihoc_player_room');
      sessionStorage.removeItem('vuihoc_player_team_id');
      localStorage.removeItem('vuihoc_player_room');
      localStorage.removeItem('vuihoc_player_team_id');
      window.history.replaceState({}, '', '/');
    }
    setSession(null);
    setJoinedTeam(null);
    onExit();
  };

  const currentQIndex = session?.currentQuestionIndex ?? 0;
  const myAssignedSet: 'A' | 'B' = (joinedTeam && joinedTeam.assignedSet) ||
    (joinedTeam && session?.teamAssignments?.[joinedTeam.teamId]) ||
    session?.myAssignedSet ||
    'A';

  // In Dual Mode, determine the exact question set assigned to this team
  let effectiveGame = session?.game;
  if (session?.isDualMode) {
    if (myAssignedSet === 'B') {
      if (session.gameB) {
        effectiveGame = session.gameB;
      } else if (session.game && (session.gameId === session.gameBId || session.myAssignedSet === 'B')) {
        effectiveGame = session.game;
      }
    } else {
      if (session.gameA) {
        effectiveGame = session.gameA;
      } else {
        effectiveGame = session.game;
      }
    }
  }
  const currentQ = effectiveGame?.questions?.[currentQIndex];

  // If teacher collected answers and child has a local drawing that wasn't yet acknowledged on server, push it immediately
  // Note: Must remain at top-level before any return to uphold React Rules of Hooks!
  useEffect(() => {
    if (session && joinedTeam && session.questionStatus === 'results' && currentQ?.type === 'open_ended') {
      const localDrawing = typeof window !== 'undefined'
        ? localStorage.getItem(`vuihoc_drawing_${session.roomCode}_${joinedTeam.teamId}_${currentQIndex}`)
        : null;
      const remoteDrawing = session.answers?.[currentQIndex]?.[joinedTeam.teamId]?.openEnded?.drawingDataUrl;
      if (localDrawing && localDrawing.length > 50 && (!remoteDrawing || remoteDrawing.length < 50)) {
        handleSubmitOpenEnded('', localDrawing, currentQIndex);
      }
    }
  }, [session?.questionStatus, currentQIndex, joinedTeam?.teamId, currentQ?.type]);

  // If not joined yet, show Join Screen
  if (!joinedTeam || !session || !effectiveGame) {
    return (
      <PlayerJoin
        initialRoomCode={roomCode}
        onJoin={handleJoin}
        onExit={handleExitToHome}
        error={joinError}
        isLoading={isJoining}
      />
    );
  }

  const rawAnswer: TeamAnswer | undefined = session.answers[currentQIndex]?.[joinedTeam.teamId];

  // Synthesize or enhance answer for open_ended question so child's drawing is never marked as "chưa làm bài"
  let myAnswer = rawAnswer;
  if (currentQ?.type === 'open_ended') {
    const localSavedDrawing = typeof window !== 'undefined'
      ? localStorage.getItem(`vuihoc_drawing_${session.roomCode}_${joinedTeam.teamId}_${currentQIndex}`)
      : null;

    if (localSavedDrawing && localSavedDrawing.length > 50) {
      if (!myAnswer) {
        myAnswer = {
          sessionId: session.roomCode,
          questionIndex: currentQIndex,
          questionId: currentQ.id,
          teamId: joinedTeam.teamId,
          teamName: joinedTeam.teamName,
          answerId: 'open_ended_submitted',
          answerText: 'Bé đã vẽ tranh câu trả lời 🎨',
          submittedAt: Date.now(),
          responseTimeMs: 0,
          isCorrect: false,
          pointsAwarded: 0,
          openEnded: {
            textAnswer: '',
            drawingDataUrl: localSavedDrawing,
            hasDrawn: true,
            teacherGrade: 'pending',
            teacherPoints: currentQ.points || 1,
            teacherFeedback: '',
            gradedAt: Date.now(),
          },
        };
      } else if (!myAnswer.openEnded?.drawingDataUrl || myAnswer.openEnded.drawingDataUrl.length < 50) {
        myAnswer = {
          ...myAnswer,
          answerText: myAnswer.openEnded?.textAnswer
            ? myAnswer.answerText
            : 'Bé đã vẽ tranh câu trả lời 🎨',
          openEnded: {
            ...myAnswer.openEnded,
            drawingDataUrl: localSavedDrawing,
            hasDrawn: true,
            teacherGrade: myAnswer.openEnded?.teacherGrade || 'pending',
            teacherPoints: myAnswer.openEnded?.teacherPoints ?? (currentQ.points || 1),
          },
        };
      }
    }
  }

  const isNoLimitQ = true;
  const effectiveTimeLimit = 0;

  return (
    <div className="flex-1 flex flex-col select-none touch-manipulation bg-gradient-to-b from-sky-50/40 via-purple-50/20 to-amber-50/30 min-h-0 h-full max-h-full overflow-hidden">
      {/* Screen 1: Waiting for host in lobby (clean, no exit or change team buttons so children just wait for teacher to start) */}
      {session.status === 'lobby' && (
        <PlayerWaiting
          team={joinedTeam}
          roomCode={session.roomCode}
          isConnected={isConnected}
          isDualMode={session.isDualMode}
          myAssignedSet={myAssignedSet}
          assignedSetTitle={session.assignedSetTitle || effectiveGame.title}
        />
      )}

      {/* Dual Mode Indicator Banner for Student */}
      {session.isDualMode && session.status === 'playing' && (
        <div className="bg-white/95 backdrop-blur-md border-b border-indigo-100 py-1.5 px-3 text-center shadow-2xs flex items-center justify-center gap-1.5 shrink-0">
          <span className="text-[11px] font-black text-indigo-800">
            🎯 {myAssignedSet === 'B' ? 'Bộ câu hỏi 2' : 'Bộ câu hỏi 1'}: {session.assignedSetTitle || effectiveGame.title}
          </span>
        </div>
      )}

      {/* Screen 2: Question Active (Supports HTML5 Games, Drag-Drop Canvas, and Multiple Choice) */}
      {session.status === 'playing' && (session.questionStatus === 'active' || session.questionStatus === 'waiting') && currentQ && (
        (
          currentQ.type === 'html_game' ||
          Boolean(currentQ.htmlContent) ||
          Boolean(currentQ.gameUrl) ||
          Boolean(effectiveGame.gameUrl) ||
          effectiveGame.gameType === 'html_game' ||
          Boolean(effectiveGame.isZipArchive)
        ) ? (
          <PlayerHtmlQuestion
            key={`q_html_${currentQ.id}_${currentQIndex}`}
            question={currentQ}
            gameUrl={currentQ.gameUrl || effectiveGame.gameUrl}
            questionIndex={currentQIndex}
            totalQuestions={effectiveGame.questions.length}
            startTime={session.questionStartTime}
            timeLimit={effectiveTimeLimit}
            existingAnswer={myAnswer}
            onSubmitResult={handleSubmitHtmlGameResult}
          />
        ) : (currentQ.type === 'word_drag_drop') ? (
          <div className="flex-1 min-h-0 h-full max-h-full overflow-hidden flex flex-col">
            <PlayerWordDragQuestion
              key={`q_word_${currentQ.id}_${currentQIndex}`}
              question={{ ...currentQ, noTimeLimit: isNoLimitQ }}
              questionIndex={currentQIndex}
              totalQuestions={effectiveGame.questions.length}
              startTime={session.questionStartTime}
              timeLimit={effectiveTimeLimit}
              existingAnswer={myAnswer}
              onSubmitLetter={handleSubmitWordDrag}
            />
          </div>
        ) : ((currentQ.type === 'drag_drop' || Boolean(currentQ.canvasConfig)) && currentQ.canvasConfig) ? (
          <PlayerDragDropQuestion
            key={`q_drag_${currentQ.id}_${currentQIndex}`}
            question={{ ...currentQ, noTimeLimit: isNoLimitQ }}
            questionIndex={currentQIndex}
            totalQuestions={effectiveGame.questions.length}
            startTime={session.questionStartTime}
            timeLimit={effectiveTimeLimit}
            existingAnswer={myAnswer}
            onSubmitPlacements={handleSubmitDragPlacements}
          />
        ) : (currentQ.type === 'open_ended') ? (
          <div className="flex-1 min-h-0 h-full max-h-full overflow-hidden flex flex-col">
            <PlayerOpenEndedQuestion
              key={`q_open_${currentQ.id}_${currentQIndex}`}
              question={{ ...currentQ, noTimeLimit: true }}
              questionIndex={currentQIndex}
              totalQuestions={effectiveGame.questions.length}
              startTime={session.questionStartTime}
              timeLimit={0}
              roomCode={session.roomCode}
              teamId={joinedTeam.teamId}
              existingAnswer={myAnswer}
              onSubmitOpenEnded={handleSubmitOpenEnded}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 h-full overflow-y-auto overscroll-contain pb-4 sm:pb-6">
            <PlayerQuestion
              key={`q_choice_${currentQ.id}_${currentQIndex}`}
              question={{ ...currentQ, noTimeLimit: isNoLimitQ }}
              questionIndex={currentQIndex}
              totalQuestions={effectiveGame.questions.length}
              startTime={session.questionStartTime}
              timeLimit={effectiveTimeLimit}
              existingAnswer={myAnswer}
              onSubmitAnswer={handleSubmitAnswer}
            />
          </div>
        )
      )}

      {/* Screen 3: Round Results */}
      {session.status === 'playing' && (session.questionStatus === 'results' || session.questionStatus === 'leaderboard') && currentQ && (
        <div className="flex-1 min-h-0 h-full overflow-y-auto overscroll-contain pb-4 sm:pb-6">
          <PlayerResult
            key={`res_${currentQIndex}`}
            question={currentQ}
            questionIndex={currentQIndex}
            totalQuestions={effectiveGame.questions.length}
            answer={myAnswer}
          />
        </div>
      )}

      {/* Screen 3.5: All Questions in Question Set Completed while game is still playing */}
      {session.status === 'playing' && (!currentQ || currentQIndex >= effectiveGame.questions.length) && (
        <PlayerQuestionsCompleted
          team={joinedTeam}
          session={session}
        />
      )}

      {/* Screen 4: Game Ended */}
      {session.status === 'ended' && (
        <div className="max-w-xl sm:max-w-2xl mx-auto w-full px-4 py-8 text-center my-auto">
          <div className="bg-white rounded-3xl p-8 border-4 border-amber-200 shadow-2xl">
            <span className="text-6xl animate-bounce inline-block mb-3">🏆</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
              HOÀN THÀNH TRÒ CHƠI!
            </h2>
            <p className="text-sm font-bold text-slate-600 mb-6">
              Chúc mừng <span className="text-indigo-600 font-extrabold">{joinedTeam.teamName}</span> đã tham gia thật xuất sắc!
            </p>

            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 mb-6">
              <span className="text-xs font-bold text-amber-800 uppercase block">
                Tổng điểm của đội bé
              </span>
              <span className="text-4xl font-black text-amber-600 font-mono">
                {session.teams[joinedTeam.teamId]?.score || 0}
              </span>
              <span className="text-xs font-bold text-amber-700 block">
                điểm
              </span>
            </div>

            <button
              onClick={() => setShowExitConfirm(true)}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-md transition active:scale-95 cursor-pointer"
            >
              Về trang chính
            </button>
          </div>
        </div>
      )}

      {/* Exit Confirmation Dialog for Student */}
      <Modal
        isOpen={showExitConfirm}
        title="Kết thúc phiên học?"
        message="Bé có chắc chắn muốn kết thúc phiên học này không? Nếu kết thúc, bé sẽ rời khỏi phòng chơi."
        confirmText="Kết thúc phiên học"
        cancelText="Ở lại chơi tiếp"
        confirmVariant="danger"
        onConfirm={handleExitToHome}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
};
