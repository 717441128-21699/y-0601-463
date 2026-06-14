import dayjs from 'dayjs';

export function formatFlow(flow: number): string {
  if (flow >= 10000) {
    return (flow / 10000).toFixed(2) + ' 万m³/d';
  }
  return flow.toFixed(1) + ' m³/h';
}

export function formatTurbidity(turbidity: number): string {
  return turbidity.toFixed(2) + ' NTU';
}

export function formatPH(pH: number): string {
  return pH.toFixed(2);
}

export function formatResidualChlorine(chlorine: number): string {
  return chlorine.toFixed(2) + ' mg/L';
}

export function formatDosage(dosage: number): string {
  return dosage.toFixed(2) + ' kg/h';
}

export function formatPressure(pressure: number): string {
  return pressure.toFixed(2) + ' MPa';
}

export function formatLevel(level: number): string {
  return level.toFixed(2) + ' m';
}

export function formatPercentage(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

export function formatEnergy(energy: number): string {
  return energy.toFixed(2) + ' kWh';
}

export function formatHours(hours: number): string {
  if (hours >= 8760) {
    return (hours / 8760).toFixed(1) + ' 年';
  } else if (hours >= 24) {
    return (hours / 24).toFixed(1) + ' 天';
  }
  return hours.toFixed(1) + ' 小时';
}

export function formatDateTime(timestamp: number): string {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
}

export function formatDate(timestamp: number | string): string {
  return dayjs(timestamp).format('YYYY-MM-DD');
}

export function formatTime(timestamp: number): string {
  return dayjs(timestamp).format('HH:mm:ss');
}

export function getStatusColor(status: 'normal' | 'warning' | 'alarm'): string {
  switch (status) {
    case 'normal':
      return '#2ED573';
    case 'warning':
      return '#FFA502';
    case 'alarm':
      return '#FF4757';
    default:
      return '#747d8c';
  }
}

export function getRoleName(role: 'operator' | 'supervisor' | 'manager'): string {
  switch (role) {
    case 'operator':
      return '值班员';
    case 'supervisor':
      return '班长';
    case 'manager':
      return '厂长';
    default:
      return '未知';
  }
}

export function getPoolTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    intake: '原水取水口',
    sedimentation: '反应沉淀池',
    filter: '滤池',
    clearWater: '清水池',
    dosing: '加药间',
    pumpHouse: '送水泵房',
    controlRoom: '中央控制室',
  };
  return typeMap[type] || type;
}

export function getEquipmentTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    dosingPump: '加药泵',
    blower: '鼓风机',
    valve: '阀门',
    pump: '水泵',
  };
  return typeMap[type] || type;
}
