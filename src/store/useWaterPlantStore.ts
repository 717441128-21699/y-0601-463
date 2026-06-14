import { create } from 'zustand';
import type { ProcessPool, FilterData, DosingData, PumpHouseData, WaterQualityData, ValveStatus } from '../types';
import { mockProcessPools, mockFilters } from '../services/mock/pools';
import { generate24HourHistory, mockDosingSystems, mockPumpHouseData } from '../services/mock/waterQuality';
import { calculateOptimalDosage, calculateBackwashPriority, optimizePumpOperation, checkWaterQuality, generateId } from '../utils/algorithms';
import { useAlarmStore } from './useAlarmStore';
import { useAuthStore } from './useAuthStore';

interface WaterPlantState {
  pools: ProcessPool[];
  filters: FilterData[];
  dosingSystems: DosingData[];
  pumpHouseData: PumpHouseData;
  historyData: Record<string, WaterQualityData[]>;
  selectedPoolId: string | null;
  isEmergencyMode: boolean;
  activeEmergencyPoolId: string | null;
  poolValveMap: Record<string, string>;
  backwashQueue: string[];
  isAutoBackwashEnabled: boolean;
  
  updatePoolData: (poolId: string, updates: Partial<ProcessPool>) => void;
  updateFilterData: (filterId: string, updates: Partial<FilterData>) => void;
  updateDosingData: (dosingId: string, updates: Partial<DosingData>) => void;
  updatePumpHouseData: (updates: Partial<PumpHouseData>) => void;
  setSelectedPool: (poolId: string | null) => void;
  getPoolHistory: (poolId: string) => WaterQualityData[];
  triggerEmergencyShutdown: (poolId: string) => void;
  recoverEmergencyPool: (poolId: string) => void;
  simulateTurbidityOverflow: (poolId: string) => void;
  simulateRealtimeUpdate: () => void;
  startBackwash: (filterId: string) => boolean;
  completeBackwash: (filterId: string) => void;
  addToBackwashQueue: (filterId: string) => void;
  removeFromBackwashQueue: (filterId: string) => void;
  processBackwashQueue: () => void;
  setAutoBackwashEnabled: (enabled: boolean) => void;
}

export const useWaterPlantStore = create<WaterPlantState>((set, get) => ({
  pools: mockProcessPools,
  filters: mockFilters,
  dosingSystems: mockDosingSystems,
  pumpHouseData: mockPumpHouseData,
  historyData: {},
  selectedPoolId: null,
  isEmergencyMode: false,
  activeEmergencyPoolId: null,
  poolValveMap: {
    'pool-intake': 'valve-intake-outlet',
    'pool-sed-1': 'valve-sed1-outlet',
    'pool-sed-2': 'valve-sed2-outlet',
    'pool-filter-1': 'valve-filter1-outlet',
    'pool-filter-2': 'valve-filter2-outlet',
    'pool-filter-3': 'valve-filter3-outlet',
    'pool-filter-4': 'valve-filter4-outlet',
    'pool-clear': 'valve-clear-outlet',
  },
  backwashQueue: [],
  isAutoBackwashEnabled: true,
  
  updatePoolData: (poolId, updates) => {
    set(state => ({
      pools: state.pools.map(p => p.id === poolId ? { ...p, ...updates } : p),
    }));
  },
  
  updateFilterData: (filterId, updates) => {
    set(state => ({
      filters: state.filters.map(f => f.id === filterId ? { ...f, ...updates } : f),
    }));
  },
  
  updateDosingData: (dosingId, updates) => {
    set(state => ({
      dosingSystems: state.dosingSystems.map(d => d.id === dosingId ? { ...d, ...updates } : d),
    }));
  },
  
  updatePumpHouseData: (updates) => {
    set(state => ({
      pumpHouseData: { ...state.pumpHouseData, ...updates },
    }));
  },
  
  setSelectedPool: (poolId) => {
    set({ selectedPoolId: poolId });
  },
  
  getPoolHistory: (poolId) => {
    const existing = get().historyData[poolId];
    if (existing) return existing;
    
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return [];
    
    const history = generate24HourHistory(poolId, {
      baseFlow: pool.currentFlow,
      baseTurbidity: pool.turbidity,
      basePH: pool.pH,
      baseChlorine: pool.residualChlorine,
    });
    
    set(state => ({
      historyData: { ...state.historyData, [poolId]: history },
    }));
    
    return history;
  },
  
  triggerEmergencyShutdown: (poolId) => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return;
    
    const { addAlarm, addEmergencyAction } = useAlarmStore.getState();
    const { currentUser } = useAuthStore.getState();
    const operatorName = currentUser ? currentUser.name : '系统自动';
    
    const alarm = addAlarm({
      level: 'danger',
      type: '水质异常',
      message: `${pool.poolNo} ${pool.name} 浊度超标，启动应急处置流程`,
      sourcePoolId: poolId,
    });
    
    addEmergencyAction(alarm.id, {
      type: 'alarm_generated',
      detail: `检测到浊度超标：${pool.turbidity.toFixed(2)} NTU，阈值：5.00 NTU`,
      operator: operatorName,
    });
    
    set({ isEmergencyMode: true, activeEmergencyPoolId: poolId });
    
    get().updatePoolData(poolId, { status: 'alarm', currentFlow: 0 });
    
    addEmergencyAction(alarm.id, {
      type: 'notified_center',
      detail: `已推送异常信息至监测中心大屏及值班人员手机端`,
      operator: '系统自动',
    });
    
    const valveId = get().poolValveMap[poolId];
    if (valveId) {
      const valves = { ...get().pumpHouseData.valveStatus };
      valves[valveId] = 'closing';
      get().updatePumpHouseData({ valveStatus: valves });
      
      setTimeout(() => {
        const updatedValves = { ...useWaterPlantStore.getState().pumpHouseData.valveStatus };
        updatedValves[valveId] = 'closed';
        useWaterPlantStore.getState().updatePumpHouseData({ valveStatus: updatedValves });
        
        const { addEmergencyAction: addAction2 } = useAlarmStore.getState();
        addAction2(alarm.id, {
          type: 'valve_closed',
          detail: `${pool.poolNo} 出水阀已关闭（${valveId}）`,
          operator: '系统自动',
        });
      }, 2500);
    }
    
    const dosingIds = get().dosingSystems.map(d => d.id);
    dosingIds.forEach(dosingId => {
      const dosing = get().dosingSystems.find(d => d.id === dosingId);
      if (dosing) {
        const emergencyDosage = dosing.calculatedDosage * 1.8;
        get().updateDosingData(dosingId, {
          actualDosage: Math.round(emergencyDosage * 100) / 100,
          pipelineFlow: Math.round(emergencyDosage * 0.95 * 100) / 100,
          status: 'over',
        });
      }
    });
    
    setTimeout(() => {
      const { addEmergencyAction: addAction3 } = useAlarmStore.getState();
      addAction3(alarm.id, {
        type: 'emergency_dosing',
        detail: `应急投加系统已启动：混凝剂投加量提升至180%，活性炭投加系统已激活`,
        operator: '系统自动',
      });
    }, 3000);
  },
  
  recoverEmergencyPool: (poolId) => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return;
    
    const { alarms, addEmergencyAction } = useAlarmStore.getState();
    const relatedAlarm = alarms.find(a => a.sourcePoolId === poolId && a.level === 'danger');
    const { currentUser } = useAuthStore.getState();
    const operatorName = currentUser ? currentUser.name : '系统自动';
    
    set(state => ({
      isEmergencyMode: state.pools.filter(p => p.status === 'alarm').length > 1,
      activeEmergencyPoolId: state.activeEmergencyPoolId === poolId ? null : state.activeEmergencyPoolId,
    }));
    
    get().updatePoolData(poolId, { 
      status: 'normal', 
      currentFlow: 1500 + Math.random() * 500,
      turbidity: 2.0 + Math.random(),
      pH: 7.2 + Math.random() * 0.4,
      residualChlorine: 0.5 + Math.random() * 0.3,
    });
    
    const valveId = get().poolValveMap[poolId];
    if (valveId) {
      const valves = { ...get().pumpHouseData.valveStatus };
      valves[valveId] = 'opening';
      get().updatePumpHouseData({ valveStatus: valves });
      
      setTimeout(() => {
        const updatedValves = { ...useWaterPlantStore.getState().pumpHouseData.valveStatus };
        updatedValves[valveId] = 'open';
        useWaterPlantStore.getState().updatePumpHouseData({ valveStatus: updatedValves });
      }, 2000);
    }
    
    const dosingIds = get().dosingSystems.map(d => d.id);
    dosingIds.forEach(dosingId => {
      const intakePool = get().pools.find(p => p.type === 'intake');
      if (intakePool) {
        const normalDosage = calculateOptimalDosage(intakePool.turbidity, intakePool.currentFlow);
        get().updateDosingData(dosingId, {
          actualDosage: Math.round(normalDosage * 100) / 100,
          pipelineFlow: Math.round(normalDosage * 0.95 * 100) / 100,
          status: 'normal',
        });
      }
    });
    
    if (relatedAlarm) {
      addEmergencyAction(relatedAlarm.id, {
        type: 'system_recovered',
        detail: `${pool.poolNo} 水质恢复正常，系统恢复标准运行模式`,
        operator: operatorName,
      });
    }
  },
  
  simulateTurbidityOverflow: (poolId) => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return;
    
    get().updatePoolData(poolId, {
      turbidity: 8.5 + Math.random() * 3,
      status: 'alarm',
    });
    
    setTimeout(() => {
      get().triggerEmergencyShutdown(poolId);
    }, 500);
  },
  
  simulateRealtimeUpdate: () => {
    set(state => {
      const updatedPools = state.pools.map(pool => {
        if (pool.type === 'dosing' || pool.type === 'controlRoom') return pool;
        if (pool.status === 'alarm') return pool;
        
        const flowVariation = 0.98 + Math.random() * 0.04;
        const newFlow = pool.currentFlow * flowVariation;
        const turbidityVariation = 0.95 + Math.random() * 0.1;
        const newTurbidity = pool.turbidity * turbidityVariation;
        const pHVariation = (Math.random() - 0.5) * 0.1;
        const newPH = Math.max(6.5, Math.min(8.5, pool.pH + pHVariation));
        const chlorineVariation = 0.9 + Math.random() * 0.2;
        const newChlorine = pool.residualChlorine * chlorineVariation;
        
        const qualityCheck = checkWaterQuality(newTurbidity, newPH, newChlorine);
        
        return {
          ...pool,
          currentFlow: Math.round(newFlow * 10) / 10,
          turbidity: Math.round(newTurbidity * 100) / 100,
          pH: Math.round(newPH * 100) / 100,
          residualChlorine: Math.round(newChlorine * 100) / 100,
          status: qualityCheck.status,
        };
      });
      
      const alarmPools = updatedPools.filter(p => p.turbidity > 5 && p.status !== 'alarm');
      if (alarmPools.length > 0 && !state.isEmergencyMode) {
        setTimeout(() => {
          alarmPools.forEach(pool => {
            if (pool.status !== 'alarm') {
              useWaterPlantStore.getState().triggerEmergencyShutdown(pool.id);
            }
          });
        }, 200);
      }
      
      const updatedDosing = state.dosingSystems.map(dosing => {
        const intakePool = updatedPools.find(p => p.type === 'intake');
        if (!intakePool) return dosing;
        if (state.isEmergencyMode) return dosing;
        
        const calculated = calculateOptimalDosage(intakePool.turbidity, intakePool.currentFlow);
        const actualVariation = 0.95 + Math.random() * 0.1;
        const actual = calculated * actualVariation;
        
        let status: 'normal' | 'over' | 'under' = 'normal';
        if (actual > calculated * 1.1) status = 'over';
        else if (actual < calculated * 0.9) status = 'under';
        
        return {
          ...dosing,
          rawWaterTurbidity: intakePool.turbidity,
          rawWaterFlow: intakePool.currentFlow,
          calculatedDosage: calculated,
          actualDosage: Math.round(actual * 100) / 100,
          status,
          pipelineFlow: Math.round(actual * 0.98 * 100) / 100,
        };
      });
      
      let updatedFilters = state.filters.map(filter => {
        if (filter.isBackwashing) {
          const newProgress = Math.min(100, filter.backwashProgress + 2);
          if (newProgress >= 100) {
            return {
              ...filter,
              isBackwashing: false,
              backwashProgress: 0,
              headLoss: 0.3 + Math.random() * 0.2,
              effluentTurbidity: 0.3 + Math.random() * 0.1,
              lastBackwash: Date.now(),
              priority: calculateBackwashPriority({ ...filter, headLoss: 0.4, effluentTurbidity: 0.35, lastBackwash: Date.now() }),
            };
          }
          return { ...filter, backwashProgress: newProgress };
        }
        
        const headLossIncrease = 0.001 + Math.random() * 0.003;
        const turbidityIncrease = 0.0005 + Math.random() * 0.001;
        const newHeadLoss = Math.min(3.0, filter.headLoss + headLossIncrease);
        const newTurbidity = Math.min(1.0, filter.effluentTurbidity + turbidityIncrease);
        
        return {
          ...filter,
          headLoss: Math.round(newHeadLoss * 100) / 100,
          effluentTurbidity: Math.round(newTurbidity * 100) / 100,
          priority: calculateBackwashPriority({ ...filter, headLoss: newHeadLoss, effluentTurbidity: newTurbidity }),
        };
      });
      
      if (state.isAutoBackwashEnabled) {
        const needsBackwash = updatedFilters.filter(f => 
          !f.isBackwashing && (f.headLoss > 2.5 || f.effluentTurbidity > 0.6)
        );
        
        needsBackwash.forEach(f => {
          if (!state.backwashQueue.includes(f.id)) {
            setTimeout(() => {
              useWaterPlantStore.getState().addToBackwashQueue(f.id);
            }, 300);
          }
        });
        
        setTimeout(() => {
          useWaterPlantStore.getState().processBackwashQueue();
        }, 500);
      }
      
      const completedFilters = updatedFilters.filter(f => 
        state.filters.find(sf => sf.id === f.id)?.isBackwashing && !f.isBackwashing
      );
      if (completedFilters.length > 0 && state.isAutoBackwashEnabled) {
        setTimeout(() => {
          useWaterPlantStore.getState().processBackwashQueue();
        }, 1000);
      }
      
      const clearWaterPool = updatedPools.find(p => p.type === 'clearWater');
      const pumpOptimization = optimizePumpOperation(
        state.pumpHouseData.waterLevel, state.pumpHouseData.pipePressure
      );
      
      const pressureVariation = (Math.random() - 0.5) * 0.01;
      const levelVariation = (Math.random() - 0.5) * 0.05;
      
      const oldStandby = state.pumpHouseData.standbyPumpOn;
      const newStandby = pumpOptimization.startStandby;
      
      const newValveStatus = { ...state.pumpHouseData.valveStatus };
      if (!oldStandby && newStandby) {
        Object.keys(newValveStatus).forEach(vid => {
          if (vid.includes('standby')) {
            newValveStatus[vid] = 'opening';
            setTimeout(() => {
              const vs = { ...useWaterPlantStore.getState().pumpHouseData.valveStatus };
              vs[vid] = 'open';
              useWaterPlantStore.getState().updatePumpHouseData({ valveStatus: vs });
            }, 2000);
          }
        });
      } else if (oldStandby && !newStandby) {
        Object.keys(newValveStatus).forEach(vid => {
          if (vid.includes('standby')) {
            newValveStatus[vid] = 'closing';
            setTimeout(() => {
              const vs = { ...useWaterPlantStore.getState().pumpHouseData.valveStatus };
              vs[vid] = 'closed';
              useWaterPlantStore.getState().updatePumpHouseData({ valveStatus: vs });
            }, 2000);
          }
        });
      }
      
      const updatedPumpHouse = {
        ...state.pumpHouseData,
        waterLevel: Math.max(0.5, Math.min(4.0, state.pumpHouseData.waterLevel + levelVariation)),
        pipePressure: Math.max(0.2, Math.min(0.5, state.pumpHouseData.pipePressure + pressureVariation)),
        runningPumps: pumpOptimization.runningPumps,
        frequency: pumpOptimization.frequency,
        standbyPumpOn: newStandby,
        valveStatus: newValveStatus,
      };
      
      Object.keys(state.historyData).forEach(poolId => {
        const pool = updatedPools.find(p => p.id === poolId);
        if (pool && state.historyData[poolId]) {
          const lastData = state.historyData[poolId][state.historyData[poolId].length - 1];
          const timeDiff = Date.now() - lastData.timestamp;
          if (timeDiff > 3600000) {
            state.historyData[poolId].push({
              timestamp: Date.now(),
              flow: pool.currentFlow,
              turbidity: pool.turbidity,
              pH: pool.pH,
              residualChlorine: pool.residualChlorine,
            });
            state.historyData[poolId] = state.historyData[poolId].slice(-48);
          }
        }
      });
      
      return {
        pools: updatedPools,
        dosingSystems: updatedDosing,
        filters: updatedFilters,
        pumpHouseData: updatedPumpHouse,
        historyData: { ...state.historyData },
      };
    });
  },
  
  startBackwash: (filterId) => {
    const filter = get().filters.find(f => f.id === filterId);
    if (!filter || filter.isBackwashing) return false;
    
    const activeBackwash = get().filters.filter(f => f.isBackwashing).length;
    if (activeBackwash >= 2) return false;
    
    get().updateFilterData(filterId, {
      isBackwashing: true,
      backwashProgress: 0,
    });
    
    return true;
  },
  
  completeBackwash: (filterId) => {
    get().updateFilterData(filterId, {
      isBackwashing: false,
      backwashProgress: 0,
      headLoss: 0.3 + Math.random() * 0.2,
      effluentTurbidity: 0.3 + Math.random() * 0.1,
      lastBackwash: Date.now(),
    });
  },
  
  addToBackwashQueue: (filterId) => {
    set(state => {
      if (state.backwashQueue.includes(filterId)) return state;
      const newQueue = [...state.backwashQueue, filterId];
      newQueue.sort((a, b) => {
        const fa = state.filters.find(f => f.id === a);
        const fb = state.filters.find(f => f.id === b);
        return (fb?.priority || 0) - (fa?.priority || 0);
      });
      return { backwashQueue: newQueue };
    });
  },
  
  removeFromBackwashQueue: (filterId) => {
    set(state => ({
      backwashQueue: state.backwashQueue.filter(id => id !== filterId),
    }));
  },
  
  processBackwashQueue: () => {
    const { filters, backwashQueue, startBackwash, removeFromBackwashQueue } = get();
    
    const activeBackwash = filters.filter(f => f.isBackwashing).length;
    const availableSlots = 2 - activeBackwash;
    
    if (availableSlots <= 0 || backwashQueue.length === 0) return;
    
    const sortedQueue = [...backwashQueue].sort((a, b) => {
      const fa = filters.find(f => f.id === a);
      const fb = filters.find(f => f.id === b);
      return (fb?.priority || 0) - (fa?.priority || 0);
    });
    
    let slotsUsed = 0;
    for (const filterId of sortedQueue) {
      if (slotsUsed >= availableSlots) break;
      const started = startBackwash(filterId);
      if (started) {
        removeFromBackwashQueue(filterId);
        slotsUsed++;
      }
    }
  },
  
  setAutoBackwashEnabled: (enabled) => {
    set({ isAutoBackwashEnabled: enabled });
  },
}));
