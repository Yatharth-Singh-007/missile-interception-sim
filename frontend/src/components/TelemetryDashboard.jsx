import React from 'react';
import { useSimStore } from '../store/useSimStore';

export function TelemetryDashboard() {
    const { time, targets, interceptors, status } = useSimStore();

    return (
        <div style={dashboardStyle}>
            <div style={headerStyle}>
                <h3 style={{margin: 0, letterSpacing: '2px'}}>SWARM TELEMETRY</h3>
                <div style={{...statusBadge, color: status === 'ACTIVE' ? '#00FF00' : status === 'FINISHED' ? '#888' : '#FF0000', borderColor: status === 'ACTIVE' ? '#00FF00' : status === 'FINISHED' ? '#888' : '#FF0000'}}>
                    {status}
                </div>
            </div>

            <div style={{...dataGrid, gridTemplateColumns: '1fr', gap: '15px'}}>
                {targets.map((tgt, i) => {
                    const int = interceptors.find(x => x.id === tgt.id);
                    if (!int) return null;

                    const tVel = Math.sqrt(tgt.vel[0]**2 + tgt.vel[1]**2 + tgt.vel[2]**2);
                    const iVel = Math.sqrt(int.vel[0]**2 + int.vel[1]**2 + int.vel[2]**2);

                    const pairStatusColor = tgt.status === 'ACTIVE' ? '#00FF00' : tgt.status === 'INTERCEPTED' ? '#0088FF' : '#FF0000';

                    return (
                        <div key={tgt.id} style={{...sectionStyle, borderLeft: `3px solid ${pairStatusColor}`, paddingLeft: '10px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                                <h4 style={{...subheadStyle, color: pairStatusColor}}>PAIR {tgt.id} [{tgt.status}]</h4>
                            </div>

                            <div style={dataGridSmall}>
                                <div style={dataLabel}>TGT ALT</div><div style={{...dataValue, color: '#FF4444'}}>{tgt.alt.toFixed(1)} m</div>
                                <div style={dataLabel}>TGT VEL</div><div style={{...dataValue, color: '#FF4444'}}>{tVel.toFixed(1)} m/s</div>
                                <div style={dataLabel}>TGT G</div><div style={{...dataValue, color: '#FF4444'}}>{tgt.g_force.toFixed(1)} G</div>

                                <div style={dataLabel}>INT ALT</div><div style={{...dataValue, color: '#44AAFF'}}>{int.alt.toFixed(1)} m</div>
                                <div style={dataLabel}>INT VEL</div><div style={{...dataValue, color: '#44AAFF'}}>{iVel.toFixed(1)} m/s</div>

                                <div style={dataLabel}>DISTANCE</div><div style={{...dataValue, color: '#FFF'}}>{int.distance.toFixed(1)} m</div>
                                <div style={dataLabel}>CLOSING</div><div style={{...dataValue, color: '#FFF'}}>{int.closing_velocity.toFixed(1)} m/s</div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed rgba(0, 255, 0, 0.3)'}}>
                 <div style={{display: 'flex', justifyContent: 'space-between'}}>
                     <div style={dataLabel}>GLOBAL T+</div>
                     <div style={{...dataValue, color: '#00FF00', fontSize: '18px'}}>{time.toFixed(2)} s</div>
                 </div>
            </div>
        </div>
    );
}

const dashboardStyle = {
    position: 'absolute',
    top: '20px',
    right: '20px',
    width: '380px',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: 'rgba(0, 15, 0, 0.85)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0, 255, 0, 0.4)',
    borderRight: '3px solid #00FF00',
    color: '#00FF00',
    fontFamily: '"Courier New", Courier, monospace',
    padding: '20px',
    zIndex: 10,
    boxShadow: '-10px 0 30px rgba(0, 255, 0, 0.1)',
    pointerEvents: 'auto'
};

const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(0, 255, 0, 0.5)',
    paddingBottom: '15px',
    marginBottom: '20px'
};

const statusBadge = {
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '4px 8px',
    border: '1px solid',
    background: 'rgba(0,0,0,0.5)',
};

const sectionStyle = {
    marginBottom: '5px',
    borderBottom: '1px dashed rgba(0, 255, 0, 0.2)',
    paddingBottom: '15px',
    background: 'rgba(0, 255, 0, 0.02)'
};

const subheadStyle = {
    margin: '0 0 10px 0',
    fontSize: '14px',
    letterSpacing: '1px'
};

const dataGrid = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px 10px',
    alignItems: 'center'
};

const dataGridSmall = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '4px 8px',
    alignItems: 'center'
};

const dataLabel = {
    fontSize: '10px',
    color: 'rgba(0, 255, 0, 0.7)',
    fontWeight: 'bold'
};

const dataValue = {
    fontSize: '12px',
    fontWeight: 'bold',
    textAlign: 'right'
};
