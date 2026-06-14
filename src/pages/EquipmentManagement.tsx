import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wrench, Clock, AlertTriangle, CheckCircle, Package, Play, RotateCcw,
  Filter, Search, User, Check, X, ChevronRight, Bell, PackageCheck, MapPin, Factory
} from 'lucide-react';
import { useEquipmentStore } from '../store/useEquipmentStore';
import { useAuthStore } from '../store/useAuthStore';
import { formatDateTime, formatHours } from '../utils/formatters';
import type { EquipmentType, WorkOrderType, WorkOrderStatus, SparePart } from '../types';
import { message } from 'antd';

type FilterType = 'all' | EquipmentType;
type WorkOrderFilter = 'all' | WorkOrderStatus;
type SparePartFilter = 'all' | string;

export default function EquipmentManagement() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'workorders' | 'spareparts'>('equipment');
  const [equipmentFilter, setEquipmentFilter] = useState<FilterType>('all');
  const [workOrderFilter, setWorkOrderFilter] = useState<WorkOrderFilter>('all');
  const [sparePartFilter, setSparePartFilter] = useState<SparePartFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    equipment, workOrders, spareParts, updateWorkOrder, completeWorkOrder,
    checkMaintenanceThresholds, notifySparePartsStorage
  } = useEquipmentStore();
  const { isAuthenticated, currentUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    checkMaintenanceThresholds();
  }, [checkMaintenanceThresholds]);

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

  const spareCategories = ['all', ...Array.from(new Set(spareParts.map(p => p.category)))];
  const filteredSpareParts = spareParts.filter(sp => {
    const matchesCategory = sparePartFilter === 'all' || sp.category === sparePartFilter;
    const matchesSearch = sp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sp.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
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
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'inProgress': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/30';
    }
  };

  const getWorkOrderStatusText = (status: WorkOrderStatus) => {
    switch (status) {
      case 'pending': return '待处理';
      case 'inProgress': return '处理中';
      case 'completed': return '已完成';
    }
  };

  const getStockColor = (part: SparePart) => {
    if (part.stock === 0) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (part.stock <= part.minStock) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    return 'text-green-400 bg-green-500/10 border-green-500/30';
  };

  const getStockText = (part: SparePart) => {
    if (part.stock === 0) return '缺货';
    if (part.stock <= part.minStock) return '低库存';
    return '充足';
  };

  const handleStartWork = (orderId: string) => {
    const order = workOrders.find(o => o.id === orderId);
    if (order) {
      if (!order.sparePartsNotified) {
        notifySparePartsStorage(orderId);
        message.info('已通知备件库准备所需备件');
      }
      updateWorkOrder(orderId, { status: 'inProgress' });
      message.success('工单已开始处理');
    }
  };

  const handleCompleteWork = (orderId: string) => {
    completeWorkOrder(orderId);
    message.success('工单已完成，设备状态已更新、运行小时已清零、备件状态已同步');
  };

  const handleNotifySpareParts = (orderId: string) => {
    notifySparePartsStorage(orderId);
    message.success('已通知备件库并扣减库存');
  };

  const tabConfig = [
    { key: 'equipment' as const, label: '设备列表', icon: Wrench, count: equipment.length },
    { key: 'workorders' as const, label: '检修工单', icon: ClipboardList, count: workOrders.length },
    { key: 'spareparts' as const, label: '备件库', icon: Package, count: spareParts.length },
  ];

  return (
    <div className="min-h-screen bg-[#0A1628] text-white">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Wrench className="w-7 h-7 text-cyan-400" />
              设备管理中心
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              监控设备健康状态、管理检修工单与备件库存
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 p-1 inline-flex mb-6">
          {tabConfig.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 rounded-xl transition-all flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-cyan-500/30' : 'bg-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="搜索设备名称、位置、描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
            />
          </div>
          
          {activeTab === 'equipment' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              {(['all', 'dosingPump', 'blower', 'pump', 'valve'] as FilterType[]).map(f => (
                <button
                  key={f}
                  onClick={() => setEquipmentFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                    equipmentFilter === f
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {f === 'all' ? '全部' : getTypeName(f)}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'workorders' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              {(['all', 'pending', 'inProgress', 'completed'] as WorkOrderFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setWorkOrderFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                    workOrderFilter === f
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {f === 'all' ? '全部' : getWorkOrderStatusText(f as WorkOrderStatus)}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'spareparts' && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              {spareCategories.slice(0, 6).map(f => (
                <button
                  key={f}
                  onClick={() => setSparePartFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                    sparePartFilter === f
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-800/60 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {f === 'all' ? '全部' : f}
                </button>
              ))}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'equipment' && (
            <motion.div
              key="equipment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filteredEquipment.map(eq => {
                const ratio = eq.runningHours / eq.maintenanceThreshold;
                const percent = Math.min(100, ratio * 100);
                const relatedOrders = workOrders.filter(o => o.equipmentId === eq.id && o.status !== 'completed');
                return (
                  <div
                    key={eq.id}
                    className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 p-5 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">
                          {getTypeIcon(eq.type)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{eq.name}</h3>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {eq.location}
                          </p>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-lg text-xs border font-medium ${getHealthColor(eq.healthStatus)}`}>
                        {getHealthText(eq.healthStatus)}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-slate-500">累计运行</span>
                          <span className="text-slate-300 font-mono">{formatHours(eq.runningHours)} / {formatHours(eq.maintenanceThreshold)}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              ratio >= 1 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                              ratio >= 0.9 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                              'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-500 mb-0.5">类型</p>
                          <p className="text-slate-300">{getTypeName(eq.type)}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 mb-0.5">上次保养</p>
                          <p className="text-slate-300 text-xs">{formatDateTime(eq.lastMaintenance).slice(0, 10)}</p>
                        </div>
                      </div>
                    </div>

                    {relatedOrders.length > 0 && (
                      <div className="pt-4 border-t border-slate-800">
                        <div className="text-xs text-slate-500 mb-2">待处理工单 ({relatedOrders.length})</div>
                        <div className="space-y-1.5">
                          {relatedOrders.slice(0, 2).map(o => (
                            <div key={o.id} className="flex items-center justify-between text-xs px-2 py-1.5 bg-slate-800/50 rounded-lg">
                              <span className="text-slate-300">{getWorkOrderTypeName(o.type)}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${getWorkOrderStatusColor(o.status)}`}>
                                {getWorkOrderStatusText(o.status)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'workorders' && (
            <motion.div
              key="workorders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {filteredWorkOrders.length === 0 ? (
                <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800">
                  <CheckCircle className="w-16 h-16 text-green-500/50 mx-auto mb-4" />
                  <p className="text-slate-400">暂无工单数据</p>
                </div>
              ) : (
                filteredWorkOrders.map(wo => (
                  <div
                    key={wo.id}
                    className={`bg-slate-900/60 backdrop-blur-xl rounded-2xl border p-6 transition-colors ${
                      wo.status === 'completed' ? 'border-green-500/20' :
                      wo.status === 'inProgress' ? 'border-blue-500/20' : 'border-yellow-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${
                          wo.status === 'completed' ? 'bg-green-500/10 border-green-500/30' :
                          wo.status === 'inProgress' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
                        }`}>
                          {getWorkOrderTypeIcon(wo.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-bold text-white">{wo.equipmentName}</h3>
                            <span className={`px-2.5 py-1 rounded-lg text-xs border font-medium ${getWorkOrderStatusColor(wo.status)}`}>
                              {getWorkOrderStatusText(wo.status)}
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 border border-slate-700">
                              {getWorkOrderTypeName(wo.type)}
                            </span>
                            {wo.sparePartsNotified ? (
                              <span className="px-2.5 py-1 rounded-lg text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                                <PackageCheck className="w-3 h-3" />
                                备件已通知
                              </span>
                            ) : wo.status !== 'completed' && wo.spareParts.length > 0 ? (
                              <button
                                onClick={() => handleNotifySpareParts(wo.id)}
                                className="px-2.5 py-1 rounded-lg text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1 hover:bg-orange-500/30 transition-colors"
                              >
                                <Bell className="w-3 h-3" />
                                通知备件库
                              </button>
                            ) : null}
                          </div>
                          <p className="text-sm text-slate-400 mb-3">{wo.description}</p>
                          <div className="flex gap-6 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              创建：{formatDateTime(wo.createTime)}
                            </span>
                            {wo.completedTime && (
                              <span className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                完成：{formatDateTime(wo.completedTime)}
                              </span>
                            )}
                            {wo.assignedTo && (
                              <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                负责人：{wo.assignedTo}
                              </span>
                            )}
                            {wo.notificationSentTime && (
                              <span className="flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5" />
                                备件通知：{formatDateTime(wo.notificationSentTime)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {wo.status === 'pending' && (
                          <button
                            onClick={() => handleStartWork(wo.id)}
                            className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/40 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                            <Play className="w-4 h-4" />
                            开始处理
                          </button>
                        )}
                        {wo.status === 'inProgress' && (
                          <button
                            onClick={() => handleCompleteWork(wo.id)}
                            className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/40 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            完成工单
                          </button>
                        )}
                        {wo.status === 'completed' && (
                          <div className="px-4 py-2 bg-green-500/10 text-green-400/70 rounded-xl text-sm flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            已归档
                          </div>
                        )}
                      </div>
                    </div>

                    {wo.spareParts.length > 0 && (
                      <div className="mt-5 pt-5 border-t border-slate-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Package className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-purple-400">所需备件清单</span>
                          <span className="text-xs text-slate-500">({wo.spareParts.length}项)</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {wo.spareParts.map((part, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border text-xs ${
                                part.available
                                  ? 'bg-green-500/5 border-green-500/20'
                                  : 'bg-red-500/5 border-red-500/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="font-medium text-white">{part.name}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                  part.available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                  {part.available ? '库存充足' : '库存不足'}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span>需 {part.quantity}{part.unit}</span>
                                <span>库 {part.stock}{part.unit}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'spareparts' && (
            <motion.div
              key="spareparts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/40">
                      <th className="px-5 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">备件名称</th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">分类</th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">库存</th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">最低库存</th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">状态</th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">存放位置</th>
                      <th className="px-5 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">供应商</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredSpareParts.map(part => (
                      <tr key={part.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">
                              <Package className="w-4 h-4 text-cyan-400" />
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm">{part.name}</div>
                              <div className="text-xs text-slate-500">{part.id} · 单位：{part.unit}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1.5 inline-flex">
                            <Factory className="w-3 h-3" />
                            {part.category}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-center">
                            <span className={`font-mono font-bold text-lg ${
                              part.stock === 0 ? 'text-red-400' :
                              part.stock <= part.minStock ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {part.stock}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-slate-400 font-mono text-sm">{part.minStock}{part.unit}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs border font-medium inline-flex items-center gap-1.5 ${getStockColor(part)}`}>
                            {part.stock === 0 ? <X className="w-3 h-3" /> :
                             part.stock <= part.minStock ? <AlertTriangle className="w-3 h-3" /> :
                             <Check className="w-3 h-3" />}
                            {getStockText(part)}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400/70" />
                            {part.location}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="text-sm text-slate-400">{part.supplier}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredSpareParts.length === 0 && (
                <div className="text-center py-16">
                  <Package className="w-14 h-14 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-500">暂无备件数据</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ClipboardList(props: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}
