import { create } from 'zustand';
import type { ProcessPool, FilterData, DosingData, PumpHouseData, WaterQualityData, ValveStatus, EmergencyDosingPlan, BackwashReason } from '../types';
import { mockProcessPools, mockFilters } from '../services/mock/pools';
import { generate24HourHistory, mockDosingSystems, mockPumpHouseData } from '../services/mock/waterQuality';
import { calculateOptimalDosage, calculateBackwashPriority, optimizePumpOperation, checkWaterQuality, generateId } from '../utils/algorithms';
import { useAlarmStore } from './useAlarmStore';
import { useAuthStore } from './useAuthStore';

export type EmergencyCause = 'turbidity' | 'ph' | 'chlorine' | 'multi';

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
  processedEmergencyPoolIds: string[];
  valveDisplayNameMap: Record<string, string>;
  
  updatePoolData: (poolId: string, updates: Partial<ProcessPool>) => void;
  updateFilterData: (filterId: string, updates: Partial<FilterData>) => void;
  updateDosingData: (dosingId: string, updates: Partial<DosingData>) => void;
  updatePumpHouseData: (updates: Partial<PumpHouseData>) => void;
  setSelectedPool: (poolId: string | null) => void;
  getPoolHistory: (poolId: string) => WaterQualityData[];
  triggerEmergencyShutdown: (poolId: string, cause?: EmergencyCause) => void;
  recoverEmergencyPool: (poolId: string) => void;
  simulateOverflow: (poolId: string, type?: EmergencyCause) => void;
  simulateRealtimeUpdate: () => void;
  startBackwash: (filterId: string) => boolean;
  completeBackwash: (filterId: string) => void;
  addToBackwashQueue: (filterId: string, reason?: BackwashReason) => void;
  removeFromBackwashQueue: (filterId: string) => void;
  processBackwashQueue: () => void;
  setAutoBackwashEnabled: (enabled: boolean) => void;
  clearEmergencyProcessingFlag: (poolId: string) => void;
  pushDosingHistoryPoint: () => void;
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
  processedEmergencyPoolIds: [],
  valveDisplayNameMap: {
    'valve-intake-outlet': '取水口出水阀',
    'valve-sed1-outlet': '沉淀池1出水阀',
    'valve-sed2-outlet': '沉淀池2出水阀',
    'valve-filter1-outlet': '滤池1出水阀',
    'valve-filter2-outlet': '滤池2出水阀',
    'valve-filter3-outlet': '滤池3出水阀',
    'valve-filter4-outlet': '滤池4出水阀',
    'valve-clear-outlet': '清水池出水阀',
    'valve-main-pump': '主泵阀组',
    'valve-standby-pump': '备用泵阀组',
    'valve-delivery': '输水总阀',
  },
  
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
  
  triggerEmergencyShutdown: (poolId, cause = 'turbidity') => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return;
    
    if (get().processedEmergencyPoolIds.includes(poolId)) return;
    
    set(state => ({
      processedEmergencyPoolIds: [...state.processedEmergencyPoolIds, poolId],
    }));
    
    const { addAlarm, addEmergencyAction } = useAlarmStore.getState();
    const { currentUser } = useAuthStore.getState();
    const operatorName = currentUser ? currentUser.name : '系统自动';
    
    let causeText = '';
    let causeDetail = '';
    if (cause === 'turbidity') {
      causeText = '浊度超标';
      causeDetail = `检测到浊度超标：${pool.turbidity.toFixed(2)} NTU，阈值：5.00 NTU`;
    } else if (cause === 'ph') {
      causeText = 'pH值异常';
      causeDetail = `检测到pH值异常：${pool.pH.toFixed(2)}，正常范围：6.5~8.5`;
    } else if (cause === 'chlorine') {
      causeText = '余氯异常';
      causeDetail = `检测到余氯异常：${pool.residualChlorine.toFixed(2)} mg/L，正常范围：0.3~4.0`;
    } else {
      causeText = '多项水质指标异常';
      causeDetail = `检测到多项水质指标异常：浊度${pool.turbidity.toFixed(2)} NTU，pH${pool.pH.toFixed(2)}，余氯${pool.residualChlorine.toFixed(2)} mg/L`;
    }
    
    const alarm = addAlarm({
      level: 'danger',
      type: '水质异常',
      message: `${pool.poolNo} ${pool.name} ${causeText}，启动应急处置流程`,
      sourcePoolId: poolId,
    });
    
    addEmergencyAction(alarm.id, {
      type: 'alarm_generated',
      detail: causeDetail,
      operator: operatorName,
    });
    
    set(state => ({
      isEmergencyMode: true,
      activeEmergencyPoolId: state.activeEmergencyPoolId || poolId,
    }));
    
    get().updatePoolData(poolId, { status: 'alarm', currentFlow: 0 });
    
    addEmergencyAction(alarm.id, {
      type: 'notified_center',
      detail: `已推送异常信息至监测中心大屏及值班人员手机端，通知内容：${pool.poolNo}${causeText}`,
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
          detail: `${pool.poolNo} 出水阀已完成关闭（${get().valveDisplayNameMap[valveId] || valveId}），已切断该工艺段出水`,
          operator: '系统自动',
        });
      }, 2500);
    }
    
    const emergencyPlan: EmergencyDosingPlan = {
      planName: cause === 'turbidity' ? '高浊度应急投加方案' :
                cause === 'ph' ? 'pH异常应急调节方案' :
                cause === 'chlorine' ? '余氯异常应急投加方案' : '综合水质应急方案',
      estimatedRecoveryMinutes: cause === 'turbidity' ? 15 : cause === 'ph' ? 10 : 12,
      chemicalTypes: cause === 'turbidity' ? ['PAC混凝剂', 'PAM助凝剂', '粉末活性炭'] :
                     cause === 'ph' ? ['pH调节剂(氢氧化钠)', 'PAC混凝剂'] :
                     cause === 'chlorine' ? ['次氯酸钠消毒液', '脱氯剂'] :
                     ['PAC混凝剂', 'PAM助凝剂', '次氯酸钠', 'pH调节剂'],
      multiplier: 1.8,
      activatedAt: Date.now(),
      estimatedEndAt: Date.now() + (cause === 'turbidity' ? 15 : cause === 'ph' ? 10 : 12) * 60 * 1000,
      notes: cause === 'turbidity' ? '混凝剂提升至180%，同时启用活性炭应急投加管路，预计15分钟内水质回落' :
             cause === 'ph' ? '启动氢氧化钠/硫酸自动调节系统，pH回调至7.0~7.5后切换回常规模式' :
             cause === 'chlorine' ? '余氯异常，根据偏高/偏低自动切换次氯酸钠/脱氯剂投加' :
             '综合应急方案已启动，全部药剂按最高安全剂量投加',
    };
    
    const dosingIds = get().dosingSystems.map(d => d.id);
    dosingIds.forEach(dosingId => {
      const dosing = get().dosingSystems.find(d => d.id === dosingId);
      if (dosing) {
        const emergencyDosage = dosing.calculatedDosage * emergencyPlan.multiplier;
        get().updateDosingData(dosingId, {
          actualDosage: Math.round(emergencyDosage * 100) / 100,
          pipelineFlow: Math.round(emergencyDosage * 0.95 * 100) / 100,
          status: 'over',
          emergencyPlan,
        });
      }
    });
    
    setTimeout(() => {
      const { addEmergencyAction: addAction3 } = useAlarmStore.getState();
      addAction3(alarm.id, {
        type: 'emergency_dosing',
        detail: `${emergencyPlan.planName}已执行：${emergencyPlan.chemicalTypes.join('、')}投加量提升至${Math.round(emergencyPlan.multiplier * 100)}%，预计${emergencyPlan.estimatedRecoveryMinutes}分钟恢复`,
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
      isEmergencyMode: state.pools.filter(p => p.status === 'alarm' && p.id !== poolId).length > 0,
      activeEmergencyPoolId: state.activeEmergencyPoolId === poolId ? null : state.activeEmergencyPoolId,
      processedEmergencyPoolIds: state.processedEmergencyPoolIds.filter(id => id !== poolId),
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
          emergencyPlan: null,
        });
      }
    });
    
    if (relatedAlarm) {
      addEmergencyAction(relatedAlarm.id, {
        type: 'system_recovered',
        detail: `${pool.poolNo} 水质已恢复正常范围，阀门已开启，加药量已切回常规投加模式，本次应急处置记录已归档`,
        operator: operatorName,
      });
    }
  },
  
  simulateOverflow: (poolId, type = 'turbidity') => {
    const pool = get().pools.find(p => p.id === poolId);
    if (!pool) return;
    
    const updates: Partial<ProcessPool> = { status: 'alarm' };
    if (type === 'turbidity') {
      updates.turbidity = 8.5 + Math.random() * 3;
    } else if (type === 'ph') {
      updates.pH = Math.random() > 0.5 ? 9.5 + Math.random() * 0.5 : 5.2 + Math.random() * 0.3;
    } else if (type === 'chlorine') {
      updates.residualChlorine = Math.random() > 0.5 ? 5.0 + Math.random() * 1.5 : 0.05 + Math.random() * 0.1;
    } else {
      updates.turbidity = 8.5 + Math.random() * 3;
      updates.pH = 9.5;
      updates.residualChlorine = 0.05;
    }
    
    get().updatePoolData(poolId, updates);
    
    setTimeout(() => {
      get().triggerEmergencyShutdown(poolId, type);
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
        const pHVariation = (Math.random() - 0.5) * 0.15;
        const newPH = Math.max(6.0, Math.min(9.5, pool.pH + pHVariation));
        const chlorineVariation = 0.85 + Math.random() * 0.3;
        const newChlorine = Math.max(0.02, Math.min(5.0, pool.residualChlorine * chlorineVariation));
        
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
      
      const emergencyPoolCandidates: { id: string; cause: EmergencyCause }[] = [];
      updatedPools.forEach(p => {
        if (state.processedEmergencyPoolIds.includes(p.id)) return;
        let cause: EmergencyCause | null = null;
        const turbidityBad = p.turbidity > 5;
        const phBad = p.pH < 6.0 || p.pH > 9.0;
        const chlorineBad = p.residualChlorine < 0.05 || p.residualChlorine > 4.0;
        const badCount = [turbidityBad, phBad, chlorineBad].filter(Boolean).length;
        if (badCount >= 2) cause = 'multi';
        else if (turbidityBad) cause = 'turbidity';
        else if (phBad) cause = 'ph';
        else if (chlorineBad) cause = 'chlorine';
        if (cause) emergencyPoolCandidates.push({ id: p.id, cause });
      });
      
      if (emergencyPoolCandidates.length > 0) {
        setTimeout(() => {
          emergencyPoolCandidates.forEach(({ id, cause }) => {
            if (!useWaterPlantStore.getState().processedEmergencyPoolIds.includes(id)) {
              useWaterPlantStore.getState().triggerEmergencyShutdown(id, cause);
            }
          });
        }, 200);
      }
      
      const updatedDosing = state.dosingSystems.map(dosing => {
        const intakePool = updatedPools.find(p => p.type === 'intake');
        if (!intakePool) return dosing;
        if (dosing.emergencyPlan) return dosing;
        
        const calculated = calculateOptimalDosage(intakePool.turbidity, intakePool.currentFlow);
        const actualVariation = 0.95 + Math.random() * 0.1;
        const actual = calculated * actualVariation;
        
        let status: 'normal' | 'over' | 'under' = 'normal';
        if (actual > calculated * 1.1) status = 'over';
        else if (actual < calculated * 0.9) status = 'under';
        
        const newHistory = [...(dosing.dosingHistory || []), { timestamp: Date.now(), dosage: Math.round(actual * 100) / 100 }];
        if (newHistory.length > 50) newHistory.splice(0, newHistory.length - 50);
        
        return {
          ...dosing,
          rawWaterTurbidity: intakePool.turbidity,
          rawWaterFlow: intakePool.currentFlow,
          calculatedDosage: calculated,
          actualDosage: Math.round(actual * 100) / 100,
          status,
          pipelineFlow: Math.round(actual * 0.98 * 100) / 100,
          dosingHistory: newHistory,
        };
      });
      
      let updatedFilters = state.filters.map(filter => {
        if (filter.isBackwashing) {
          const newProgress = Math.min(100, filter.backwashProgress + 2);
          if (newProgress >= 100) {
            const newPriority = calculateBackwashPriority({ ...filter, headLoss: 0.4, effluentTurbidity: 0.35, lastBackwash: Date.now() });
            return {
              ...filter,
              isBackwashing: false,
              backwashProgress: 0,
              headLoss: 0.3 + Math.random() * 0.2,
              effluentTurbidity: 0.3 + Math.random() * 0.1,
              lastBackwash: Date.now(),
              priority: newPriority,
              backwashReason: undefined,
              estimatedStartTime: undefined,
              priorityHistory: [...(filter.priorityHistory || []), { timestamp: Date.now(), priority: newPriority }].slice(-20),
            };
          }
          return { ...filter, backwashProgress: newProgress };
        }
        
        const headLossIncrease = 0.001 + Math.random() * 0.003;
        const turbidityIncrease = 0.0005 + Math.random() * 0.001;
        const newHeadLoss = Math.min(3.0, filter.headLoss + headLossIncrease);
        const newTurbidity = Math.min(1.0, filter.effluentTurbidity + turbidityIncrease);
        const newPriority = calculateBackwashPriority({ ...filter, headLoss: newHeadLoss, effluentTurbidity: newTurbidity });
        
        const newHistory = [...(filter.priorityHistory || []), { timestamp: Date.now(), priority: newPriority }];
        
        return {
          ...filter,
          headLoss: Math.round(newHeadLoss * 100) / 100,
          effluentTurbidity: Math.round(newTurbidity * 100) / 100,
          priority: newPriority,
          priorityHistory: newHistory.slice(-20),
        };
      });
      
      if (state.isAutoBackwashEnabled) {
        const needsBackwash = updatedFilters.filter(f => 
          !f.isBackwashing && !state.backwashQueue.includes(f.id) && (f.headLoss > 2.5 || f.effluentTurbidity > 0.6)
        );
        
        needsBackwash.forEach(f => {
          const reason: BackwashReason = f.headLoss > 2.5 && f.effluentTurbidity > 0.6 ? 'turbidity' : 
                                        f.headLoss > 2.5 ? 'head_loss' : 'turbidity';
          setTimeout(() => {
            useWaterPlantStore.getState().addToBackwashQueue(f.id, reason);
          }, 300);
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
    if (activeBackwash >= 1) return false;
    
    get().updateFilterData(filterId, {
      isBackwashing: true,
      backwashProgress: 0,
      estimatedStartTime: undefined,
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
      backwashReason: undefined,
      estimatedStartTime: undefined,
    });
  },
  
  addToBackwashQueue: (filterId, reason) => {
    set(state => {
      if (state.backwashQueue.includes(filterId)) return state;
      
      const activeCount = state.filters.filter(f => f.isBackwashing).length;
      const positionInQueue = state.backwashQueue.length;
      const estimatedMinutes = activeCount * 8 + positionInQueue * 8 + 2;
      
      const filter = state.filters.find(f => f.id === filterId);
      const finalReason: BackwashReason = reason || 
        (filter && filter.headLoss > 2.5 ? 'head_loss' : 'turbidity');
      
      const newFilters = state.filters.map(f => f.id === filterId ? {
        ...f,
        backwashReason: finalReason,
        estimatedStartTime: Date.now() + estimatedMinutes * 60 * 1000,
      } : f);
      
      const newQueue = [...state.backwashQueue, filterId];
      newQueue.sort((a, b) => {
        const fa = newFilters.find(f => f.id === a);
        const fb = newFilters.find(f => f.id === b);
        return (fb?.priority || 0) - (fa?.priority || 0);
      });
      
      return { backwashQueue: newQueue, filters: newFilters };
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
    const availableSlots = 1 - activeBackwash;
    
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
  
  clearEmergencyProcessingFlag: (poolId) => {
    set(state => ({
      processedEmergencyPoolIds: state.processedEmergencyPoolIds.filter(id => id !== poolId),
    }));
  },
  
  pushDosingHistoryPoint: () => {
    set(state => ({
      dosingSystems: state.dosingSystems.map(d => {
        const newHistory = [...(d.dosingHistory || []), { timestamp: Date.now(), dosage: d.actualDosage }];
        return { ...d, dosingHistory: newHistory.slice(-50) };
      }),
    }));
  },
}));
