import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wrench, Clock, AlertTriangle, CheckCircle, Package, Play, RotateCcw, Filter, Search, User } from 'lucide-react';
import { useEquipmentStore } from '../store/useEquipmentStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDateTime, formatHours } from '../utils/formatters';
import type { EquipmentType, WorkOrderType, WorkOrderStatus } from '../types';

type FilterType = 'all' | EquipmentType;
type WorkOrderFilter = 'all' | WorkOrderStatus;

export default function EquipmentManagement() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'workorders'>('equipment');
  const [equipmentFilter, setEquipmentFilter] = useState<FilterType>('all');
  const [workOrderFilter, setWorkOrderFilter] = useState<WorkOrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { equipment, workOrders, updateWorkOrder, completeWorkOrder } = useEquipmentStore();
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const filteredEquipment = equipment.filter(eq => {
    const matchesType = equipmentFilter === 'all' || eq.type === equipmentFilter;
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          eq.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredWorkOrders = workOrders.filter(wo => {
    const matchesStatus = workOrderFilter === 'all' || wo.status === workOrderFilter;
    const matchesSearch = wo.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          wo.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400 bg-green-500/20 border-green-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'maintenance': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getHealthText = (status: string) => {
    switch (status) {
      case 'good': return '正常';
      case 'warning': return '预警';
      case 'maintenance': return '需检修';
      default: return '未知';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dosingPump': return '🧪';
      case 'blower': return '💨';
      case 'pump': return '⚡';
      case 'valve': return '🔧';
      default: return '🏭';
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'dosingPump': return '加药泵';
      case 'blower': return '鼓风机';
      case 'pump': return '水泵';
      case 'valve': return '阀门';
      default: return '其他';
    }
  };

  const getWorkOrderTypeIcon = (type: WorkOrderType) => {
    switch (type) {
      case 'maintenance': return '🔧';
      case 'repair': return '🛠️';
      case 'inspection': return '🔍';
      default: return '📋';
    }
  };

  const getWorkOrderTypeName = (type: WorkOrderType) => {
    switch (type) {
      case 'maintenance': return '保养';
      case 'repair': return '维修';
      case 'inspection': return '巡检';
      default: return '其他';
    }
  };

  const getWorkOrderStatusColor = (status: WorkOrderStatus) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20';
      case 'inProgress': return 'text-blue-400 bg-blue-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getWorkOrderStatusText = (status: WorkOrderStatus) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'inProgress': return '处理中';
      case 'completed': return '已完成';
      default: return '未知';
    }
  };

  const handleStartWork = (orderId: string) => {
    updateWorkOrder(orderId, { status: 'inProgress' });
  };

  const handleCompleteWork = (orderId: string) => {
    completeWorkOrder(orderId);
  };

  const stats = {
    total: equipment.length,
    good: equipment.filter(e => e.healthStatus === 'good').length,
    warning: equipment.filter(e => e.healthStatus === 'warning').length,
    maintenance: equipment.filter(e => e.healthStatus === 'maintenance').length,
    pendingOrders: workOrders.filter(o => o.status === 'pending').length,
    inProgressOrders: workOrders.filter(o => o.status === 'inProgress').length,
  };

  if (!isAuthenticated) return null;

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
                设备管理中心
              </h1>
              <p className="text-slate-400 text-sm mt-1">设备状态监控、保养管理与工单调度</p>
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
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8"
        >
          <div className="p-4 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-xs">设备总数</span>
            </div>
            <p className="text-2xl font-bold text-white font-mono">{stats.total}</p>
          </div>
          <div className="p-4 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-slate-400 text-xs">运行正常</span>
            </div>
            <p className="text-2xl font-bold text-green-400 font-mono">{stats.good}</p>
          </div>
          <div className="p-4 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-400 text-xs">预警状态</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400 font-mono">{stats.warning}</p>
          </div>
          <div className="p-4 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <RotateCcw className="w-4 h-4 text-red-400" />
              <span className="text-slate-400 text-xs">需检修</span>
            </div>
            <p className="text-2xl font-bold text-red-400 font-mono">{stats.maintenance}</p>
          </div>
          <div className="p-4 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-yellow-400" />
              <span className="text-slate-400 text-xs">待处理工单</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400 font-mono">{stats.pendingOrders}</p>
          </div>
          <div className="p-4 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400 text-xs">处理中</span>
            </div>
            <p className="text-2xl font-bold text-blue-400 font-mono">{stats.inProgressOrders}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden mb-6"
        >
          <div className="p-6 border-b border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('equipment')}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === 'equipment'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    设备列表
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('workorders')}
                  className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                    activeTab === 'workorders'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    检修工单
                    {stats.pendingOrders > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                        {stats.pendingOrders}
                      </span>
                    )}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="搜索设备名称或位置..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                {activeTab === 'equipment' ? (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    {(['all', 'dosingPump', 'blower', 'pump', 'valve'] as FilterType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setEquipmentFilter(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          equipmentFilter === type
                            ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                            : 'bg-slate-800/50 text-slate-400 hover:text-white'
                        }`}
                      >
                        {type === 'all' ? '全部' : getTypeName(type)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    {(['all', 'pending', 'inProgress', 'completed'] as WorkOrderFilter[]).map((status) => (
                      <button
                        key={status}
                        onClick={() => setWorkOrderFilter(status)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          workOrderFilter === status
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                            : 'bg-slate-800/50 text-slate-400 hover:text-white'
                        }`}
                      >
                        {status === 'all' ? '全部' : getWorkOrderStatusText(status)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'equipment' ? (
                <motion.div
                  key="equipment"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filteredEquipment.map((eq, index) => (
                    <motion.div
                      key={eq.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-cyan-500/30 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{getTypeIcon(eq.type)}</span>
                          <div>
                            <h3 className="text-white font-medium">{eq.name}</h3>
                            <p className="text-slate-500 text-xs">{getTypeName(eq.type)}</p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getHealthColor(eq.healthStatus)}`}>
                          {getHealthText(eq.healthStatus)}
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">安装位置</span>
                          <span className="text-slate-300">{eq.location}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">累计运行</span>
                          <span className="text-white font-mono">{formatHours(eq.runningHours)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">保养阈值</span>
                          <span className="text-slate-300 font-mono">{formatHours(eq.maintenanceThreshold)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">上次保养</span>
                          <span className="text-slate-300 text-xs">{formatDateTime(eq.lastMaintenance)}</span>
                        </div>

                        <div className="pt-2">
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-500">保养进度</span>
                            <span className={eq.runningHours >= eq.maintenanceThreshold ? 'text-red-400' : eq.runningHours >= eq.maintenanceThreshold * 0.9 ? 'text-yellow-400' : 'text-cyan-400'}>
                              {((eq.runningHours / eq.maintenanceThreshold) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                eq.runningHours >= eq.maintenanceThreshold ? 'bg-gradient-to-r from-red-500 to-red-400' :
                                eq.runningHours >= eq.maintenanceThreshold * 0.9 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                'bg-gradient-to-r from-cyan-500 to-blue-500'
                              }`}
                              style={{ width: `${Math.min((eq.runningHours / eq.maintenanceThreshold) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {eq.healthStatus === 'maintenance' && (
                        <div className="mt-4 px-3 py-2 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          已超过保养阈值，请立即安排检修
                        </div>
                      )}
                      {eq.healthStatus === 'warning' && (
                        <div className="mt-4 px-3 py-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20 text-yellow-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          即将到达保养阈值，请提前安排保养计划
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="workorders"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {filteredWorkOrders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-purple-500/30 transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{getWorkOrderTypeIcon(order.type)}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-white font-medium">{order.equipmentName}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getWorkOrderStatusColor(order.status)}`}>
                                  {getWorkOrderStatusText(order.status)}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                                  {getWorkOrderTypeName(order.type)}
                                </span>
                              </div>
                              <p className="text-slate-500 text-xs mt-0.5">创建时间: {formatDateTime(order.createTime)}</p>
                            </div>
                          </div>
                          
                          <p className="text-slate-300 text-sm mb-3">{order.description}</p>
                          
                          {order.spareParts.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Package className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                              <div className="flex flex-wrap gap-2">
                                {order.spareParts.map((part, i) => (
                                  <span key={i} className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-300">
                                    {part}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex md:flex-col gap-2">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleStartWork(order.id)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              开始处理
                            </button>
                          )}
                          {order.status === 'inProgress' && (
                            <button
                              onClick={() => handleCompleteWork(order.id)}
                              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white text-sm font-medium rounded-xl transition-all flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              完成工单
                            </button>
                          )}
                          {order.status === 'completed' && (
                            <div className="px-4 py-2 bg-green-500/10 text-green-400 text-sm font-medium rounded-xl flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              已完成
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
