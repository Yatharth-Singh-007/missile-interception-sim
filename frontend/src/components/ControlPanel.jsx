import React from 'react';
import { useSimStore } from '../store/useSimStore';

export function ControlPanel() {
    const {
        targetProfile, guidanceMode, targetVelocity, interceptorVelocity, timeScale, status,
        setTargetProfile, setGuidanceMode, setTargetVelocity, setInterceptorVelocity, setTimeScale
    } = useSimStore();

    const startSimulation = async () => {
        try {
            await fetch('http://localhost:8000/api/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_profile: targetProfile,
                    guidance_mode: guidanceMode,
                    target_velocity: parseFloat(targetVelocity),
                    interceptor_velocity: parseFloat(interceptorVelocity),
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>

                <div style={sectionStyle}>
                    <label style={labelStyle}>TARGET PROFILE</label>
                    <div style={radioGroupStyle}>
                        <label style={radioLabelStyle}>
                            <input
                                type="radio"
                                name="targetProfile"
                                value="linear"
                                checked={targetProfile === 'linear'}
                                onChange={e => setTargetProfile(e.target.value)}
                                style={radioStyle}
                            />
                            LINEAR
                        </label>
                        <label style={radioLabelStyle}>
                            <input
                                type="radio"
                                name="targetProfile"
                                value="zigzag"
                                checked={targetProfile === 'zigzag'}
                                onChange={e => setTargetProfile(e.target.value)}
                                style={radioStyle}
                            />
                            ZIGZAG
                        </label>
                    </div>
                </div>

                <div style={sectionStyle}>
                    <label style={labelStyle}>GUIDANCE MODE</label>
                    <div style={radioGroupStyle}>
                        <label style={radioLabelStyle}>
                            <input
                                type="radio"
                                name="guidanceMode"
                                value="los"
                                checked={guidanceMode === 'los'}
                                onChange={e => setGuidanceMode(e.target.value)}
                                style={radioStyle}
                            />
                            LOS / PURSUIT
                        </label>
                        <label style={radioLabelStyle}>
                            <input
                                type="radio"
                                name="guidanceMode"
                                value="pn"
                                checked={guidanceMode === 'pn'}
                                onChange={e => setGuidanceMode(e.target.value)}
                                style={radioStyle}
                            />
                            PROPORTIONAL NAV
                        </label>
                    </div>
                </div>

                <div style={sectionStyle}>
                    <label style={labelStyle}>ENGAGEMENT PARAMETERS</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={sliderContainerStyle}>
                            <label style={sliderLabelStyle}>TGT VEL: {targetVelocity} m/s</label>
                            <input
                                type="range" min="100" max="1000" step="50"
                                value={targetVelocity}
                                onChange={e => setTargetVelocity(e.target.value)}
                                style={sliderStyle}
                            />
                        </div>
                        <div style={sliderContainerStyle}>
                            <label style={sliderLabelStyle}>INT VEL: {interceptorVelocity} m/s</label>
                            <input
                                type="range" min="500" max="3000" step="100"
                                value={interceptorVelocity}
                                onChange={e => setInterceptorVelocity(e.target.value)}
                                style={sliderStyle}
                            />
                        </div>
                    </div>
                </div>

                <div style={{...sectionStyle, borderRight: 'none'}}>
                    <label style={labelStyle}>TIME WARP: {timeScale}x</label>
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
                    <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                        <button onClick={startSimulation} style={btnLaunch}>ENGAGE</button>
                        <button onClick={stopSimulation} style={btnAbort}>ABORT</button>
                    </div>
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
    width: '95%',
    maxWidth: '1200px',
    background: 'rgba(0, 15, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 255, 0, 0.4)',
    borderTop: '3px solid #00FF00',
    color: '#00FF00',
    fontFamily: '"Courier New", Courier, monospace',
    padding: '20px',
    zIndex: 10,
    boxShadow: '0 0 20px rgba(0, 255, 0, 0.2), inset 0 0 10px rgba(0, 255, 0, 0.1)',
    pointerEvents: 'auto'
};

const sectionStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    paddingRight: '20px',
    borderRight: '1px dashed rgba(0, 255, 0, 0.3)'
};

const labelStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    marginBottom: '15px',
    textShadow: '0 0 5px #00FF00'
};

const radioGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
};

const radioLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#00FF00'
};

const radioStyle = {
    accentColor: '#00FF00',
    cursor: 'pointer'
};

const sliderContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
};

const sliderLabelStyle = {
    fontSize: '12px',
    opacity: 0.8
};

const sliderStyle = {
    accentColor: '#00FF00',
    width: '100%',
    cursor: 'pointer'
};

const btnStyle = {
    fontFamily: '"Courier New", Courier, monospace',
    fontWeight: 'bold',
    fontSize: '14px',
    padding: '10px 20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    flex: 1
};

const btnLaunch = {
    ...btnStyle,
    background: 'rgba(0, 255, 0, 0.1)',
    color: '#00FF00',
    border: '1px solid #00FF00',
    boxShadow: '0 0 10px rgba(0, 255, 0, 0.2)'
};

const btnAbort = {
    ...btnStyle,
    background: 'rgba(255, 0, 0, 0.1)',
    color: '#FF0000',
    border: '1px solid #FF0000',
    boxShadow: '0 0 10px rgba(255, 0, 0, 0.2)'
};
