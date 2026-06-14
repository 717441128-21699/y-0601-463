import { create } from 'zustand';
import type { Equipment, WorkOrder } from '../types';
import { mockEquipment, mockWorkOrders } from '../services/mock/equipment';
import { generateId } from '../utils/algorithms';

interface EquipmentState {
  equipment: Equipment[];
  workOrders: WorkOrder[];
  
  updateEquipment: (equipmentId: string, updates: Partial<Equipment>) => void;
  addWorkOrder: (order: Omit<WorkOrder, 'id' | 'createTime'>) => void;
  updateWorkOrder: (orderId: string, updates: Partial<WorkOrder>) => void;
  completeWorkOrder: (orderId: string) => void;
  checkMaintenanceThresholds: () => void;
  getEquipmentByType: (type: string) => Equipment[];
  getWorkOrdersByStatus: (status: string) => WorkOrder[];
}

export const useEquipmentStore = create<EquipmentState>((set, get) => ({
  equipment: mockEquipment,
  workOrders: mockWorkOrders,
  
  updateEquipment: (equipmentId, updates) => {
    set(state => ({
      equipment: state.equipment.map(e => 
        e.id === equipmentId ? { ...e, ...updates } : e
      ),
    }));
  },
  
  addWorkOrder: (order) => {
    const newOrder: WorkOrder = {
      ...order,
      id: generateId(),
      createTime: Date.now(),
    };
    set(state => ({
      workOrders: [newOrder, ...state.workOrders],
    }));
  },
  
  updateWorkOrder: (orderId, updates) => {
    set(state => ({
      workOrders: state.workOrders.map(o => 
        o.id === orderId ? { ...o, ...updates } : o
      ),
    }));
  },
  
  completeWorkOrder: (orderId) => {
    const order = get().workOrders.find(o => o.id === orderId);
    if (order) {
      get().updateWorkOrder(orderId, { status: 'completed' });
      get().updateEquipment(order.equipmentId, {
        lastMaintenance: Date.now(),
        runningHours: 0,
        healthStatus: 'good',
      });
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
            spareParts: ['保养套件', '润滑油', '密封圈'],
            description: `${eq.name}累计运行${eq.runningHours}小时，已超过保养阈值${eq.maintenanceThreshold}小时，请尽快安排保养`,
          });
        }
      } else if (ratio >= 0.9 && ratio < 1.0 && eq.healthStatus === 'good') {
        get().updateEquipment(eq.id, { healthStatus: 'warning' });
      }
    });
  },
  
  getEquipmentByType: (type) => {
    return get().equipment.filter(e => e.type === type);
  },
  
  getWorkOrdersByStatus: (status) => {
    return get().workOrders.filter(o => o.status === status);
  },
}));
