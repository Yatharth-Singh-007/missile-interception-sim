import { create } from 'zustand';

export const useSimStore = create((set, get) => ({
    connected: false,
    status: 'idle', // idle, active, finished
    time: 0,
    targets: [],
    interceptors: [],
    
    targetProfile: 'linear',
    guidanceMode: 'pn',
    targetVelocity: 300.0,
    interceptorVelocity: 1500.0,
    timeScale: 5.0,
    
    setTargetProfile: (val) => set({ targetProfile: val }),
    setGuidanceMode: (val) => set({ guidanceMode: val }),
    setTargetVelocity: (val) => set({ targetVelocity: val }),
    setInterceptorVelocity: (val) => set({ interceptorVelocity: val }),
    setTimeScale: (ts) => set({ timeScale: ts }),
    
    updateTelemetry: (data) => set({
        status: data.status,
        time: data.time,
        targets: data.targets || [],
        interceptors: data.interceptors || [],
    }),
    
    setConnected: (status) => set({ connected: status }),
}));
