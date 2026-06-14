export type PoolType = 'intake' | 'sedimentation' | 'filter' | 'clearWater' | 'dosing' | 'pumpHouse' | 'controlRoom';
export type PoolStatus = 'normal' | 'warning' | 'alarm';
export type UserRole = 'operator' | 'supervisor' | 'manager';
export type AlarmLevel = 'info' | 'warning' | 'danger';
export type DosingStatus = 'normal' | 'over' | 'under';
export type EquipmentType = 'dosingPump' | 'blower' | 'valve' | 'pump';
export type EquipmentHealth = 'good' | 'warning' | 'maintenance';
export type WorkOrderType = 'maintenance' | 'repair' | 'inspection';
export type WorkOrderStatus = 'pending' | 'inProgress' | 'completed';
export type ValveStatus = 'open' | 'closed' | 'opening' | 'closing';

export interface ProcessPool {
  id: string;
  poolNo: string;
  type: PoolType;
  name: string;
  currentFlow: number;
  turbidity: number;
  pH: number;
  residualChlorine: number;
  status: PoolStatus;
  position: [number, number, number];
  size: [number, number, number];
}

export interface WaterQualityData {
  timestamp: number;
  flow: number;
  turbidity: number;
  pH: number;
  residualChlorine: number;
}

export interface DosingData {
  id: string;
  name: string;
  rawWaterTurbidity: number;
  rawWaterFlow: number;
  calculatedDosage: number;
  actualDosage: number;
  status: DosingStatus;
  pipelineFlow: number;
}

export interface FilterData {
  id: string;
  filterNo: string;
  headLoss: number;
  effluentTurbidity: number;
  priority: number;
  isBackwashing: boolean;
  backwashProgress: number;
  lastBackwash: number;
  position: [number, number, number];
}

export interface PumpHouseData {
  waterLevel: number;
  pipePressure: number;
  runningPumps: number;
  totalPumps: number;
  frequency: number;
  standbyPumpOn: boolean;
  valveStatus: Record<string, ValveStatus>;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  runningHours: number;
  maintenanceThreshold: number;
  healthStatus: EquipmentHealth;
  lastMaintenance: number;
  location: string;
}

export interface Alarm {
  id: string;
  level: AlarmLevel;
  type: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  sourcePoolId?: string;
}

export interface WorkOrder {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  createTime: number;
  spareParts: string[];
  description: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  lastLogin: number;
  avatar?: string;
}

export interface OperationLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  detail: string;
  timestamp: number;
}

export interface DailyReport {
  reportDate: string;
  totalProcessedWater: number;
  waterQualityRate: number;
  energyConsumption: number;
  segmentData: {
    name: string;
    processedWater: number;
    qualityRate: number;
    energy: number;
  }[];
}

export interface PipelineSegment {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  type: 'water' | 'chemical' | 'backwash';
  flowRate: number;
  color: string;
}

export interface CameraPreset {
  name: string;
  position: [number, number, number];
  target: [number, number, number];
}
