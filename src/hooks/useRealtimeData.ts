import { useEffect, useRef } from 'react';
import { useWaterPlantStore } from '../store/useWaterPlantStore';
import { useEquipmentStore } from '../store/useEquipmentStore';
import { useAlarmStore } from '../store/useAlarmStore';
import { checkWaterQuality } from '../utils/algorithms';

export function useRealtimeData() {
  const { simulateRealtimeUpdate, pools } = useWaterPlantStore();
  const { checkMaintenanceThresholds, equipment } = useEquipmentStore();
  const { addAlarm } = useAlarmStore();
  const intervalRef = useRef<number | null>(null);
  const lastAlarmCheck = useRef<number>(0);

  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      simulateRealtimeUpdate();
      
      const now = Date.now();
      if (now - lastAlarmCheck.current > 5000) {
        pools.forEach(pool => {
          if (pool.type === 'dosing' || pool.type === 'controlRoom') return;
          
          const quality = checkWaterQuality(pool.turbidity, pool.pH, pool.residualChlorine);
          
          if (quality.status === 'alarm' && quality.issues.length > 0) {
            quality.issues.forEach(issue => {
              addAlarm({
                level: 'danger',
                type: '水质异常',
                message: `${pool.name}: ${issue}`,
                sourcePoolId: pool.id,
              });
            });
          } else if (quality.status === 'warning' && quality.issues.length > 0) {
            quality.issues.forEach(issue => {
              addAlarm({
                level: 'warning',
                type: '水质预警',
                message: `${pool.name}: ${issue}`,
                sourcePoolId: pool.id,
              });
            });
          }
        });
        
        checkMaintenanceThresholds();
        
        equipment.forEach(eq => {
          if (eq.healthStatus === 'maintenance') {
            addAlarm({
              level: 'danger',
              type: '设备故障',
              message: `${eq.name}累计运行${eq.runningHours}小时，已超过保养阈值${eq.maintenanceThreshold}小时，需立即检修`,
            });
          } else if (eq.healthStatus === 'warning') {
            addAlarm({
              level: 'warning',
              type: '设备预警',
              message: `${eq.name}累计运行时间接近保养阈值 (${eq.runningHours}/${eq.maintenanceThreshold}小时)`,
            });
          }
        });
        
        lastAlarmCheck.current = now;
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [simulateRealtimeUpdate, pools, equipment, addAlarm, checkMaintenanceThresholds]);

  return null;
}
