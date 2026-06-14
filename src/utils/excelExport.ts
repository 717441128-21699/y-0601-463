import * as XLSX from 'xlsx';
import type { DailyReport } from '../types';
import { formatDate, formatFlow, formatPercentage, formatEnergy } from './formatters';

export function exportDailyReport(report: DailyReport): void {
  const wb = XLSX.utils.book_new();
  
  const summaryData = [
    ['生产日报', formatDate(report.reportDate)],
    [],
    ['指标', '数值'],
    ['总处理水量', formatFlow(report.totalProcessedWater)],
    ['水质达标率', formatPercentage(report.waterQualityRate)],
    ['总能耗', formatEnergy(report.energyConsumption)],
  ];
  
  const segmentData = [
    [],
    ['各工艺段详细数据'],
    ['工艺段', '处理水量', '水质达标率', '能耗'],
    ...report.segmentData.map(seg => [
      seg.name,
      formatFlow(seg.processedWater),
      formatPercentage(seg.qualityRate),
      formatEnergy(seg.energy),
    ]),
  ];
  
  const wsData = [...summaryData, ...segmentData];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  ws['!cols'] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, '生产日报');
  
  const fileName = `水厂生产日报_${formatDate(report.reportDate)}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportWaterQualityData(
  data: { timestamp: number; flow: number; turbidity: number; pH: number; residualChlorine: number }[],
  poolName: string
): void {
  const wb = XLSX.utils.book_new();
  
  const wsData = [
    [`${poolName} - 24小时水质数据`],
    [],
    ['时间', '流量(m³/h)', '浊度(NTU)', 'pH值', '余氯(mg/L)'],
    ...data.map(d => [
      new Date(d.timestamp).toLocaleString(),
      d.flow.toFixed(2),
      d.turbidity.toFixed(2),
      d.pH.toFixed(2),
      d.residualChlorine.toFixed(2),
    ]),
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = [
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, '水质数据');
  
  const fileName = `${poolName}_水质数据_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
