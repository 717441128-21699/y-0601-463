import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Calendar, TrendingUp, Droplets, Zap, CheckCircle, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { generateDailyReport, generateMultipleDailyReports } from '../services/mock/waterQuality';
import { exportDailyReport } from '../utils/excelExport';
import { formatDate, formatFlow, formatPercentage, formatEnergy, formatDateTime } from '../utils/formatters';
import dayjs from 'dayjs';
import type { DailyReport } from '../types';

export default function ProductionReport() {
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [currentReport, setCurrentReport] = useState<DailyReport | null>(null);
  const [reportHistory, setReportHistory] = useState<DailyReport[]>([]);
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const report = generateDailyReport(selectedDate);
    setCurrentReport(report);

    const history = generateMultipleDailyReports(7);
    setReportHistory(history);
  }, [isAuthenticated, navigate, selectedDate]);

  const handleExport = () => {
    if (currentReport) {
      exportDailyReport(currentReport);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  if (!isAuthenticated || !currentReport) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-12 h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 hover:border-cyan-500/30 flex items-center justify-center text-slate-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wide" style={{ fontFamily: "'Orbitron', sans-serif" }}>
                生产日报中心
              </h1>
              <p className="text-slate-400 text-sm mt-1">各工艺段处理量、水质达标率与能耗统计</p>
            </div>
          </div>
          {currentUser && (
            <div className="px-4 py-3 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${
                currentUser.role === 'manager' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                currentUser.role === 'supervisor' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                'bg-gradient-to-br from-cyan-400 to-blue-500'
              } flex items-center justify-center text-white font-bold`}>
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{currentUser.name}</p>
                <p className="text-slate-400 text-xs">
                  {currentUser.role === 'manager' ? '厂长' : currentUser.role === 'supervisor' ? '班长' : '值班员'}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="lg:col-span-1 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              选择日期
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-400 text-sm mb-2">报表日期</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={dayjs().format('YYYY-MM-DD')}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">快捷选择</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '今天', offset: 0 },
                    { label: '昨天', offset: 1 },
                    { label: '前天', offset: 2 },
                    { label: '一周前', offset: 7 },
                  ].map((item) => (
                    <button
                      key={item.offset}
                      onClick={() => setSelectedDate(dayjs().subtract(item.offset, 'day').format('YYYY-MM-DD'))}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedDate === dayjs().subtract(item.offset, 'day').format('YYYY-MM-DD')
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                          : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleExport}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-medium rounded-2xl shadow-lg shadow-green-500/25 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                导出Excel报表
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800">
              <h4 className="text-sm font-medium text-slate-300 mb-3">历史报表</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {reportHistory.map((report, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(report.reportDate)}
                    className={`w-full px-3 py-2 rounded-xl text-left text-sm transition-all ${
                      selectedDate === report.reportDate
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-800/30 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <div className="font-medium">{formatDate(report.reportDate)}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      处理量 {formatFlow(report.totalProcessedWater)} · 达标率 {formatPercentage(report.waterQualityRate)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      生产日报 · {formatDate(currentReport.reportDate)}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      生成时间: {formatDateTime(Date.now())}
                    </p>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm font-medium flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  已生成
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="p-5 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                      <Droplets className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-slate-400 text-sm">总处理水量</span>
                  </div>
                  <p className="text-4xl font-bold text-white font-mono">{formatFlow(currentReport.totalProcessedWater)}</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-slate-400 text-sm">水质达标率</span>
                  </div>
                  <p className="text-4xl font-bold text-white font-mono">{formatPercentage(currentReport.waterQualityRate)}</p>
                </div>

                <div className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-slate-400 text-sm">总能耗</span>
                  </div>
                  <p className="text-4xl font-bold text-white font-mono">{formatEnergy(currentReport.energyConsumption)}</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                各工艺段详细数据
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">工艺段</th>
                      <th className="text-right py-4 px-4 text-slate-400 font-medium text-sm">处理水量</th>
                      <th className="text-right py-4 px-4 text-slate-400 font-medium text-sm">水质达标率</th>
                      <th className="text-right py-4 px-4 text-slate-400 font-medium text-sm">能耗</th>
                      <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">运行状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReport.segmentData.map((segment, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                              index === 0 ? 'bg-blue-500/20' :
                              index === 1 ? 'bg-cyan-500/20' :
                              index === 2 ? 'bg-green-500/20' :
                              index === 3 ? 'bg-emerald-500/20' :
                              'bg-purple-500/20'
                            }`}>
                              {index === 0 ? '🌊' : index === 1 ? '💧' : index === 2 ? '🔍' : index === 3 ? '💦' : '⚡'}
                            </div>
                            <span className="text-white font-medium">{segment.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-cyan-400 font-mono font-medium">{formatFlow(segment.processedWater)}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={`font-mono font-medium ${
                            segment.qualityRate >= 0.99 ? 'text-green-400' :
                            segment.qualityRate >= 0.95 ? 'text-cyan-400' :
                            'text-yellow-400'
                          }`}>
                            {formatPercentage(segment.qualityRate)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-amber-400 font-mono font-medium">{formatEnergy(segment.energy)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                            运行正常
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                近7天趋势
              </h3>
              <div className="grid grid-cols-7 gap-3">
                {reportHistory.map((report, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all cursor-pointer"
                    onClick={() => setSelectedDate(report.reportDate)}
                  >
                    <p className="text-slate-400 text-xs mb-2">{formatDate(report.reportDate)}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-slate-500 text-xs">水量</p>
                        <p className="text-cyan-400 font-mono font-bold">{(report.totalProcessedWater / 1000).toFixed(1)}k</p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">达标率</p>
                        <p className={`font-mono font-bold ${
                          report.waterQualityRate >= 0.98 ? 'text-green-400' :
                          report.waterQualityRate >= 0.95 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {(report.waterQualityRate * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs">能耗</p>
                        <p className="text-amber-400 font-mono font-bold">{(report.energyConsumption / 1000).toFixed(1)}k</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
