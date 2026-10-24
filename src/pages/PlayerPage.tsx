import React, { useEffect, useState, useRef } from 'react';
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

  // Restore saved team and room on phone refresh (only for SAME room)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = (urlParams.get('room') || initialRoomCode || '').trim().toUpperCase();
      const savedRoom = (localStorage.getItem('vuihoc_player_room') || '').trim().toUpperCase();
      const savedTeamId = localStorage.getItem('vuihoc_player_team_id');
      const savedDeviceId = localStorage.getItem('vuihoc_device_id');

      // If URL has a specific room that is different from previously saved room:
      // This is a NEW room scanned via QR code! Clear old team and do NOT auto-join!
      if (urlRoom && savedRoom && urlRoom !== savedRoom) {
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
      if (connected && session && joinedTeam) {
        realtime.requestSync(session.roomCode, 'player', joinedTeam.teamId);
      }
    });

    // Listen to join success (ONLY for this device/attempted team)
    const unsubJoin = realtime.on('join_success', (data: any) => {
      const myDevId = typeof window !== 'undefined' ? localStorage.getItem('vuihoc_device_id') : null;

      // Only accept if this join_success is for our own device or requested team
      const isForMe = (myDevId && data.team?.deviceId && data.team.deviceId === myDevId) ||
        (attemptedTeamIdRef.current && data.team?.teamId === attemptedTeamIdRef.current) ||
        (joinedTeam && data.team?.teamId === joinedTeam.teamId);

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
        localStorage.setItem('vuihoc_player_room', data.session.roomCode);
        localStorage.setItem('vuihoc_player_team_id', data.team.teamId);
        window.history.replaceState({}, '', `/join?room=${data.session.roomCode}`);
      }
    });

    // Listen to authoritative session updates
    const unsubUpdate = realtime.on('session_updated', (data: any) => {
      if (!data || !data.session) return;
      setSession(data.session);
      if (joinedTeam) {
        const remoteTeam = data.session.teams?.[joinedTeam.teamId];
        if (remoteTeam) {
          setJoinedTeam({
            ...remoteTeam,
            assignedSet: remoteTeam.assignedSet || data.session.teamAssignments?.[joinedTeam.teamId] || joinedTeam.assignedSet || 'A',
          });
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
          localStorage.removeItem('vuihoc_player_room');
          localStorage.removeItem('vuihoc_player_team_id');
        }
      }
    });

    // Listen to team removed by host
    const unsubTeamRemoved = realtime.on('team_removed', (data: any) => {
      if (joinedTeam && data.teamId === joinedTeam.teamId) {
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
  }, [joinedTeam]);

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

  // Periodic sync while in waiting lobby so that when host starts question 1,
  // player immediately transitions out of lobby even if initial broadcast dropped
  useEffect(() => {
    if (!session || !joinedTeam || session.status !== 'lobby') return;

    const syncInterval = window.setInterval(async () => {
      // 1. Send realtime sync request
      realtime.requestSync(session.roomCode, 'player', joinedTeam.teamId);

      // 2. Fetch session snapshot from REST API as fallback with team-specific query
      try {
        const latest = await realtime.fetchSessionState(session.roomCode, joinedTeam.teamId);
        if (latest && latest.status === 'playing') {
          setSession(latest);
          if (latest.teams?.[joinedTeam.teamId]) {
            const upd = latest.teams[joinedTeam.teamId];
            setJoinedTeam({
              ...upd,
              assignedSet: upd.assignedSet || latest.teamAssignments?.[joinedTeam.teamId] || joinedTeam.assignedSet || 'A',
            });
          }
        }
      } catch {}
    }, 2000);

    return () => clearInterval(syncInterval);
  }, [session?.status, session?.roomCode, joinedTeam?.teamId]);

  // Notify server only when browser tab is definitively closed
  useEffect(() => {
    const handleUnload = () => {
      if (session && joinedTeam) {
        realtime.leaveRoom(session.roomCode, joinedTeam.teamId, joinedTeam.deviceId);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [session, joinedTeam]);

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

  const handleSubmitAnswer = (answerId: string, answerIds?: string[]) => {
    if (!session || !joinedTeam) return;
    realtime.submitAnswer(
      session.roomCode,
      joinedTeam.teamId,
      session.currentQuestionIndex,
      answerId,
      answerIds
    );
  };

  const handleSubmitDragPlacements = (placements: Record<string, string>, isFinal: boolean) => {
    if (!session || !joinedTeam) return;
    realtime.send({
      type: 'player:submit_answer',
      roomCode: session.roomCode,
      teamId: joinedTeam.teamId,
      questionIndex: session.currentQuestionIndex,
      placements,
      liveProgress: !isFinal,
    });
  };

  const handleSubmitHtmlGameResult = (result: any) => {
    if (!session || !joinedTeam) return;
    realtime.send({
      type: 'player:submit_answer',
      roomCode: session.roomCode,
      teamId: joinedTeam.teamId,
      questionIndex: session.currentQuestionIndex,
      htmlGameResult: result,
      answerId: 'html_game_complete',
    });
  };

  const handleSubmitOpenEnded = (textAnswer: string, drawingDataUrl: string, explicitQIndex?: number) => {
    if (!session || !joinedTeam) return;
    const targetQIdx = explicitQIndex !== undefined ? explicitQIndex : session.currentQuestionIndex;
    realtime.send({
      type: 'player:submit_answer',
      roomCode: session.roomCode,
      teamId: joinedTeam.teamId,
      questionIndex: targetQIdx,
      answerId: 'open_ended_submitted',
      openEnded: {
        textAnswer,
        drawingDataUrl,
      },
    });
  };

  const handleSubmitWordDrag = (chosenLetter: string, _isCorrect: boolean) => {
    if (!session || !joinedTeam) return;
    realtime.send({
      type: 'player:submit_answer',
      roomCode: session.roomCode,
      teamId: joinedTeam.teamId,
      questionIndex: session.currentQuestionIndex,
      answerId: chosenLetter,
      answerIds: [chosenLetter],
      chosenLetter,
    });
  };


  const handleExitToHome = () => {
    sounds.playClick();
    stopSpeaking();
    if (session && joinedTeam) {
      realtime.leaveRoom(session.roomCode, joinedTeam.teamId, joinedTeam.deviceId);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vuihoc_player_room');
      localStorage.removeItem('vuihoc_player_team_id');
      window.history.replaceState({}, '', '/');
    }
    setSession(null);
    setJoinedTeam(null);
    onExit();
  };

  // If not joined yet, show Join Screen
  if (!joinedTeam || !session) {
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

  const currentQIndex = session.currentQuestionIndex;
  const myAssignedSet: 'A' | 'B' = (joinedTeam && joinedTeam.assignedSet) ||
    (joinedTeam && session.teamAssignments?.[joinedTeam.teamId]) ||
    session.myAssignedSet ||
    'A';

  // In Dual Mode, determine the exact question set assigned to this team
  let effectiveGame = session.game;
  if (session.isDualMode) {
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
  const currentQ = effectiveGame.questions[currentQIndex];
  const myAnswer: TeamAnswer | undefined = session.answers[currentQIndex]?.[joinedTeam.teamId];

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
            key={`q_html_${currentQIndex}`}
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
              key={`q_word_${currentQIndex}`}
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
            key={`q_drag_${currentQIndex}`}
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
              key={`q_open_${currentQIndex}`}
              question={{ ...currentQ, noTimeLimit: true }}
              questionIndex={currentQIndex}
              totalQuestions={effectiveGame.questions.length}
              startTime={session.questionStartTime}
              timeLimit={0}
              roomCode={session.roomCode}
              teamId={joinedTeam.teamId}
              existingAnswer={myAnswer}
              onSubmitOpenEnded={(text, draw) => handleSubmitOpenEnded(text, draw, currentQIndex)}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 h-full overflow-y-auto overscroll-contain pb-4 sm:pb-6">
            <PlayerQuestion
              key={`q_choice_${currentQIndex}`}
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
