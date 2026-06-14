import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, User, Shield, Crown, Scan, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import type { UserRole } from '../types';

const roleCards = [
  {
    role: 'operator' as UserRole,
    name: '值班员',
    description: '实时监控、数据查看、报警确认',
    icon: User,
    color: 'cyan',
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    role: 'supervisor' as UserRole,
    name: '班长',
    description: '设备管理、生产报表、应急处理',
    icon: Shield,
    color: 'purple',
    gradient: 'from-purple-400 to-pink-500',
  },
  {
    role: 'manager' as UserRole,
    name: '厂长',
    description: '系统设置、权限管理、全局调度',
    icon: Crown,
    color: 'amber',
    gradient: 'from-amber-400 to-orange-500',
  },
];

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showFace, setShowFace] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const { login, isFaceScanning, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (isFaceScanning && showFace) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 40);
      return () => clearInterval(interval);
    }
  }, [isFaceScanning, showFace]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowFace(true);
    setScanProgress(0);
  };

  const handleStartScan = async () => {
    if (!selectedRole) return;
    const success = await login(selectedRole);
    if (success) {
      setTimeout(() => navigate('/'), 500);
    }
  };

  const handleBack = () => {
    setShowFace(false);
    setSelectedRole(null);
    setScanProgress(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-950 flex items-center justify-center p-8 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-cyan-500/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-cyan-500/5 rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-2xl shadow-cyan-500/30 mb-6">
            <Droplets className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-wider" style={{ fontFamily: "'Orbitron', sans-serif" }}>
            3D智慧水厂可视化平台
          </h1>
          <p className="text-cyan-400/80 text-lg">Smart Water Plant 3D Visualization Platform</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            系统运行正常 · 请选择身份登录
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showFace ? (
            <motion.div
              key="roles"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {roleCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.button
                    key={card.role}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleSelect(card.role)}
                    className="group relative p-8 bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 hover:border-cyan-500/50 transition-all duration-300 overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                    
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">{card.name}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{card.description}</p>
                    
                    <div className="mt-6 flex items-center gap-2 text-cyan-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Scan className="w-4 h-4" />
                      点击进入人脸识别
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="face-scan"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="max-w-lg mx-auto"
            >
              <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-8">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handleBack}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center gap-2"
                  >
                    ← 返回选择
                  </button>
                  <div className={`px-3 py-1 rounded-full text-xs ${
                    selectedRole === 'operator' ? 'bg-cyan-500/20 text-cyan-400' :
                    selectedRole === 'supervisor' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {roleCards.find(r => r.role === selectedRole)?.name}
                  </div>
                </div>

                <div className="relative aspect-square max-w-sm mx-auto mb-8">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/30 overflow-hidden">
                    <img
                      src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20portrait%20of%20asian%20engineer%20neutral%20expression%20facing%20camera%20dark%20blue%20tech%20background&image_size=square"
                      alt="人脸识别"
                      className="w-full h-full object-cover opacity-80"
                    />
                    
                    {isFaceScanning && (
                      <>
                        <div 
                          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                          style={{
                            animation: 'scanLine 2s ease-in-out infinite',
                            top: `${scanProgress}%`,
                          }}
                        />
                        <div className="absolute inset-0 border-4 border-cyan-400/50 rounded-3xl">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl" />
                        </div>
                      </>
                    )}
                  </div>

                  {scanProgress === 100 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-12 h-12 rounded-full bg-green-500 flex items-center justify-center"
                    >
                      <CheckCircle className="w-8 h-8 text-white" />
                    </motion.div>
                  )}
                </div>

                <div className="text-center mb-6">
                  {isFaceScanning ? (
                    <>
                      <div className="flex items-center justify-center gap-2 text-cyan-400 mb-2">
                        <Eye className="w-5 h-5 animate-pulse" />
                        <span className="font-medium">正在识别面部特征...</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${scanProgress}%` }}
                          transition={{ duration: 0.1 }}
                        />
                      </div>
                      <p className="text-slate-400 text-sm mt-2">{scanProgress}% · 请保持面部在识别框内</p>
                    </>
                  ) : scanProgress === 100 ? (
                    <div className="text-green-400">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="font-medium">识别成功！正在进入系统...</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-medium mb-1">准备就绪</p>
                      <p className="text-slate-400 text-sm">请点击下方按钮开始人脸识别</p>
                    </div>
                  )}
                </div>

                {!isFaceScanning && scanProgress < 100 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStartScan}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-2xl shadow-lg shadow-cyan-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Scan className="w-5 h-5" />
                    开始人脸识别
                  </motion.button>
                )}

                <div className="mt-6 flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-400 font-medium mb-1">安全提示</p>
                    <p className="text-slate-400">所有操作将被记录，仅供本人使用。系统已启用操作日志审计功能。</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8 text-slate-500 text-sm"
        >
          <p>© 2024 智慧水务科技有限公司 · 版本 v2.0.1</p>
        </motion.div>
      </div>

      <style>{`
        @keyframes scanLine {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
