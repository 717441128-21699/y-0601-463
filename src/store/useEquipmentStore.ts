import { create } from 'zustand';
import type { Equipment, WorkOrder, SparePart, SparePartItem } from '../types';
import { mockEquipment, mockWorkOrders, mockSpareParts } from '../services/mock/equipment';
import { generateId } from '../utils/algorithms';
import { useAuthStore } from './useAuthStore';

interface EquipmentState {
  equipment: Equipment[];
  workOrders: WorkOrder[];
  spareParts: SparePart[];
  
  updateEquipment: (equipmentId: string, updates: Partial<Equipment>) => void;
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'createTime' | 'sparePartsNotified'>) => void;
  updateWorkOrder: (orderId: string, updates: Partial<WorkOrder>) => void;
  completeWorkOrder: (orderId: string) => void;
  checkMaintenanceThresholds: () => void;
  getEquipmentByType: (type: string) => Equipment[];
  getWorkOrdersByStatus: (status: string) => WorkOrder[];
  notifySparePartsStorage: (orderId: string) => void;
  updateSparePart: (partId: string, updates: Partial<SparePart>) => void;
  generateSparePartsList: (type: WorkOrder['type'], equipmentType: string) => SparePartItem[];
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: mockEquipment,
  workOrders: mockWorkOrders,
  spareParts: mockSpareParts,
  
  updateEquipment: (equipmentId, updates) => {
    set(state => ({
      equipment: state.equipment.map(e => 
        e.id === equipmentId ? { ...e, ...updates } : e
      ),
    }));
  },
  
  generateSparePartsList: (type, equipmentType) => {
    const { spareParts } = get();
    const partsMap: Record<string, string[]> = {
      'dosingPump-maintenance': ['加药泵保养套件', '润滑油', '机械密封件', '过滤滤芯'],
      'dosingPump-repair': ['加药泵隔膜', '电机轴承', '止回阀', '压力传感器'],
      'blower-maintenance': ['鼓风机空气滤芯', '润滑油', '传动皮带', '密封垫圈'],
      'blower-repair': ['鼓风机叶轮', '电机绕组', '轴承套件', '进气阀'],
      'pump-maintenance': ['水泵机械密封', '润滑油', '联轴器', '轴承'],
      'pump-repair': ['水泵叶轮', '泵轴', '电机', '压力变送器'],
      'valve-maintenance': ['阀门密封件', '润滑脂', '阀杆填料'],
      'valve-repair': ['阀门阀芯', '执行器', '阀座密封圈', '限位开关'],
    };
    
    const key = `${equipmentType}-${type}`;
    const partNames = partsMap[key] || partsMap[`${equipmentType}-maintenance`] || ['通用保养套件'];
    
    return partNames.map(name => {
      const stockPart = spareParts.find(sp => sp.name === name);
      const quantity = name.includes('套件') ? 1 : (name.includes('润滑油') ? 2 : Math.ceil(Math.random() * 3) + 1);
      return {
        name,
        quantity,
        unit: stockPart?.unit || '套',
        available: stockPart ? stockPart.stock >= quantity : true,
        stock: stockPart?.stock || 10,
      };
    });
  },
  
  addWorkOrder: (order) => {
    const { currentUser } = useAuthStore.getState();
    const partsList = order.spareParts.length === 0 || typeof order.spareParts[0] === 'string'
      ? get().generateSparePartsList(order.type, order.equipmentName.includes('加药') ? 'dosingPump' : 
                                 order.equipmentName.includes('鼓风') ? 'blower' :
                                 order.equipmentName.includes('泵') ? 'pump' : 'valve')
      : order.spareParts as SparePartItem[];
      
    const newOrder: WorkOrder = {
      ...order,
      spareParts: partsList,
      id: generateId(),
      createTime: Date.now(),
      sparePartsNotified: false,
      assignedTo: currentUser?.name,
    };
    
    set(state => ({
      workOrders: [newOrder, ...state.workOrders],
    }));
    
    setTimeout(() => {
      get().notifySparePartsStorage(newOrder.id);
    }, 1000);
  },
  
  updateWorkOrder: (orderId, updates) => {
    set(state => ({
      workOrders: state.workOrders.map(o => 
        o.id === orderId ? { ...o, ...updates } : o
      ),
    }));
  },
  
  notifySparePartsStorage: (orderId) => {
    const order = get().workOrders.find(o => o.id === orderId);
    if (!order || order.sparePartsNotified) return;
    
    const { spareParts } = get();
    const updatedSpareParts = [...spareParts];
    
    order.spareParts.forEach(item => {
      const idx = updatedSpareParts.findIndex(sp => sp.name === item.name);
      if (idx >= 0) {
        updatedSpareParts[idx] = {
          ...updatedSpareParts[idx],
          stock: Math.max(0, updatedSpareParts[idx].stock - item.quantity),
        };
      }
    });
    
    set(state => ({
      spareParts: updatedSpareParts,
      workOrders: state.workOrders.map(o =>
        o.id === orderId
          ? { ...o, sparePartsNotified: true, notificationSentTime: Date.now() }
          : o
      ),
    }));
  },
  
  completeWorkOrder: (orderId) => {
    const order = get().workOrders.find(o => o.id === orderId);
    if (order) {
      const { currentUser } = useAuthStore.getState();
      
      set(state => ({
        workOrders: state.workOrders.map(o =>
          o.id === orderId
            ? {
                ...o,
                status: 'completed',
                completedTime: Date.now(),
                assignedTo: currentUser?.name || o.assignedTo,
              }
            : o
        ),
        equipment: state.equipment.map(e =>
          e.id === order.equipmentId
            ? {
                ...e,
                lastMaintenance: Date.now(),
                runningHours: 0,
                healthStatus: 'good',
              }
            : e
        ),
      }));
    }
  },
  
  checkMaintenanceThresholds: () => {
    const { equipment, addWorkOrder } = get();
    
    equipment.forEach(eq => {
      const ratio = eq.runningHours / eq.maintenanceThreshold;
      
      if (ratio >= 1.0 && eq.healthStatus !== 'maintenance') {
        get().updateEquipment(eq.id, { healthStatus: 'maintenance' });
        
        const existingOrder = get().workOrders.find(
          o => o.equipmentId === eq.id && o.status !== 'completed'
        );
        
        if (!existingOrder) {
          addWorkOrder({
            equipmentId: eq.id,
            equipmentName: eq.name,
            type: 'maintenance',
            status: 'pending',
            spareParts: [],
            description: `${eq.name}累计运行${eq.runningHours}小时，已超过保养阈值${eq.maintenanceThreshold}小时，请尽快安排保养`,
          });
        }
      } else if (ratio >= 0.9 && ratio < 1.0 && eq.healthStatus === 'good') {
        get().updateEquipment(eq.id, { healthStatus: 'warning' });
      }
    });
  },
  
  updateSparePart: (partId, updates) => {
    set(state => ({
      spareParts: state.spareParts.map(p =>
        p.id === partId ? { ...p, ...updates } : p
      ),
    }));
  },
  
  getEquipmentByType: (type) => {
    return get().equipment.filter(e => e.type === type);
  },
  
  getWorkOrdersByStatus: (status) => {
    return get().workOrders.filter(o => o.status === status);
  },
}));
