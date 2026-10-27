import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { UserProfile, UserRole, UserQuota } from '../types/game';

const USERS_STORAGE_KEY = 'vuihoc_registered_users_v2';
const CURRENT_USER_KEY = 'vuihoc_current_user_v2';

export const OWNER_ADMIN_EMAIL = 'tranthangit2025@gmail.com';

export const ROLE_QUOTAS: Record<UserRole, UserQuota> = {
  admin: {
    maxQuestionsPerGame: Infinity,
    maxActiveRooms: Infinity,
    canExportAdvancedReport: true,
    hasVipBadge: true,
  },
  teacher_premium: {
    maxQuestionsPerGame: Infinity,
    maxActiveRooms: Infinity,
    canExportAdvancedReport: true,
    hasVipBadge: true,
  },
  teacher_member: {
    maxQuestionsPerGame: 20,
    maxActiveRooms: 2,
    canExportAdvancedReport: false,
    hasVipBadge: false,
  },
  student: {
    maxQuestionsPerGame: 0,
    maxActiveRooms: 0,
    canExportAdvancedReport: false,
    hasVipBadge: false,
  },
};

export const INITIAL_PRESET_USERS: UserProfile[] = [
  {
    id: 'user_admin_owner',
    email: OWNER_ADMIN_EMAIL,
    fullName: 'Trần Thắng (Tổng Quản Trị)',
    schoolName: 'Hệ thống Vui Học Cùng Cô',
    role: 'admin',
    status: 'active',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    lastLoginAt: Date.now(),
    createdGamesCount: 15,
  },
  {
    id: 'user_admin_default',
    email: 'admin@vuihoccungco.vn',
    fullName: 'Quản Trị Viên Hệ Thống',
    schoolName: 'Ban Quản Trị Website',
    role: 'admin',
    status: 'active',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    lastLoginAt: Date.now() - 1000 * 60 * 60 * 2,
    createdGamesCount: 8,
  },
  {
    id: 'user_teacher_vip',
    email: 'premium@vuihoccungco.vn',
    fullName: 'Cô Hoàng Anh (Giáo Viên VIP)',
    schoolName: 'Trường MN Quốc Tế Ánh Dương',
    role: 'teacher_premium',
    status: 'active',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    lastLoginAt: Date.now() - 1000 * 60 * 60 * 5,
    createdGamesCount: 12,
  },
  {
    id: 'user_teacher_member',
    email: 'giaovien@vuihoccungco.vn',
    fullName: 'Cô Mai Linh (Giáo Viên Member)',
    schoolName: 'Trường Mầm Non Hoa Sen',
    role: 'teacher_member',
    status: 'active',
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    lastLoginAt: Date.now() - 1000 * 60 * 60 * 12,
    createdGamesCount: 4,
  },
];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  currentUser: UserProfile | null;
  role: UserRole;
  quota: UserQuota;
  isAdmin: boolean;
  isPremium: boolean;
  isMember: boolean;
  isStudent: boolean;
  registeredUsers: UserProfile[];
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; profile?: UserProfile }>;
  signUp: (email: string, password: string, fullName?: string, schoolName?: string) => Promise<{ error: Error | null; profile?: UserProfile }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<{ success: boolean; error?: string }>;
  toggleUserStatus: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: { fullName: string; schoolName?: string; email?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  quickSwitchAccount: (targetRole: UserRole) => void;
  incrementUserGamesCount: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  currentUser: null,
  role: 'student',
  quota: ROLE_QUOTAS.student,
  isAdmin: false,
  isPremium: false,
  isMember: false,
  isStudent: true,
  registeredUsers: [],
  loading: false,
  isConfigured: false,
  signIn: async () => ({ error: new Error('Chưa khởi tạo') }),
  signUp: async () => ({ error: new Error('Chưa khởi tạo') }),
  signOut: async () => {},
  resetPassword: async () => ({ error: new Error('Chưa khởi tạo') }),
  updateUserRole: async () => ({ success: false, error: 'Chưa khởi tạo' }),
  toggleUserStatus: async () => ({ success: false, error: 'Chưa khởi tạo' }),
  updateProfile: async () => ({ success: false, error: 'Chưa khởi tạo' }),
  changePassword: async () => ({ success: false, error: 'Chưa khởi tạo' }),
  quickSwitchAccount: () => {},
  incrementUserGamesCount: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge preset users if missing
          const existingEmails = new Set(parsed.map(u => u.email.toLowerCase()));
          const missingPresets = INITIAL_PRESET_USERS.filter(p => !existingEmails.has(p.email.toLowerCase()));
          return [...parsed, ...missingPresets];
        }
      }
    } catch (e) {
      console.warn('[Auth] Failed to load registered users from storage:', e);
    }
    return INITIAL_PRESET_USERS;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const configured = isSupabaseConfigured();

  // Save registered users list whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(registeredUsers));
    } catch (e) {
      console.warn('[Auth] Failed to persist registered users:', e);
    }
  }, [registeredUsers]);

  // Restore active user session from localStorage
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        const parsed: UserProfile = JSON.parse(savedUser);
        // Refresh with latest role from registeredUsers if present
        const found = registeredUsers.find(u => u.id === parsed.id || u.email.toLowerCase() === parsed.email.toLowerCase());
        if (found) {
          setCurrentUser(found);
        } else {
          setCurrentUser(parsed);
        }
      }
    } catch (e) {
      console.warn('[Auth] Error restoring current user:', e);
    }
  }, [registeredUsers]);

  // Save current user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.warn('[Auth] Error saving current user:', e);
    }
  }, [currentUser]);

  // Supabase Auth Listener (if configured)
  useEffect(() => {
    if (!supabase || !configured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        const email = session.user.email.toLowerCase();
        // Link with local profile
        setRegisteredUsers(prev => {
          let matched = prev.find(u => u.email.toLowerCase() === email);
          if (!matched) {
            const isOwner = email === OWNER_ADMIN_EMAIL.toLowerCase();
            matched = {
              id: session.user.id,
              email: session.user.email!,
              fullName: session.user.user_metadata?.full_name || 'Cô giáo',
              schoolName: session.user.user_metadata?.school_name || 'Trường Mầm Non',
              role: isOwner ? 'admin' : 'teacher_member',
              status: 'active',
              createdAt: Date.now(),
              lastLoginAt: Date.now(),
              createdGamesCount: 0,
            };
            return [...prev, matched];
          }
          return prev;
        });
      }
      setLoading(false);
    }).catch((err) => {
      console.warn('[Auth] Failed to get session:', err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [configured]);

  // Determine current active role
  const role: UserRole = useMemo(() => {
    if (!currentUser) return 'student';
    if (currentUser.email.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase()) return 'admin';
    return currentUser.role || 'teacher_member';
  }, [currentUser]);

  const quota: UserQuota = useMemo(() => {
    return ROLE_QUOTAS[role] || ROLE_QUOTAS.student;
  }, [role]);

  const isAdmin = role === 'admin';
  const isPremium = role === 'teacher_premium';
  const isMember = role === 'teacher_member';
  const isStudent = !currentUser || role === 'student';

  // Sign In function (works both local and cloud)
  const signIn = async (email: string, password: string): Promise<{ error: Error | null; profile?: UserProfile }> => {
    const trimmedEmail = email.trim().toLowerCase();

    // 1. If Supabase configured, attempt Supabase Auth
    if (supabase && configured) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          // If Supabase fails, check local accounts fallback
          console.warn('[Auth] Supabase login failed, checking local accounts:', error.message);
        } else if (data.user) {
          const isOwner = trimmedEmail === OWNER_ADMIN_EMAIL.toLowerCase();
          let profile = registeredUsers.find(u => u.email.toLowerCase() === trimmedEmail);
          if (!profile) {
            profile = {
              id: data.user.id,
              email: trimmedEmail,
              fullName: data.user.user_metadata?.full_name || 'Cô giáo',
              schoolName: data.user.user_metadata?.school_name || '',
              role: isOwner ? 'admin' : 'teacher_member',
              status: 'active',
              createdAt: Date.now(),
              lastLoginAt: Date.now(),
              createdGamesCount: 0,
            };
            setRegisteredUsers(prev => [...prev, profile!]);
          } else {
            profile = { ...profile, lastLoginAt: Date.now(), role: isOwner ? 'admin' : profile.role };
            setRegisteredUsers(prev => prev.map(u => u.id === profile!.id ? profile! : u));
          }
          setCurrentUser(profile);
          return { error: null, profile };
        }
      } catch (err: any) {
        console.warn('[Auth] Supabase exception, checking local fallback:', err);
      }
    }

    // 2. Local Authentication Engine
    const isOwner = trimmedEmail === OWNER_ADMIN_EMAIL.toLowerCase();
    let existing = registeredUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    if (existing) {
      if (existing.status === 'suspended') {
        return { error: new Error('Tài khoản này hiện đang bị tạm khóa bởi Quản trị viên.') };
      }
      // Password check: In local demo mode, any password >= 6 chars or matching preset is accepted
      if (password.length < 6) {
        return { error: new Error('Mật khẩu tối thiểu 6 ký tự.') };
      }

      // Auto ensure owner email is admin
      const effectiveRole: UserRole = isOwner ? 'admin' : existing.role;
      const updatedProfile: UserProfile = {
        ...existing,
        role: effectiveRole,
        lastLoginAt: Date.now(),
      };

      setRegisteredUsers(prev => prev.map(u => u.id === updatedProfile.id ? updatedProfile : u));
      setCurrentUser(updatedProfile);
      return { error: null, profile: updatedProfile };
    }

    // If account not found, but it is owner email: auto-create as admin!
    if (isOwner) {
      const newAdmin: UserProfile = {
        id: 'user_admin_' + Date.now(),
        email: trimmedEmail,
        fullName: 'Trần Thắng (Tổng Quản Trị)',
        schoolName: 'Hệ Thống Vui Học Cùng Cô',
        role: 'admin',
        status: 'active',
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        createdGamesCount: 0,
      };
      setRegisteredUsers(prev => [newAdmin, ...prev]);
      setCurrentUser(newAdmin);
      return { error: null, profile: newAdmin };
    }

    return { error: new Error('Không tìm thấy tài khoản với email này. Vui lòng bấm Đăng ký!') };
  };

  // Sign Up function (works both local and cloud)
  const signUp = async (
    email: string,
    password: string,
    fullName?: string,
    schoolName?: string
  ): Promise<{ error: Error | null; profile?: UserProfile }> => {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) return { error: new Error('Email không được để trống.') };
    if (!password || password.length < 6) return { error: new Error('Mật khẩu tối thiểu 6 ký tự.') };

    const isOwner = trimmedEmail === OWNER_ADMIN_EMAIL.toLowerCase();
    const existing = registeredUsers.find(u => u.email.toLowerCase() === trimmedEmail);

    if (existing) {
      return { error: new Error('Email này đã được đăng ký trong hệ thống. Vui lòng chuyển sang Đăng nhập!') };
    }

    const assignedRole: UserRole = isOwner ? 'admin' : 'teacher_member';
    const newProfile: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: trimmedEmail,
      fullName: fullName?.trim() || (isOwner ? 'Trần Thắng (Admin)' : 'Cô giáo Mầm non'),
      schoolName: schoolName?.trim() || 'Trường Mầm Non',
      role: assignedRole,
      status: 'active',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      createdGamesCount: 0,
    };

    // Try Supabase Auth if available
    if (supabase && configured) {
      try {
        await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: newProfile.fullName,
              school_name: newProfile.schoolName,
              role: assignedRole,
            },
          },
        });
      } catch (err) {
        console.warn('[Auth] Supabase remote signup warning (proceeding local):', err);
      }
    }

    setRegisteredUsers(prev => [newProfile, ...prev]);
    setCurrentUser(newProfile);
    return { error: null, profile: newProfile };
  };

  // Sign Out
  const signOut = async () => {
    if (supabase && configured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Auth] Supabase signOut error:', err);
      }
    }
    setUser(null);
    setSession(null);
    setCurrentUser(null);
    try {
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch {}
  };

  // Reset password
  const resetPassword = async (email: string): Promise<{ error: Error | null }> => {
    if (supabase && configured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        return { error: error ? new Error(error.message) : null };
      } catch (err: any) {
        return { error: err };
      }
    }
    // Local mock password reset
    const found = registeredUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      return { error: new Error('Không tìm thấy tài khoản với email này trong hệ thống.') };
    }
    return { error: null };
  };

  // Admin action: update teacher role
  const updateUserRole = async (userId: string, newRole: UserRole): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Chỉ Quản trị viên (Admin) mới có quyền thay đổi phân quyền.' };
    }
    const targetUser = registeredUsers.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'Không tìm thấy người dùng.' };
    }
    if (targetUser.email.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase() && newRole !== 'admin') {
      return { success: false, error: 'Không thể hạ quyền tài khoản Tổng Quản Trị tối cao.' };
    }

    const updated = { ...targetUser, role: newRole };
    setRegisteredUsers(prev => prev.map(u => u.id === userId ? updated : u));
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }
    return { success: true };
  };

  // Admin action: toggle user suspended/active status
  const toggleUserStatus = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!isAdmin) {
      return { success: false, error: 'Chỉ Quản trị viên mới có quyền khóa/mở tài khoản.' };
    }
    const targetUser = registeredUsers.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'Không tìm thấy người dùng.' };
    }
    if (targetUser.email.toLowerCase() === OWNER_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, error: 'Không thể khóa tài khoản Tổng Quản Trị.' };
    }

    const nextStatus: 'active' | 'suspended' = targetUser.status === 'active' ? 'suspended' : 'active';
    const updated: UserProfile = { ...targetUser, status: nextStatus };
    setRegisteredUsers(prev => prev.map(u => u.id === userId ? updated : u));
    if (currentUser?.id === userId) {
      setCurrentUser(updated);
    }
    return { success: true };
  };

  // Quick switch account for seamless reviewer and teacher testing
  const quickSwitchAccount = useCallback((targetRole: UserRole) => {
    if (targetRole === 'student') {
      signOut();
      return;
    }

    const matched = registeredUsers.find(u => u.role === targetRole);
    if (matched) {
      setCurrentUser(matched);
    } else {
      // Find preset for this role
      const preset = INITIAL_PRESET_USERS.find(p => p.role === targetRole);
      if (preset) {
        setRegisteredUsers(prev => [preset, ...prev]);
        setCurrentUser(preset);
      }
    }
  }, [registeredUsers]);

  // Update member profile (fullName, schoolName, email)
  const updateProfile = useCallback(async (data: {
    fullName: string;
    schoolName?: string;
    email?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Chưa đăng nhập.' };
    }

    const trimmedName = data.fullName.trim();
    if (!trimmedName) {
      return { success: false, error: 'Họ và tên không được để trống.' };
    }

    const trimmedEmail = (data.email || currentUser.email).trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'Email không hợp lệ.' };
    }

    // If changing email, ensure it's not taken by another user
    if (trimmedEmail !== currentUser.email.toLowerCase()) {
      const isTaken = registeredUsers.some(
        u => u.id !== currentUser.id && u.email.toLowerCase() === trimmedEmail
      );
      if (isTaken) {
        return { success: false, error: 'Email này đã được sử dụng bởi tài khoản khác.' };
      }
    }

    const isOwner = trimmedEmail === OWNER_ADMIN_EMAIL.toLowerCase();
    const updatedUser: UserProfile = {
      ...currentUser,
      fullName: trimmedName,
      schoolName: data.schoolName?.trim() || '',
      email: trimmedEmail,
      role: isOwner ? 'admin' : currentUser.role,
    };

    setRegisteredUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    setCurrentUser(updatedUser);

    // If Supabase configured, update user metadata
    if (supabase && configured) {
      try {
        await supabase.auth.updateUser({
          email: trimmedEmail,
          data: {
            full_name: trimmedName,
            school_name: data.schoolName?.trim() || '',
          },
        });
      } catch (err: any) {
        console.warn('[Auth] Remote Supabase profile update error:', err);
      }
    }

    return { success: true };
  }, [currentUser, registeredUsers, configured]);

  // Change password
  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: 'Chưa đăng nhập.' };
    }
    if (!currentPassword) {
      return { success: false, error: 'Vui lòng nhập mật khẩu hiện tại.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' };
    }

    // Verify current password against stored passwords
    const PASSWORDS_KEY = 'vuihoc_user_passwords';
    let storedPasswords: Record<string, string> = {};
    try {
      const raw = localStorage.getItem(PASSWORDS_KEY);
      if (raw) storedPasswords = JSON.parse(raw);
    } catch {
      storedPasswords = {};
    }

    const userEmailKey = currentUser.email.toLowerCase();
    const expectedPassword = storedPasswords[userEmailKey] || '123456';

    // Allow if matches stored password or preset default '123456'
    if (currentPassword !== expectedPassword && currentPassword !== '123456') {
      return { success: false, error: 'Mật khẩu hiện tại không chính xác.' };
    }

    // Save new password
    storedPasswords[userEmailKey] = newPassword;
    try {
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(storedPasswords));
    } catch (err) {
      console.warn('Error saving password locally:', err);
    }

    // If Supabase is connected, update Supabase password
    if (supabase && configured) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          console.warn('[Auth] Supabase password update warning:', error.message);
        }
      } catch (err: any) {
        console.warn('[Auth] Supabase password update exception:', err);
      }
    }

    return { success: true };
  }, [currentUser, configured]);

  // Increment games count when user creates a game
  const incrementUserGamesCount = useCallback(() => {
    if (!currentUser) return;
    const updated: UserProfile = {
      ...currentUser,
      createdGamesCount: (currentUser.createdGamesCount || 0) + 1,
    };
    setCurrentUser(updated);
    setRegisteredUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
  }, [currentUser]);

  const contextValue = useMemo(() => ({
    user,
    session,
    currentUser,
    role,
    quota,
    isAdmin,
    isPremium,
    isMember,
    isStudent,
    registeredUsers,
    loading,
    isConfigured: configured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserRole,
    toggleUserStatus,
    updateProfile,
    changePassword,
    quickSwitchAccount,
    incrementUserGamesCount,
  }), [
    user,
    session,
    currentUser,
    role,
    quota,
    isAdmin,
    isPremium,
    isMember,
    isStudent,
    registeredUsers,
    loading,
    configured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserRole,
    toggleUserStatus,
    updateProfile,
    changePassword,
    quickSwitchAccount,
    incrementUserGamesCount,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
