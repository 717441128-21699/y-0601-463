import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { WaterQualityData } from '../types';
import { formatTime } from '../utils/formatters';
import { useWaterPlantStore } from '../store/useWaterPlantStore';

interface TrendChartProps {
  poolId: string;
  data?: WaterQualityData[];
  poolName?: string;
  onExport?: () => void;
  onClose?: () => void;
  height?: string;
}

export function TrendChart({ poolId, data: propData, poolName: propPoolName, onExport, onClose, height = '100%' }: TrendChartProps) {
  const { getPoolHistory, pools } = useWaterPlantStore();
  
  const pool = pools.find(p => p.id === poolId);
  const data = propData || getPoolHistory(poolId);
  const poolName = propPoolName || pool?.name || '';
  const option = useMemo(() => {
    const times = data.map(d => formatTime(d.timestamp));
    
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(0, 212, 255, 0.3)',
        borderWidth: 1,
        textStyle: { color: '#fff' },
        axisPointer: {
          type: 'cross',
          lineStyle: { color: 'rgba(0, 212, 255, 0.5)' },
        },
      },
      legend: {
        data: ['流量', '浊度', 'pH', '余氯'],
        textStyle: { color: '#94a3b8' },
        top: 10,
        itemWidth: 12,
        itemHeight: 12,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 10 },
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: 'value',
          name: '流量(m³/h)',
          position: 'left',
          axisLine: { lineStyle: { color: '#00D4FF' } },
          axisLabel: { color: '#64748b', fontSize: 10 },
          splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
        },
        {
          type: 'value',
          name: '浊度(NTU)',
          position: 'right',
          offset: 60,
          axisLine: { lineStyle: { color: '#FFA502' } },
          axisLabel: { color: '#64748b', fontSize: 10 },
          splitLine: { show: false },
        },
        {
          type: 'value',
          name: 'pH',
          position: 'right',
          axisLine: { lineStyle: { color: '#2ED573' } },
          axisLabel: { color: '#64748b', fontSize: 10 },
          splitLine: { show: false },
          min: 6,
          max: 9,
        },
        {
          type: 'value',
          name: '余氯(mg/L)',
          position: 'left',
          offset: 60,
          axisLine: { lineStyle: { color: '#1E90FF' } },
          axisLabel: { color: '#64748b', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '流量',
          type: 'line',
          yAxisIndex: 0,
          data: data.map(d => d.flow.toFixed(1)),
          smooth: true,
          lineStyle: { color: '#00D4FF', width: 2 },
          itemStyle: { color: '#00D4FF' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 212, 255, 0.3)' },
                { offset: 1, color: 'rgba(0, 212, 255, 0)' },
              ],
            },
          },
        },
        {
          name: '浊度',
          type: 'line',
          yAxisIndex: 1,
          data: data.map(d => d.turbidity.toFixed(2)),
          smooth: true,
          lineStyle: { color: '#FFA502', width: 2 },
          itemStyle: { color: '#FFA502' },
        },
        {
          name: 'pH',
          type: 'line',
          yAxisIndex: 2,
          data: data.map(d => d.pH.toFixed(2)),
          smooth: true,
          lineStyle: { color: '#2ED573', width: 2 },
          itemStyle: { color: '#2ED573' },
        },
        {
          name: '余氯',
          type: 'line',
          yAxisIndex: 3,
          data: data.map(d => d.residualChlorine.toFixed(2)),
          smooth: true,
          lineStyle: { color: '#1E90FF', width: 2 },
          itemStyle: { color: '#1E90FF' },
        },
      ],
    };
  }, [data]);

  const chartContent = (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      opts={{ renderer: 'canvas' }}
    />
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8" onClick={onClose}>
        <div 
          className="bg-slate-900/95 rounded-2xl border border-cyan-500/30 w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl shadow-cyan-500/20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{poolName} - 24小时趋势曲线</h2>
              <p className="text-slate-400 text-sm mt-1">实时水质参数变化趋势</p>
            </div>
            <div className="flex gap-3">
              {onExport && (
                <button
                  onClick={onExport}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25"
                >
                  导出数据
                </button>
              )}
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
          <div className="p-6 h-[60vh]">
            {chartContent}
          </div>
        </div>
      </div>
    );
  }

  return chartContent;
}
