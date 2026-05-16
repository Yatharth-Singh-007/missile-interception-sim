import React from 'react';
import { useSimStore } from '../store/useSimStore';

export function ControlPanel() {
    const { threatType, nConstant, timeScale, setThreatType, setNConstant, setTimeScale, status } = useSimStore();

    const startSimulation = async () => {
        try {
            await fetch('http://localhost:8000/api/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    threat_type: threatType,
                    n_constant: parseFloat(nConstant),
                    time_scale: parseFloat(timeScale)
                })
            });
        } catch (e) {
            console.error("Failed to start simulation:", e);
        }
    };

    const stopSimulation = async () => {
        try {
            await fetch('http://localhost:8000/api/stop', { method: 'POST' });
        } catch (e) {
            console.error("Failed to stop simulation:", e);
        }
    };

    return (
        <div style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={inputGroup}>
                    <label>THREAT PROFILE</label>
                    <select value={threatType} onChange={e => setThreatType(e.target.value)} style={inputStyle}>
                        <option value="cruise">CRUISE MISSILE</option>
                        <option value="srbm">SRBM</option>
                        <option value="marv">MaRV</option>
                    </select>
                </div>

                <div style={inputGroup}>
                    <label>APN GAIN (N)</label>
                    <input 
                        type="number" step="0.1" min="1.0" max="10.0"
                        value={nConstant} 
                        onChange={e => setNConstant(e.target.value)} 
                        style={inputStyle}
                    />
                </div>

                <div style={{...inputGroup, width: '200px'}}>
                    <label>TIME WARP: {timeScale}x</label>
                    <input 
                        type="range" min="1" max="20" step="1"
                        value={timeScale} 
                        onChange={async e => {
                            const val = e.target.value;
                            setTimeScale(val);
                            if (status === 'ACTIVE') {
                                try {
                                    await fetch('http://localhost:8000/api/timescale', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ time_scale: parseFloat(val) })
                                    });
                                } catch (err) {
                                    console.error("Failed to update time scale:", err);
                                }
                            }
                        }} 
                        style={sliderStyle}
                    />
                </div>

                <div style={{display: 'flex', gap: '15px'}}>
                    <button onClick={startSimulation} style={btnLaunch}>ENGAGE</button>
                    <button onClick={stopSimulation} style={btnAbort}>ABORT</button>
                </div>
            </div>
        </div>
    );
}

const panelStyle = {
    position: 'absolute',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80%',
    maxWidth: '900px',
    background: 'rgba(5, 10, 20, 0.65)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 240, 255, 0.3)',
    borderTop: '2px solid #00F0FF',
    color: '#00F0FF',
    fontFamily: '"Rajdhani", sans-serif',
    padding: '20px 30px',
    zIndex: 10,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(0, 240, 255, 0.05)',
    borderRadius: '8px',
    pointerEvents: 'auto'
};

const inputGroup = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '1px'
};

const inputStyle = {
    background: 'rgba(0,0,0,0.5)',
    color: '#FFF',
    border: '1px solid rgba(0, 240, 255, 0.5)',
    padding: '8px 12px',
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '14px',
    outline: 'none',
    borderRadius: '4px',
    transition: 'all 0.3s ease'
};

const sliderStyle = {
    accentColor: '#00F0FF',
    width: '100%'
};

const btnStyle = {
    fontFamily: '"Orbitron", sans-serif',
    fontWeight: 'bold',
    fontSize: '16px',
    padding: '10px 30px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    letterSpacing: '2px'
};

const btnLaunch = {
    ...btnStyle,
    background: 'rgba(0, 240, 255, 0.1)',
    color: '#00F0FF',
    border: '1px solid #00F0FF',
    boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)'
};

const btnAbort = {
    ...btnStyle,
    background: 'rgba(255, 0, 60, 0.1)',
    color: '#FF003C',
    border: '1px solid #FF003C',
    boxShadow: '0 0 10px rgba(255, 0, 60, 0.2)'
};
