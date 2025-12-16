import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { IUser } from '../shared/types';
import { tokenPrefix } from '../shared/globals';
import { useNavigate } from 'react-router';

interface AuthContextType {
  isAuthenticated: boolean;
  user: IUser | null;
  token: string;
  loading: boolean;
  logout: () => void;
  login: (newToken: string, newUser: IUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [user, setUser] = useState<IUser | null>(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(tokenPrefix);
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: IUser) => {
    localStorage.setItem(tokenPrefix, newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);
    setIsAuthenticated(true);
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem(tokenPrefix);
    localStorage.removeItem('user');

    setToken('');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/');
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    logout,
    login,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
