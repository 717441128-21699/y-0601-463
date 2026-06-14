import { create } from 'zustand';
import type { User, UserRole, OperationLog } from '../types';
import { generateId } from '../utils/algorithms';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isFaceScanning: boolean;
  operationLogs: OperationLog[];
  
  startFaceScan: () => void;
  login: (role: UserRole) => Promise<boolean>;
  logout: () => void;
  addOperationLog: (action: string, detail: string) => void;
}

const mockUsers: Record<UserRole, User> = {
  operator: {
    id: 'user-001',
    name: '张值班',
    role: 'operator',
    lastLogin: Date.now() - 86400000,
  },
  supervisor: {
    id: 'user-002',
    name: '李班长',
    role: 'supervisor',
    lastLogin: Date.now() - 172800000,
  },
  manager: {
    id: 'user-003',
    name: '王厂长',
    role: 'manager',
    lastLogin: Date.now() - 259200000,
  },
};

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isFaceScanning: false,
  operationLogs: [],
  
  startFaceScan: () => {
    set({ isFaceScanning: true });
  },
  
  login: async (role: UserRole) => {
    set({ isFaceScanning: true });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const user = mockUsers[role];
    if (user) {
      const updatedUser = { ...user, lastLogin: Date.now() };
      set({
        currentUser: updatedUser,
        isAuthenticated: true,
        isFaceScanning: false,
      });
      
      get().addOperationLog('用户登录', `以${role === 'operator' ? '值班员' : role === 'supervisor' ? '班长' : '厂长'}身份登录系统`);
      return true;
    }
    
    set({ isFaceScanning: false });
    return false;
  },
  
  logout: () => {
    const user = get().currentUser;
    if (user) {
      get().addOperationLog('用户登出', `${user.name} 退出系统`);
    }
    set({
      currentUser: null,
      isAuthenticated: false,
    });
  },
  
  addOperationLog: (action: string, detail: string) => {
    const user = get().currentUser;
    if (!user) return;
    
    const log: OperationLog = {
      id: generateId(),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      detail,
      timestamp: Date.now(),
    };
    
    set(state => ({
      operationLogs: [log, ...state.operationLogs].slice(0, 100),
    }));
  },
}));
