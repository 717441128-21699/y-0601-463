import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings, Users, Shield, Bell, Database,
  Sliders, LogOut, Save, RotateCcw, Eye, User,
  Crown, ChevronDown, ChevronUp, Search, Download
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useWaterPlantStore } from '../store/useWaterPlantStore';
import { formatDateTime } from '../utils/formatters';
import type { UserRole } from '../types';

type SettingTab = 'system' | 'users' | 'alarms' | 'logs';

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<SettingTab>('system');
  const [expandedSection, setExpandedSection] = useState<string | null>('waterQuality');
  const [searchLogQuery, setSearchLogQuery] = useState('');
  
  const { isAuthenticated, currentUser, operationLogs, logout, addOperationLog } = useAuthStore();
  const { dosingSystems, pumpHouseData } = useWaterPlantStore();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    waterQuality: {
      turbidityMax: 1.0,
      phMin: 6.5,
      phMax: 8.5,
      residualChlorineMin: 0.3,
      residualChlorineMax: 0.5,
    },
    dosing: {
      pacDosageMin: 50,
      pacDosageMax: 150,
      pamDosageMin: 5,
      pamDosageMax: 20,
      chlorineDosageMin: 15,
      chlorineDosageMax: 40,
    },
    pump: {
      pressureSetPoint: 0.35,
      pressureMin: 0.25,
      waterLevelMin: 2.0,
      waterLevelMax: 4.5,
    },
    alarm: {
      soundEnabled: true,
      popupEnabled: true,
      autoAcknowledgeTimeout: 300,
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (currentUser && currentUser.role !== 'manager') {
      navigate('/');
    }
  }, [isAuthenticated, currentUser, navigate]);

  const filteredLogs = operationLogs.filter(log => {
    const matchesSearch = log.userName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
                          log.detail.toLowerCase().includes(searchLogQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSettingChange = (category: string, key: string, value: number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  const handleSaveSettings = () => {
    addOperationLog('系统设置', '修改了系统参数配置');
    alert('设置已保存！');
  };

  const handleResetSettings = () => {
    setSettings({
      waterQuality: {
        turbidityMax: 1.0,
        phMin: 6.5,
        phMax: 8.5,
        residualChlorineMin: 0.3,
        residualChlorineMax: 0.5,
      },
      dosing: {
        pacDosageMin: 50,
        pacDosageMax: 150,
        pamDosageMin: 5,
        pamDosageMax: 20,
        chlorineDosageMin: 15,
        chlorineDosageMax: 40,
      },
      pump: {
        pressureSetPoint: 0.35,
        pressureMin: 0.25,
        waterLevelMin: 2.0,
        waterLevelMax: 4.5,
      },
      alarm: {
        soundEnabled: true,
        popupEnabled: true,
        autoAcknowledgeTimeout: 300,
      },
    });
    addOperationLog('系统设置', '重置了系统参数配置为默认值');
    alert('设置已重置为默认值！');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'manager': return <Crown className="w-4 h-4" />;
      case 'supervisor': return <Shield className="w-4 h-4" />;
      case 'operator': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'manager': return 'text-amber-400 bg-amber-500/20';
      case 'supervisor': return 'text-purple-400 bg-purple-500/20';
      case 'operator': return 'text-cyan-400 bg-cyan-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'manager': return '厂长';
      case 'supervisor': return '班长';
      case 'operator': return '值班员';
      default: return '未知';
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const settingTabs = [
    { id: 'system' as SettingTab, label: '系统参数', icon: Sliders },
    { id: 'users' as SettingTab, label: '用户管理', icon: Users },
    { id: 'alarms' as SettingTab, label: '报警设置', icon: Bell },
    { id: 'logs' as SettingTab, label: '操作日志', icon: Database },
  ];

  const mockUsers = [
    { id: 'user-001', name: '张值班', role: 'operator' as UserRole, lastLogin: Date.now() - 86400000, status: '在线' },
    { id: 'user-002', name: '李班长', role: 'supervisor' as UserRole, lastLogin: Date.now() - 172800000, status: '在线' },
    { id: 'user-003', name: '王厂长', role: 'manager' as UserRole, lastLogin: Date.now() - 259200000, status: '在线' },
    { id: 'user-004', name: '刘值班', role: 'operator' as UserRole, lastLogin: Date.now() - 345600000, status: '离线' },
    { id: 'user-005', name: '陈班长', role: 'supervisor' as UserRole, lastLogin: Date.now() - 432000000, status: '离线' },
  ];

  if (!isAuthenticated || !currentUser || currentUser.role !== 'manager') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      
      <div className="max-w-6xl mx-auto px-6 py-8">
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
                系统设置
              </h1>
              <p className="text-slate-400 text-sm mt-1">系统参数配置、用户管理与操作日志</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="px-4 py-3 bg-slate-800/60 backdrop-blur rounded-2xl border border-slate-700/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{currentUser.name}</p>
                  <p className="text-slate-400 text-xs">厂长</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-2xl text-red-400 hover:text-red-300 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </motion.div>

        <div className="flex gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="w-56 flex-shrink-0"
          >
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-3 space-y-1">
              {settingTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <AnimatePresence mode="wait">
              {activeTab === 'system' && (
                <motion.div
                  key="system"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {[
                    {
                      id: 'waterQuality',
                      title: '水质参数阈值',
                      icon: Eye,
                      iconColor: 'text-cyan-400',
                      fields: [
                        { key: 'turbidityMax', label: '浊度上限 (NTU)', min: 0, max: 5, step: 0.1 },
                        { key: 'phMin', label: 'pH值下限', min: 5, max: 8, step: 0.1 },
                        { key: 'phMax', label: 'pH值上限', min: 7, max: 10, step: 0.1 },
                        { key: 'residualChlorineMin', label: '余氯下限 (mg/L)', min: 0, max: 1, step: 0.1 },
                        { key: 'residualChlorineMax', label: '余氯上限 (mg/L)', min: 0.3, max: 2, step: 0.1 },
                      ],
                    },
                    {
                      id: 'dosing',
                      title: '加药系统参数',
                      icon: Settings,
                      iconColor: 'text-orange-400',
                      fields: [
                        { key: 'pacDosageMin', label: 'PAC投加量下限 (kg/h)', min: 10, max: 100, step: 1 },
                        { key: 'pacDosageMax', label: 'PAC投加量上限 (kg/h)', min: 50, max: 300, step: 1 },
                        { key: 'pamDosageMin', label: 'PAM投加量下限 (kg/h)', min: 1, max: 10, step: 0.5 },
                        { key: 'pamDosageMax', label: 'PAM投加量上限 (kg/h)', min: 10, max: 50, step: 0.5 },
                        { key: 'chlorineDosageMin', label: '次氯酸钠投加量下限 (kg/h)', min: 5, max: 20, step: 0.5 },
                        { key: 'chlorineDosageMax', label: '次氯酸钠投加量上限 (kg/h)', min: 20, max: 80, step: 0.5 },
                      ],
                    },
                    {
                      id: 'pump',
                      title: '泵站运行参数',
                      icon: Sliders,
                      iconColor: 'text-blue-400',
                      fields: [
                        { key: 'pressureSetPoint', label: '管网压力设定值 (MPa)', min: 0.2, max: 0.6, step: 0.01 },
                        { key: 'pressureMin', label: '管网压力下限 (MPa)', min: 0.1, max: 0.4, step: 0.01 },
                        { key: 'waterLevelMin', label: '清水池水位下限 (m)', min: 1, max: 3, step: 0.1 },
                        { key: 'waterLevelMax', label: '清水池水位上限 (m)', min: 3, max: 6, step: 0.1 },
                      ],
                    },
                  ].map((section) => {
                    const Icon = section.icon;
                    const isExpanded = expandedSection === section.id;
                    return (
                      <div
                        key={section.id}
                        className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
                      >
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ${section.iconColor}`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-white font-medium">{section.title}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6 space-y-4">
                                {section.fields.map((field) => (
                                  <div key={field.key} className="grid grid-cols-3 gap-4 items-center">
                                    <label className="text-slate-300 text-sm col-span-1">{field.label}</label>
                                    <div className="col-span-1 flex items-center gap-3">
                                      <input
                                        type="range"
                                        min={field.min}
                                        max={field.max}
                                        step={field.step}
                                        value={settings[section.id as keyof typeof settings][field.key as keyof typeof settings.waterQuality] as number}
                                        onChange={(e) => handleSettingChange(section.id, field.key, parseFloat(e.target.value))}
                                        className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                                      />
                                    </div>
                                    <input
                                      type="number"
                                      min={field.min}
                                      max={field.max}
                                      step={field.step}
                                      value={settings[section.id as keyof typeof settings][field.key as keyof typeof settings.waterQuality] as number}
                                      onChange={(e) => handleSettingChange(section.id, field.key, parseFloat(e.target.value))}
                                      className="w-24 px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center font-mono text-sm focus:outline-none focus:border-cyan-500/50"
                                    />
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveSettings}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium rounded-2xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      保存设置
                    </button>
                    <button
                      onClick={handleResetSettings}
                      className="px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 font-medium rounded-2xl border border-slate-700/50 transition-all flex items-center gap-2"
                    >
                      <RotateCcw className="w-5 h-5" />
                      重置默认
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6"
                >
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-400" />
                    用户管理
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">用户</th>
                          <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">角色</th>
                          <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">状态</th>
                          <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">最后登录</th>
                          <th className="text-left py-4 px-4 text-slate-400 font-medium text-sm">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockUsers.map((user, index) => (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl ${
                                  user.role === 'manager' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                  user.role === 'supervisor' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                                  'bg-gradient-to-br from-cyan-400 to-blue-500'
                                } flex items-center justify-center text-white font-bold`}>
                                  {user.name.charAt(0)}
                                </div>
                                <span className="text-white font-medium">{user.name}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                {getRoleIcon(user.role)}
                                {getRoleName(user.role)}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                user.status === '在线'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-slate-500/20 text-slate-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  user.status === '在线' ? 'bg-green-400 animate-pulse' : 'bg-slate-400'
                                }`} />
                                {user.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-300 text-sm">
                              {formatDateTime(user.lastLogin)}
                            </td>
                            <td className="py-4 px-4">
                              <button className="text-cyan-400 hover:text-cyan-300 text-sm font-medium">
                                编辑权限
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeTab === 'alarms' && (
                <motion.div
                  key="alarms"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 space-y-6"
                >
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-cyan-400" />
                    报警设置
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">声音报警</h4>
                          <p className="text-slate-400 text-sm mt-1">报警时播放提示音</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('alarm', 'soundEnabled', !settings.alarm.soundEnabled)}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            settings.alarm.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                            settings.alarm.soundEnabled ? 'translate-x-8' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium">弹窗提醒</h4>
                          <p className="text-slate-400 text-sm mt-1">报警时显示弹窗提醒</p>
                        </div>
                        <button
                          onClick={() => handleSettingChange('alarm', 'popupEnabled', !settings.alarm.popupEnabled)}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            settings.alarm.popupEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                          }`}
                        >
                          <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                            settings.alarm.popupEnabled ? 'translate-x-8' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-white font-medium">自动确认超时</h4>
                          <p className="text-slate-400 text-sm mt-1">报警未处理自动确认时间（秒）</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={60}
                          max={600}
                          step={30}
                          value={settings.alarm.autoAcknowledgeTimeout}
                          onChange={(e) => handleSettingChange('alarm', 'autoAcknowledgeTimeout', parseInt(e.target.value))}
                          className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-500"
                        />
                        <span className="text-cyan-400 font-mono font-bold w-16 text-right">
                          {settings.alarm.autoAcknowledgeTimeout}s
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveSettings}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-medium rounded-2xl shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2"
                    >
                      <Save className="w-5 h-5" />
                      保存设置
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-cyan-400" />
                      操作日志
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="搜索操作记录..."
                          value={searchLogQuery}
                          onChange={(e) => setSearchLogQuery(e.target.value)}
                          className="w-64 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors text-sm"
                        />
                      </div>
                      <button className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 text-sm rounded-xl border border-slate-700/50 transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        导出日志
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log, index) => (
                        <motion.div
                          key={log.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.02 }}
                          className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:border-cyan-500/20 transition-all"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${getRoleColor(log.userRole)}`}>
                                {getRoleIcon(log.userRole)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{log.userName}</span>
                                  <span className={`px-1.5 py-0.5 rounded text-xs ${getRoleColor(log.userRole)}`}>
                                    {getRoleName(log.userRole)}
                                  </span>
                                </div>
                                <p className="text-slate-300 text-sm mt-1">
                                  <span className="text-cyan-400 font-medium">{log.action}</span>
                                  <span className="text-slate-500 mx-2">·</span>
                                  {log.detail}
                                </p>
                              </div>
                            </div>
                            <span className="text-slate-500 text-xs whitespace-nowrap">
                              {formatDateTime(log.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-500">
                        <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>暂无操作日志</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
