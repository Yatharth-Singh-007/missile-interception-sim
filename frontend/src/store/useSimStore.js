import { create } from 'zustand';

export const useSimStore = create((set, get) => ({
    connected: false,
    status: 'idle', // idle, active, intercepted, ground_impact
    time: 0,
    target: { pos: [0, 0, 0], vel: [0, 0, 0], alt: 0 },
    interceptor: { pos: [0, 0, 0], vel: [0, 0, 0], alt: 0 },
    telemetry: { distance: 0, closing_velocity: 0, los_rate: 0 },
    
    threatType: 'cruise',
    nConstant: 4.0,
    timeScale: 5.0,
    
    setThreatType: (type) => set({ threatType: type }),
    setNConstant: (n) => set({ nConstant: n }),
    setTimeScale: (ts) => set({ timeScale: ts }),
    
    updateTelemetry: (data) => set({
        status: data.status,
        time: data.time,
        target: data.target,
        interceptor: data.interceptor,
        telemetry: data.telemetry,
    }),
    
    setConnected: (status) => set({ connected: status }),
}));
