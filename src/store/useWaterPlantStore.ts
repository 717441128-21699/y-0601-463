import { create } from 'zustand';
import type { ProcessPool, FilterData, DosingData, PumpHouseData, WaterQualityData } from '../types';
import { mockProcessPools, mockFilters } from '../services/mock/pools';
import { generate24HourHistory, mockDosingSystems, mockPumpHouseData } from '../services/mock/waterQuality';
import { calculateOptimalDosage, calculateBackwashPriority, optimizePumpOperation, checkWaterQuality, generateId } from '../utils/algorithms';

interface WaterPlantState {
  pools: ProcessPool[];
  filters: FilterData[];
  dosingSystems: DosingData[];
  pumpHouseData: PumpHouseData;
  historyData: Record<string, WaterQualityData[]>;
  selectedPoolId: string | null;
  isEmergencyMode: boolean;
  
  updatePoolData: (poolId: string, updates: Partial<ProcessPool>) => void;
  updateFilterData: (filterId: string, updates: Partial<FilterData>) => void;
  updateDosingData: (dosingId: string, updates: Partial<DosingData>) => void;
  updatePumpHouseData: (updates: Partial<PumpHouseData>) => void;
  setSelectedPool: (poolId: string | null) => void;
  getPoolHistory: (poolId: string) => WaterQualityData[];
  triggerEmergencyShutdown: (poolId: string) => void;
  simulateRealtimeUpdate: () => void;
  startBackwash: (filterId: string) => void;
  completeBackwash: (filterId: string) => void;
}

export const useWaterPlantStore = create<WaterPlantState>((set, get) => ({
  pools: mockProcessPools,
  filters: mockFilters,
  dosingSystems: mockDosingSystems,
  pumpHouseData: mockPumpHouseData,
  historyData: {},
  selectedPoolId: null,
  isEmergencyMode: false,
  
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
    set({ isEmergencyMode: true });
    
    get().updatePoolData(poolId, { status: 'alarm', currentFlow: 0 });
    
    const pool = get().pools.find(p => p.id === poolId);
    if (pool) {
      const valves = { ...get().pumpHouseData.valveStatus };
      const outletValve = Object.keys(valves)[0];
      if (outletValve) {
        valves[outletValve] = 'closing';
        get().updatePumpHouseData({ valveStatus: valves });
        
        setTimeout(() => {
          const updatedValves = { ...get().pumpHouseData.valveStatus };
          updatedValves[outletValve] = 'closed';
          get().updatePumpHouseData({ valveStatus: updatedValves });
        }, 3000);
      }
    }
  },
  
  simulateRealtimeUpdate: () => {
    set(state => {
      const updatedPools = state.pools.map(pool => {
        if (pool.type === 'dosing' || pool.type === 'controlRoom') return pool;
        
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
      
      const updatedDosing = state.dosingSystems.map(dosing => {
        const intakePool = updatedPools.find(p => p.type === 'intake');
        if (!intakePool) return dosing;
        
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
      
      const updatedFilters = state.filters.map(filter => {
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
      
      const clearWaterPool = updatedPools.find(p => p.type === 'clearWater');
      const pumpOptimization = optimizePumpOperation(
        state.pumpHouseData.waterLevel, state.pumpHouseData.pipePressure
      );
      
      const pressureVariation = (Math.random() - 0.5) * 0.01;
      const levelVariation = (Math.random() - 0.5) * 0.05;
      
      const updatedPumpHouse = {
        ...state.pumpHouseData,
        waterLevel: Math.max(0.5, Math.min(4.0, state.pumpHouseData.waterLevel + levelVariation)),
        pipePressure: Math.max(0.2, Math.min(0.5, state.pumpHouseData.pipePressure + pressureVariation)),
        runningPumps: pumpOptimization.runningPumps,
        frequency: pumpOptimization.frequency,
        standbyPumpOn: pumpOptimization.startStandby,
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
    if (!filter || filter.isBackwashing) return;
    
    const activeBackwash = get().filters.filter(f => f.isBackwashing).length;
    if (activeBackwash >= 2) {
      return;
    }
    
    get().updateFilterData(filterId, {
      isBackwashing: true,
      backwashProgress: 0,
    });
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
}));
