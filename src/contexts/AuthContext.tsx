import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types';
import { isValidUUID, getUserIdFromStorage } from '@/utils/uuid';

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('获取用户信息时发生网络错误:', error);
    return null;
  }
}

interface UserInfo {
  userId: string;
  username: string;
  displayName: string;
}

function getStoredUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem('user_info');
    if (!raw) return null;

    const parsed = JSON.parse(raw) as UserInfo;
    if (!parsed.userId || parsed.userId === '0' || !isValidUUID(parsed.userId)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

interface AuthContextType {
  user: { id: string } | null;
  userInfo: UserInfo | null;
  profile: Profile | null;
  loading: boolean;
  login: (userId: string, username: string, displayName: string) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    console.log('[AuthContext] 刷新用户信息，userId:', user.id);
    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    console.log('[AuthContext] 初始化...');
    const storedUser = getStoredUser();

    if (storedUser) {
      console.log('[AuthContext] 找到已登录用户:', storedUser.userId);
      setUser({ id: storedUser.userId });
      setUserInfo(storedUser);
      getProfile(storedUser.userId).then(setProfile);
    }

    setLoading(false);
    console.log('[AuthContext] 初始化完成');
  }, []);

  const login = (userId: string, username: string, displayName: string) => {
    const info: UserInfo = { userId, username, displayName };
    localStorage.setItem('user_info', JSON.stringify(info));
    setUser({ id: userId });
    setUserInfo(info);
    getProfile(userId).then(setProfile);
  };

  const logout = async () => {
    localStorage.removeItem('user_info');
    setUser(null);
    setUserInfo(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userInfo,
        profile,
        loading,
        login,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}