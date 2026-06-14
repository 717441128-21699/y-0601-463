import type { FilterData } from '../types';

export function calculateOptimalDosage(turbidity: number, flow: number): number {
  const baseCoefficient = 0.8;
  const turbidityFactor = Math.pow(Math.max(0.1, turbidity) / 5, 0.6);
  const flowFactor = 1 + (flow - 1000) * 0.0001;
  const dosage = baseCoefficient * turbidityFactor * flowFactor * flow * 24 / 1000;
  return Math.max(10, Math.min(200, Math.round(dosage * 100) / 100));
}

export function calculateBackwashPriority(filter: FilterData): number {
  const headLossScore = Math.min(100, (filter.headLoss / 3.0) * 100) * 0.6;
  const turbidityScore = Math.min(100, (filter.effluentTurbidity / 1.0) * 100) * 0.4;
  const hoursSinceLastWash = (Date.now() - filter.lastBackwash) / (1000 * 60 * 60);
  const timeBonus = Math.min(20, hoursSinceLastWash * 0.5);
  
  return Math.round(headLossScore + turbidityScore + timeBonus);
}

export function optimizePumpOperation(
  waterLevel: number, 
  pipePressure: number,
  setPoint: number = 0.35
): { runningPumps: number; frequency: number; startStandby: boolean } {
  const pressureError = setPoint - pipePressure;
  
  let runningPumps = 2;
  let frequency = 50;
  let startStandby = false;
  
  if (pressureError > 0.05) {
    runningPumps = Math.min(4, runningPumps + 1);
    frequency = Math.min(55, frequency + 5);
    if (pressureError > 0.1) startStandby = true;
  } else if (pressureError < -0.05) {
    runningPumps = Math.max(1, runningPumps - 1);
    frequency = Math.max(40, frequency - 5);
  }
  
  if (waterLevel < 1.0) {
    runningPumps = Math.max(1, runningPumps - 1);
  }
  
  return { runningPumps, frequency, startStandby };
}

export function checkWaterQuality(
  turbidity: number, 
  pH: number, 
  residualChlorine: number
): { status: 'normal' | 'warning' | 'alarm'; issues: string[] } {
  const issues: string[] = [];
  
  if (turbidity > 3.0) issues.push('浊度严重超标');
  else if (turbidity > 1.5) issues.push('浊度偏高');
  
  if (pH < 6.0 || pH > 9.0) issues.push('pH值严重超标');
  else if (pH < 6.5 || pH > 8.5) issues.push('pH值偏离正常范围');
  
  if (residualChlorine < 0.05) issues.push('余氯严重不足');
  else if (residualChlorine > 4.0) issues.push('余氯超标');
  else if (residualChlorine < 0.3) issues.push('余氯偏低');
  
  if (issues.some(i => i.includes('严重'))) {
    return { status: 'alarm', issues };
  } else if (issues.length > 0) {
    return { status: 'warning', issues };
  }
  
  return { status: 'normal', issues };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
