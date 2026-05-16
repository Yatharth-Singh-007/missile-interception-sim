import React, { useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryDashboard } from './components/TelemetryDashboard';
import { StatusOverlay } from './components/StatusOverlay';
import { useSimStore } from './store/useSimStore';
import Scene from './Scene';
import './App.css'; // Let's add animations here

function App() {
  const { updateTelemetry, setConnected } = useSimStore();

  useEffect(() => {
    let ws;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket('ws://localhost:8000/ws/telemetry');

      ws.onopen = () => {
        setConnected(true);
        console.log('WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateTelemetry(data);
      };

      ws.onclose = () => {
        setConnected(false);
        console.log('WebSocket disconnected, reconnecting...');
        reconnectTimer = setTimeout(connect, 1000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        ws.close();
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [updateTelemetry, setConnected]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#02050A', margin: 0, padding: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 10, pointerEvents: 'none' }}>
        <ControlPanel />
        <TelemetryDashboard />
        <StatusOverlay />
      </div>
      <Scene />
    </div>
  );
}

export default App;
