import React from 'react';
import { useSimStore } from '../store/useSimStore';

export function TelemetryDashboard() {
    const { time, target, interceptor, telemetry, status } = useSimStore();

    return (
        <div style={dashboardStyle}>
            <div style={headerStyle}>
                <h3 style={{margin: 0, letterSpacing: '2px'}}>SYS.TELEMETRY</h3>
                <div style={{...statusBadge, color: status === 'ACTIVE' ? '#00F0FF' : status === 'INTERCEPTED' ? '#00FF00' : '#FF003C', borderColor: status === 'ACTIVE' ? '#00F0FF' : status === 'INTERCEPTED' ? '#00FF00' : '#FF003C'}}>
                    {status}
                </div>
            </div>

            <div style={sectionStyle}>
                <h4 style={subheadStyle}>TARGET TRACK</h4>
                <div style={dataGrid}>
                    <div style={dataLabel}>ALTITUDE</div><div style={dataValue}>{target.alt.toFixed(1)} m</div>
                    <div style={dataLabel}>VELOCITY</div><div style={dataValue}>{Math.sqrt(target.vel[0]**2 + target.vel[1]**2 + target.vel[2]**2).toFixed(1)} m/s</div>
                    <div style={dataLabel}>LATERAL G</div><div style={dataValue}>{target.g_force ? target.g_force.toFixed(2) : "0.00"} G</div>
                </div>
            </div>

            <div style={sectionStyle}>
                <h4 style={{...subheadStyle, color: '#0088FF', borderBottomColor: 'rgba(0, 136, 255, 0.3)'}}>INTERCEPTOR TRACK</h4>
                <div style={dataGrid}>
                    <div style={dataLabel}>ALTITUDE</div><div style={{...dataValue, color: '#0088FF'}}>{interceptor.alt.toFixed(1)} m</div>
                    <div style={dataLabel}>VELOCITY</div><div style={{...dataValue, color: '#0088FF'}}>{Math.sqrt(interceptor.vel[0]**2 + interceptor.vel[1]**2 + interceptor.vel[2]**2).toFixed(1)} m/s</div>
                </div>
            </div>
            
            <div style={{...sectionStyle, border: 'none', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '4px'}}>
                <h4 style={{...subheadStyle, border: 'none', marginBottom: '10px'}}>ENGAGEMENT KINEMATICS</h4>
                <div style={dataGrid}>
                    <div style={dataLabel}>T+</div><div style={{...dataValue, color: '#FFF'}}>{time.toFixed(2)} s</div>
                    <div style={dataLabel}>DISTANCE</div><div style={{...dataValue, color: '#FFF'}}>{telemetry.distance.toFixed(1)} m</div>
                    <div style={dataLabel}>CLOSING VEL (Vc)</div><div style={{...dataValue, color: '#FFF'}}>{telemetry.closing_velocity.toFixed(1)} m/s</div>
                    <div style={dataLabel}>LOS RATE (λ)</div><div style={{...dataValue, color: '#FFF'}}>{telemetry.los_rate.toFixed(4)} rad/s</div>
                </div>
            </div>
        </div>
    );
}

const dashboardStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '350px',
    background: 'rgba(5, 10, 20, 0.65)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 240, 255, 0.2)',
    borderRight: '3px solid #00F0FF',
    color: '#00F0FF',
    fontFamily: '"Rajdhani", sans-serif',
    padding: '20px',
    zIndex: 10,
    boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
    borderRadius: '8px',
    pointerEvents: 'auto'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(0, 240, 255, 0.3)',
    paddingBottom: '15px',
    marginBottom: '20px'
};

const statusBadge = {
    fontSize: '12px',
    fontFamily: '"Orbitron", sans-serif',
    padding: '4px 8px',
    border: '1px solid',
    borderRadius: '4px',
    background: 'rgba(0,0,0,0.5)',
    fontWeight: 'bold'
};

const sectionStyle = {
    marginBottom: '20px',
    borderBottom: '1px solid rgba(0, 240, 255, 0.1)',
    paddingBottom: '15px'
};

const subheadStyle = {
    margin: '0 0 10px 0',
    fontSize: '14px',
    letterSpacing: '1px',
    color: '#FF003C'
};

const dataGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 10px',
    alignItems: 'center'
};

const dataLabel = {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500'
};

const dataValue = {
    fontSize: '16px',
    fontFamily: '"Orbitron", sans-serif',
    color: '#FF003C',
    textAlign: 'right'
};
