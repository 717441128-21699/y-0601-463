import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { useAlarmStore } from '../store/useAlarmStore';
import { formatTime } from '../utils/formatters';

export function AlarmPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { alarms, acknowledgeAlarm, acknowledgeAll, getUnacknowledgedCount } = useAlarmStore();
  
  const unacknowledgedCount = getUnacknowledgedCount();

  const getAlarmIcon = (level: string) => {
    switch (level) {
      case 'danger':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlarmColor = (level: string) => {
    switch (level) {
      case 'danger':
        return 'border-red-500/50 bg-red-500/10';
      case 'warning':
        return 'border-orange-500/50 bg-orange-500/10';
      default:
        return 'border-blue-500/50 bg-blue-500/10';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'danger':
        return '严重';
      case 'warning':
        return '警告';
      default:
        return '通知';
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-4 top-24 z-30 w-14 h-14 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20 hover:bg-slate-800/90 transition-colors group"
      >
        <Bell className="w-6 h-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
        {unacknowledgedCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {unacknowledgedCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-4 top-24 bottom-4 w-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 z-50 flex flex-col overflow-hidden"
            >
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    实时报警
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">共 {alarms.length} 条报警，{unacknowledgedCount} 条未处理</p>
                </div>
                <div className="flex gap-2">
                  {unacknowledgedCount > 0 && (
                    <button
                      onClick={acknowledgeAll}
                      className="px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      全部确认
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {alarms.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-slate-400">暂无报警信息</p>
                  </div>
                ) : (
                  alarms.map((alarm) => (
                    <motion.div
                      key={alarm.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-xl border ${getAlarmColor(alarm.level)} ${!alarm.acknowledged ? 'animate-pulse' : 'opacity-70'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          {getAlarmIcon(alarm.level)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                alarm.level === 'danger' ? 'bg-red-500/20 text-red-400' :
                                alarm.level === 'warning' ? 'bg-orange-500/20 text-orange-400' :
                                'bg-blue-500/20 text-blue-400'
                              }`}>
                                {getLevelText(alarm.level)}
                              </span>
                              <span className="text-xs text-slate-500">{alarm.type}</span>
                            </div>
                            <p className="text-sm text-white leading-relaxed">{alarm.message}</p>
                            <p className="text-xs text-slate-500 mt-2">{formatTime(alarm.timestamp)}</p>
                          </div>
                        </div>
                        {!alarm.acknowledged && (
                          <button
                            onClick={() => acknowledgeAlarm(alarm.id)}
                            className="px-3 py-1.5 text-xs bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg transition-colors whitespace-nowrap"
                          >
                            确认
                          </button>
                        )}
                        {alarm.acknowledged && (
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
