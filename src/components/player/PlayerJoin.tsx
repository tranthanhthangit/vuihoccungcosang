import React, { useState, useEffect } from 'react';
import { Sparkles, Users, ArrowRight, AlertCircle, RefreshCw, ArrowLeft, Edit3, X, RotateCcw, Home, Lock, Check } from 'lucide-react';
import { SessionState } from '../../types/game';
import { TEAM_PRESETS } from '../../data/teamPresets';
import { generateDeviceId } from '../../utils/codeGenerator';
import { sounds } from '../../utils/sound';
import { unlockSpeechAudio } from '../../utils/speechVoice';
import { realtime } from '../../services/realtimeClient';

interface PlayerJoinProps {
  initialRoomCode?: string;
  onJoin: (roomCode: string, teamId: string, deviceId: string, customTeamName?: string) => void;
  onExit?: () => void;
  error?: string | null;
  isLoading?: boolean;
}

const QUICK_TEAM_SUGGESTIONS = [
  'máy 1',
  'máy 2',
  'máy 3',
  'máy 4',
  'máy 5',
  'máy 6',
  'máy 7',
  'máy 8',
  'máy 9',
  'máy 10',
  'máy 11',
  'máy 12',
];

export const PlayerJoin: React.FC<PlayerJoinProps> = ({
  initialRoomCode = '',
  onJoin,
  onExit,
  error,
  isLoading = false,
}) => {
  const [roomCode, setRoomCode] = useState(() => {
    if (initialRoomCode && initialRoomCode.trim()) {
      return initialRoomCode.trim().toUpperCase();
    }
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const r = urlParams.get('room');
      if (r && r.trim()) return r.trim().toUpperCase();
    }
    return '';
  });
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('team') || '';
    }
    return '';
  });
  const [customTeamName, setCustomTeamName] = useState<string>('');
  const [deviceId] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vuihoc_device_id');
      if (saved) return saved;
      const created = generateDeviceId();
      localStorage.setItem('vuihoc_device_id', created);
      return created;
    }
    return generateDeviceId();
  });

  const [sessionData, setSessionData] = useState<SessionState | null>(null);
  const [fetchingSession, setFetchingSession] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);

  // Sync initialRoomCode when prop changes or is provided dynamically
  useEffect(() => {
    if (initialRoomCode && initialRoomCode.trim()) {
      setRoomCode(initialRoomCode.trim().toUpperCase());
    }
  }, [initialRoomCode]);

  // Check room session validity with automatic retry for smooth QR scan discovery
  const checkSession = (codeToCheck: string, retryCount = 0) => {
    const cleanCode = codeToCheck.trim().toUpperCase();
    if (cleanCode.length >= 4 && cleanCode.length <= 6) {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        if (retryCount === 0 && !sessionData) setFetchingSession(true);
        if (retryCount === 0) setFetchError(null);
        fetch(`/api/session/${encodeURIComponent(cleanCode)}`, { cache: 'no-store' })
          .then(async res => {
            if (!res.ok) {
              if (retryCount < 2) {
                await new Promise(r => setTimeout(r, 600));
                return checkSession(codeToCheck, retryCount + 1);
              }
              throw new Error('Không tìm thấy phòng chơi này.');
            }
            return res.json();
          })
          .then(data => {
            if (data && data.session) {
              setSessionData(data.session);
              setFetchingSession(false);
              setFetchError(null);
            }
          })
          .catch(err => {
            if (retryCount >= 2) {
              setFetchError(err.message || 'Lỗi kết nối phòng');
              setSessionData(null);
            }
            setFetchingSession(false);
          });
      } else {
        // In Serverless mode (Cloudflare / remote production):
        // Query room info directly via realtime channel watchRoom / sync_request
        realtime.watchRoom(cleanCode, deviceId);
      }
    } else {
      setSessionData(null);
      setFetchError(null);
    }
  };

  // Real-time synchronization: subscribe to room WebSocket events & poll fallback
  useEffect(() => {
    const cleanCode = roomCode.trim().toUpperCase();
    if (cleanCode.length < 4 || cleanCode.length > 6) {
      setSessionData(null);
      return;
    }

    // 1. Initial check
    checkSession(cleanCode);

    // 2. Register socket as watcher in this room so server broadcasts live team additions
    realtime.watchRoom(cleanCode, deviceId);

    // 3. Listen to live WebSocket events
    const unsubTeamsUpdated = realtime.on('teams_updated', (data: any) => {
      if (data && data.roomCode === cleanCode && data.teams) {
        setSessionData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            teams: data.teams,
          };
        });
      }
    });

    const unsubTeamJoined = realtime.on('team_joined', (data: any) => {
      if (data && data.teams) {
        setSessionData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            teams: data.teams,
          };
        });
      }
    });

    const unsubRoomSnapshot = realtime.on('room_snapshot', (data: any) => {
      if (data && data.session) {
        setSessionData(data.session);
        setFetchError(null);
      }
    });

    const unsubSessionUpdated = realtime.on('session_updated', (data: any) => {
      if (data && data.session && data.session.roomCode === cleanCode) {
        setSessionData(data.session);
      }
    });

    // 4. Fallback interval polling for local server only
    let pollInterval: any = null;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      pollInterval = setInterval(() => {
        fetch(`/api/session/${encodeURIComponent(cleanCode)}`, { cache: 'no-store' })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data?.session) {
              setSessionData(data.session);
            }
          })
          .catch(() => {});
      }, 1500);
    }

    return () => {
      unsubTeamsUpdated();
      unsubTeamJoined();
      unsubRoomSnapshot();
      unsubSessionUpdated();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [roomCode, deviceId]);

  // Always provide the 8 default preschool team presets
  const availablePresets = TEAM_PRESETS;

  // Auto preselect team from URL query param if present
  useEffect(() => {
    if (typeof window !== 'undefined' && !selectedTeamId) {
      const urlParams = new URLSearchParams(window.location.search);
      const teamParam = urlParams.get('team');
      if (teamParam && availablePresets.some(p => p.id === teamParam)) {
        setSelectedTeamId(teamParam);
        const preset = availablePresets.find(p => p.id === teamParam);
        if (preset) setCustomTeamName(preset.name);
      }
    }
  }, [availablePresets, selectedTeamId]);

  // Auto-deselect team ONLY if another device is actively ONLINE with it
  useEffect(() => {
    if (selectedTeamId && sessionData?.teams?.[selectedTeamId]) {
      const team = sessionData.teams[selectedTeamId];
      // Only deselect if another device is active/online on it
      if (team.online && team.deviceId !== deviceId) {
        setSelectedTeamId('');
      }
    }
  }, [sessionData?.teams, selectedTeamId, deviceId]);

  const handleSelectTeam = (teamId: string) => {
    sounds.playClick();
    setSelectedTeamId(teamId);
    const existing = sessionData?.teams?.[teamId];
    if (existing?.teamName) {
      setCustomTeamName(existing.teamName);
    } else {
      const preset = availablePresets.find(p => p.id === teamId);
      if (preset) {
        setCustomTeamName(preset.name);
      }
    }
  };

  const handleRetryCheck = () => {
    sounds.playClick();
    checkSession(roomCode);
  };

  const handleConfirmJoin = () => {
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode || !selectedTeamId) return;
    unlockSpeechAudio();
    sounds.playCorrect();
    onJoin(cleanCode, selectedTeamId, deviceId, customTeamName.trim());
  };

  const handleExit = () => {
    sounds.playClick();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vuihoc_player_room');
      localStorage.removeItem('vuihoc_player_team_id');
      window.history.replaceState({}, '', '/');
    }
    if (onExit) {
      onExit();
    }
  };

  const selectedPreset = availablePresets.find(p => p.id === selectedTeamId);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-start py-2 sm:py-5 md:py-6 px-2.5 sm:px-5 md:px-6 pb-28 sm:pb-8">
      <div className="w-full max-w-lg md:max-w-4xl lg:max-w-5xl bg-white rounded-3xl p-3.5 sm:p-6 md:p-7 border-2 border-amber-100 shadow-xl sm:shadow-2xl relative transition-all">
        {/* Responsive Grid: 1 column on mobile, 2 columns on tablet/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-7 items-stretch">
          {/* Left Column: Header, Code input, Session preview & Desktop Actions */}
          <div className="md:col-span-5 flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-2.5 sm:gap-4">
              {/* Playful Header */}
              <div className="flex items-center gap-2.5 sm:gap-4 pb-2.5 md:pb-0 border-b md:border-b-0 border-slate-100">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-400 text-white flex items-center justify-center text-xl sm:text-3xl shadow-md shrink-0">
                  🎈
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    THAM GIA PHÒNG
                  </h2>
                  <p className="text-[11px] sm:text-sm font-bold text-slate-500 mt-0.5">
                    Bé hãy chọn đội để vào chơi cùng cô nhé!
                  </p>
                </div>
              </div>

              {/* Error Alert */}
              {(error || fetchError) && (
                <div className="p-2.5 sm:p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-700 text-xs sm:text-sm font-extrabold flex items-center justify-between gap-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span className="truncate">{error || fetchError}</span>
                  </div>
                  {fetchError && (
                    <button
                      type="button"
                      onClick={handleRetryCheck}
                      className="px-2.5 py-1 bg-white hover:bg-rose-100 text-rose-700 text-xs font-black rounded-xl border border-rose-200 shadow-2xs transition active:scale-95 shrink-0"
                    >
                      Thử lại
                    </button>
                  )}
                </div>
              )}

              {/* Room Code & Info Card (Compact on mobile) */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-2.5 sm:p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] sm:text-xs font-black uppercase text-slate-500 shrink-0">MÃ PHÒNG:</span>
                    <span className="font-mono font-black text-base sm:text-2xl text-slate-900 tracking-wider sm:tracking-widest">
                      {roomCode || '---'}
                    </span>
                    {sessionData && (
                      <span className="text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg truncate max-w-[120px] sm:max-w-[180px]">
                        {sessionData.game.title}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEditingCode(!isEditingCode)}
                    className="text-[10px] sm:text-xs font-extrabold text-amber-700 hover:text-amber-900 underline shrink-0 cursor-pointer"
                  >
                    {isEditingCode ? 'Thu gọn' : (roomCode ? 'Đổi mã' : 'Nhập mã')}
                  </button>
                </div>

                {/* Expanded Input if changing code or when empty */}
                {(!roomCode || isEditingCode) && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 animate-in fade-in">
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={roomCode}
                        onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && roomCode && selectedTeamId) {
                            handleConfirmJoin();
                          }
                        }}
                        placeholder="VD: 1547"
                        className="w-full py-2 px-3 text-center font-mono font-black text-xl sm:text-2xl tracking-widest text-slate-900 bg-white rounded-xl border-2 border-slate-300 focus:border-amber-400 outline-none uppercase shadow-inner"
                      />
                      {fetchingSession && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 animate-spin">
                          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop / Tablet Action Buttons (visible on md+) */}
            <div className="hidden md:flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmJoin}
                disabled={!roomCode || !selectedTeamId || isLoading}
                className={`w-full py-3.5 sm:py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
                  roomCode && selectedTeamId && !isLoading
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white cursor-pointer shadow-amber-200/60'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span>Đang kết nối...</span>
                ) : Boolean(selectedTeamId && sessionData?.teams?.[selectedTeamId] && sessionData.teams[selectedTeamId].online === false) ? (
                  <>
                    <RotateCcw className="w-5 h-5 text-amber-200" />
                    <span>VÀO LẠI ĐỘI ĐỂ CHƠI TIẾP</span>
                  </>
                ) : (
                  <>
                    <span>VÀO PHÒNG CHƠI</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExit}
                className="w-full py-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-extrabold text-xs border border-slate-200 hover:border-rose-200 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Home className="w-3.5 h-3.5 text-rose-500" />
                <span>Thoát ra trang chủ</span>
              </button>
            </div>
          </div>

          {/* Right Column: Team Selection and Team Name Customization */}
          <div className="md:col-span-7 flex flex-col gap-2.5 sm:gap-3.5">
            {/* Live game status notice */}
            {sessionData?.status === 'playing' && (
              <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-950 text-xs font-bold flex items-center gap-2 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                <span>
                  {Boolean(sessionData?.teams && Object.values(sessionData.teams).some(t => t.online === false))
                    ? 'Trò chơi đang diễn ra! Đội bị văng có thể chọn lại ô màu cam để vào chơi tiếp ngay.'
                    : 'Trò chơi đang diễn ra! Bé chọn đội để tham gia làm bài cùng cả lớp nhé.'}
                </span>
              </div>
            )}

            {/* Team Selection Header */}
            <div className="flex items-center justify-between">
              <label className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                <span>BÉ THUỘC ĐỘI NÀO?</span>
              </label>
              <span className={`text-[10px] sm:text-[11px] font-extrabold ${selectedTeamId ? 'text-emerald-600' : 'text-slate-400'}`}>
                {selectedTeamId ? '✓ Đã chọn đội' : 'Chạm 1 đội để chọn'}
              </span>
            </div>

            {/* Presets Grid: 3 cols on mobile, 3 cols on tablet, 4 cols on large screens */}
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2.5">
              {availablePresets.map((preset) => {
                const isSelected = selectedTeamId === preset.id;
                const existingTeam = sessionData?.teams?.[preset.id];
                const isOnline = Boolean(existingTeam && existingTeam.online !== false);
                const isOffline = Boolean(existingTeam && existingTeam.online === false);
                const isTakenByMe = Boolean(existingTeam && existingTeam.deviceId === deviceId);

                // Team is locked ONLY when another device is currently active/online
                const isLocked = Boolean(existingTeam && isOnline && !isTakenByMe);

                // Team is offline/dropped out ("bị văng") and can be re-joined
                const isDisconnected = Boolean(existingTeam && isOffline);

                // If game is in progress and there are disconnected teams, prioritize recovering them
                const isGamePlaying = sessionData?.status === 'playing';
                const hasDisconnectedTeams = Boolean(
                  sessionData?.teams && Object.values(sessionData.teams).some(t => t.online === false)
                );
                const isUnjoinedTeam = !existingTeam;
                const isBlockedByPriority = isGamePlaying && hasDisconnectedTeams && isUnjoinedTeam;
                const isDisabled = isLocked || isBlockedByPriority;

                return (
                  <button
                    key={preset.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelectTeam(preset.id)}
                    className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border-2 transition-all relative flex flex-col items-center justify-center text-center ${
                      isDisabled
                        ? 'bg-slate-100/90 border-slate-300 opacity-60 cursor-not-allowed select-none'
                        : isSelected
                        ? isDisconnected
                          ? 'border-amber-500 bg-amber-50 shadow-md ring-2 ring-amber-400 scale-[1.02] z-10'
                          : 'border-indigo-600 bg-indigo-50 shadow-md ring-2 ring-indigo-400 scale-[1.02] z-10'
                        : isDisconnected
                        ? 'border-amber-300 bg-amber-50/70 hover:border-amber-400 hover:bg-amber-100/80 cursor-pointer active:scale-95 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-pointer active:scale-95'
                    }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${preset.bgColor} text-white flex items-center justify-center text-lg sm:text-xl shadow-xs mb-1 shrink-0 relative`}>
                      {preset.icon}
                      {isLocked && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] shadow-xs border border-white">
                          <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                        </span>
                      )}
                      {isDisconnected && !isSelected && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[9px] shadow-xs border border-white">
                          <RotateCcw className="w-2.5 h-2.5 stroke-[2.5]" />
                        </span>
                      )}
                    </div>
                    <div className="min-h-[1.5rem] sm:min-h-[2rem] flex items-center justify-center w-full px-0.5">
                      <h5 className="font-extrabold text-[10px] sm:text-xs text-slate-800 leading-tight line-clamp-2 break-words text-center">
                        {existingTeam?.teamName || (isSelected && customTeamName.trim() ? customTeamName.trim() : preset.name)}
                      </h5>
                    </div>
                    {isLocked ? (
                      <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200 mt-0.5 truncate max-w-full flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5 shrink-0" />
                        <span>Đang online</span>
                      </span>
                    ) : isDisconnected ? (
                      <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md border border-amber-300 mt-0.5 truncate max-w-full flex items-center gap-0.5 animate-pulse">
                        <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                        <span>Bị văng · Vào lại</span>
                      </span>
                    ) : isBlockedByPriority ? (
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5 truncate max-w-full">
                        Ưu tiên đội văng
                      </span>
                    ) : isTakenByMe ? (
                      <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 mt-0.5 truncate max-w-full">
                        🟢 Đội của bé
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Team Name Customization Section - Compact & Collapsible */}
            {selectedTeamId && (
              <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50/80 border-2 border-amber-200/80 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{selectedPreset?.icon || '⭐'}</span>
                    <div className="min-w-0">
                      <span className="text-[9px] font-black uppercase text-amber-900 block leading-none">Đội đã chọn</span>
                      <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
                        {customTeamName.trim() || selectedPreset?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {selectedPreset && customTeamName.trim() && customTeamName.trim() !== selectedPreset.name && (
                      <button
                        type="button"
                        onClick={() => setCustomTeamName(selectedPreset.name)}
                        className="text-[10px] font-extrabold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 cursor-pointer"
                        title="Đặt lại tên mặc định"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">Mặc định</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEditingTeamName(!isEditingTeamName)}
                      className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-900 text-[10px] font-black rounded-lg border border-amber-300 shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3 text-amber-600" />
                      <span>{isEditingTeamName ? 'Đóng' : 'Đổi tên'}</span>
                    </button>
                  </div>
                </div>

                {/* Collapsible Edit Box */}
                {isEditingTeamName && (
                  <div className="mt-2 pt-2 border-t border-amber-200 animate-in fade-in">
                    <div className="relative">
                      <input
                        type="text"
                        maxLength={30}
                        value={customTeamName}
                        onChange={(e) => setCustomTeamName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && roomCode && selectedTeamId) {
                            handleConfirmJoin();
                          }
                        }}
                        placeholder={`VD: ${selectedPreset?.name || 'máy 1'}, Lớp Mầm 1...`}
                        className="w-full py-1.5 pl-3 pr-8 text-xs sm:text-sm font-extrabold text-slate-900 bg-white rounded-xl border border-amber-300 focus:border-indigo-500 outline-none transition shadow-inner"
                      />
                      {customTeamName && (
                        <button
                          type="button"
                          onClick={() => setCustomTeamName('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                          title="Xóa trắng tên"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Quick Suggestions */}
                    <div className="mt-2 pt-1 border-t border-amber-200/60">
                      <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider block mb-1">
                        Gợi ý tên nhanh:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_TEAM_SUGGESTIONS.slice(0, 8).map((sugg) => (
                          <button
                            key={sugg}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setCustomTeamName(sugg);
                            }}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition active:scale-95 cursor-pointer ${
                              customTeamName === sugg
                                ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                                : 'bg-white hover:bg-amber-100 text-amber-900 border-amber-300'
                            }`}
                          >
                            {sugg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile In-Page Action Buttons (visible only on small screens < md) */}
            <div className="flex md:hidden flex-col gap-2 mt-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleConfirmJoin}
                disabled={!roomCode || !selectedTeamId || isLoading}
                className={`w-full py-3.5 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md transition active:scale-95 ${
                  roomCode && selectedTeamId && !isLoading
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white cursor-pointer shadow-amber-200/60 ring-2 ring-amber-300'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span>Đang kết nối...</span>
                ) : Boolean(selectedTeamId && sessionData?.teams?.[selectedTeamId] && sessionData.teams[selectedTeamId].online === false) ? (
                  <>
                    <RotateCcw className="w-4 h-4 text-amber-200" />
                    <span>VÀO LẠI ĐỘI ĐỂ CHƠI TIẾP</span>
                  </>
                ) : (
                  <>
                    <span>VÀO PHÒNG CHƠI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExit}
                className="w-full py-2.5 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 font-extrabold text-xs border border-slate-200 hover:border-rose-200 transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Home className="w-3.5 h-3.5 text-rose-500" />
                <span>Thoát ra trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Quick Join Bar for Mobile (always easily accessible without scrolling) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-md border-t-2 border-amber-300 shadow-[0_-8px_25px_rgba(0,0,0,0.12)] flex md:hidden items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider leading-none mb-0.5">
            {selectedPreset ? 'Đã chọn đội' : 'Chưa chọn đội'}
          </span>
          <div className="flex items-center gap-1.5 truncate">
            {selectedPreset && (
              <span className="text-base shrink-0 leading-none">{selectedPreset.icon}</span>
            )}
            <span className={`font-black text-xs sm:text-sm truncate ${selectedPreset ? 'text-indigo-900' : 'text-slate-500 italic'}`}>
              {selectedTeamId ? (customTeamName.trim() || selectedPreset?.name) : 'Bé chạm chọn 1 máy/đội'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleConfirmJoin}
          disabled={!roomCode || !selectedTeamId || isLoading}
          className={`px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0 ${
            roomCode && selectedTeamId && !isLoading
              ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white cursor-pointer shadow-amber-200/60 ring-2 ring-amber-300'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <span>Đang vào...</span>
          ) : Boolean(selectedTeamId && sessionData?.teams?.[selectedTeamId] && sessionData.teams[selectedTeamId].online === false) ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>VÀO LẠI ĐỘI</span>
            </>
          ) : (
            <>
              <span>VÀO PHÒNG</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
