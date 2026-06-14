import { create } from 'zustand';
import type { Alarm, EmergencyAction } from '../types';
import { mockAlarms } from '../services/mock/equipment';
import { generateId } from '../utils/algorithms';

interface AlarmState {
  alarms: Alarm[];
  
  addAlarm: (alarm: Omit<Alarm, 'id' | 'timestamp' | 'acknowledged'>) => Alarm;
  acknowledgeAlarm: (alarmId: string) => void;
  acknowledgeAll: () => void;
  removeAlarm: (alarmId: string) => void;
  getUnacknowledgedCount: () => number;
  addEmergencyAction: (alarmId: string, action: Omit<EmergencyAction, 'id' | 'timestamp'>) => void;
}

export const useAlarmStore = create<AlarmState>((set, get) => ({
  alarms: mockAlarms,
  
  addAlarm: (alarm) => {
    const newAlarm: Alarm = {
      ...alarm,
      id: generateId(),
      timestamp: Date.now(),
      acknowledged: false,
      emergencyActions: [],
    };
    set(state => ({
      alarms: [newAlarm, ...state.alarms],
    }));
    return newAlarm;
  },
  
  acknowledgeAlarm: (alarmId) => {
    set(state => ({
      alarms: state.alarms.map(a => 
        a.id === alarmId ? { ...a, acknowledged: true } : a
      ),
    }));
  },
  
  acknowledgeAll: () => {
    set(state => ({
      alarms: state.alarms.map(a => ({ ...a, acknowledged: true })),
    }));
  },
  
  removeAlarm: (alarmId) => {
    set(state => ({
      alarms: state.alarms.filter(a => a.id !== alarmId),
    }));
  },
  
  getUnacknowledgedCount: () => {
    return get().alarms.filter(a => !a.acknowledged).length;
  },
  
  addEmergencyAction: (alarmId, action) => {
    const newAction: EmergencyAction = {
      ...action,
      id: generateId(),
      timestamp: Date.now(),
    };
    set(state => ({
      alarms: state.alarms.map(a => 
        a.id === alarmId 
          ? { ...a, emergencyActions: [...(a.emergencyActions || []), newAction] }
          : a
      ),
    }));
  },
}));
