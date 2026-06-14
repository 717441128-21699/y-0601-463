import { Droplets, Activity, Zap, Clock, User } from 'lucide-react';
import { useWaterPlantStore } from '../store/useWaterPlantStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatFlow, formatPercentage, formatEnergy, formatDateTime, getRoleName } from '../utils/formatters';

export function StatusBar() {
  const { pools, pumpHouseData, dosingSystems } = useWaterPlantStore();
  const { currentUser, logout } = useAuthStore();

  const totalFlow = pools
    .filter(p => p.type !== 'dosing' && p.type !== 'controlRoom')
    .reduce((sum, p) => sum + p.currentFlow, 0);

  const avgQuality = pools.length > 0 
    ? pools.filter(p => p.status === 'normal').length / pools.length 
    : 0;

  const totalEnergy = pumpHouseData.runningPumps * 150 + 
    dosingSystems.reduce((sum, d) => sum + d.actualDosage * 0.5, 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/20 z-30 px-6">
      <div className="h-full flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">总处理水量</p>
              <p className="text-lg font-bold text-white font-mono">{formatFlow(totalFlow)}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-700" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">水质达标率</p>
              <p className="text-lg font-bold text-white font-mono">{formatPercentage(avgQuality)}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-700" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">实时能耗</p>
              <p className="text-lg font-bold text-white font-mono">{formatEnergy(totalEnergy)}/h</p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-700" />

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">系统时间</p>
              <p className="text-sm font-bold text-white font-mono">{formatDateTime(Date.now())}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{currentUser?.name}</p>
              <p className="text-xs text-cyan-400">{currentUser ? getRoleName(currentUser.role) : ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-colors text-sm font-medium"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
