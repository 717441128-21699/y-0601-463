import type { WaterQualityData, DosingData, PumpHouseData, DailyReport } from '../../types';
import { calculateOptimalDosage } from '../../utils/algorithms';

export function generate24HourHistory(poolId: string, baseData: {
  baseFlow: number;
  baseTurbidity: number;
  basePH: number;
  baseChlorine: number;
}): WaterQualityData[] {
  const data: WaterQualityData[] = [];
  const now = Date.now();
  
  for (let i = 24; i >= 0; i--) {
    const timestamp = now - i * 3600000;
    const hourFactor = 1 + 0.2 * Math.sin((24 - i) * Math.PI / 12);
    const randomFactor = 0.95 + Math.random() * 0.1;
    
    data.push({
      timestamp,
      flow: baseData.baseFlow * hourFactor * randomFactor,
      turbidity: Math.max(0.1, baseData.baseTurbidity * (0.9 + Math.random() * 0.2)),
      pH: baseData.basePH + (Math.random() - 0.5) * 0.2,
      residualChlorine: Math.max(0, baseData.baseChlorine * (0.85 + Math.random() * 0.3)),
    });
  }
  
  return data;
}

export const mockDosingSystems: DosingData[] = [
  {
    id: 'dosing-pac',
    name: 'PAC混凝剂投加系统',
    rawWaterTurbidity: 15.8,
    rawWaterFlow: 2430,
    calculatedDosage: calculateOptimalDosage(15.8, 2430),
    actualDosage: 86.5,
    status: 'normal',
    pipelineFlow: 85,
  },
  {
    id: 'dosing-pam',
    name: 'PAM助凝剂投加系统',
    rawWaterTurbidity: 15.8,
    rawWaterFlow: 2430,
    calculatedDosage: 12.5,
    actualDosage: 12.3,
    status: 'normal',
    pipelineFlow: 12,
  },
  {
    id: 'dosing-chlorine',
    name: '次氯酸钠消毒系统',
    rawWaterTurbidity: 0.28,
    rawWaterFlow: 2350,
    calculatedDosage: 25.8,
    actualDosage: 28.5,
    status: 'over',
    pipelineFlow: 28,
  },
];

export const mockPumpHouseData: PumpHouseData = {
  waterLevel: 3.25,
  pipePressure: 0.34,
  runningPumps: 3,
  totalPumps: 5,
  frequency: 48.5,
  standbyPumpOn: false,
  valveStatus: {
    'valve-intake-outlet': 'open',
    'valve-sed1-outlet': 'open',
    'valve-sed2-outlet': 'open',
    'valve-filter1-outlet': 'open',
    'valve-filter2-outlet': 'open',
    'valve-filter3-outlet': 'open',
    'valve-filter4-outlet': 'open',
    'valve-clear-outlet': 'open',
    'valve-main-pump': 'open',
    'valve-standby-pump': 'closed',
    'valve-delivery': 'open',
  },
};

export function generateDailyReport(date: string): DailyReport {
  const segments = [
    { name: '原水取水', processedWater: 58500, qualityRate: 0.98, energy: 1250 },
    { name: '反应沉淀', processedWater: 57200, qualityRate: 0.95, energy: 2180 },
    { name: '过滤处理', processedWater: 56500, qualityRate: 0.99, energy: 3420 },
    { name: '清水消毒', processedWater: 56000, qualityRate: 0.995, energy: 1850 },
    { name: '送水出厂', processedWater: 55800, qualityRate: 0.998, energy: 4250 },
  ];
  
  return {
    reportDate: date,
    totalProcessedWater: 55800,
    waterQualityRate: 0.982,
    energyConsumption: 12950,
    segmentData: segments,
  };
}

export function generateMultipleDailyReports(days: number): DailyReport[] {
  const reports: DailyReport[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const report = generateDailyReport(dateStr);
    const variation = 0.95 + Math.random() * 0.1;
    
    reports.push({
      ...report,
      reportDate: dateStr,
      totalProcessedWater: Math.round(report.totalProcessedWater * variation),
      waterQualityRate: Math.min(0.999, report.waterQualityRate * (0.98 + Math.random() * 0.04)),
      energyConsumption: Math.round(report.energyConsumption * variation),
      segmentData: report.segmentData.map(seg => ({
        ...seg,
        processedWater: Math.round(seg.processedWater * variation),
        qualityRate: Math.min(0.999, seg.qualityRate * (0.98 + Math.random() * 0.04)),
        energy: Math.round(seg.energy * variation),
      })),
    });
  }
  
  return reports;
}
