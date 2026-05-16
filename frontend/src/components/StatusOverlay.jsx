import React from 'react';
import { useSimStore } from '../store/useSimStore';

export function StatusOverlay() {
    const { status, time } = useSimStore();

    if (status === 'idle' || status === 'ACTIVE') return null;

    const isIntercepted = status === 'INTERCEPTED';
    const color = isIntercepted ? '#00F0FF' : '#FF003C';
    const text = isIntercepted ? 'THREAT NEUTRALIZED' : 'THREAT MISSED - GROUND IMPACT';
    const subtext = isIntercepted ? `IMPACT DETECTED AT T+ ${time.toFixed(2)}s` : `IMPACT DETECTED AT T+ ${time.toFixed(2)}s`;

    return (
        <div style={overlayContainer}>
            <div style={{...bannerStyle, borderColor: color, boxShadow: `0 0 40px ${color}40`, background: `rgba(0,0,0,0.85)`}}>
                <h1 style={{...titleStyle, color: color, textShadow: `0 0 20px ${color}`}}>{text}</h1>
                <h3 style={{...subStyle, color: '#FFF'}}>{subtext}</h3>
            </div>
        </div>
    );
}

const overlayContainer = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 20,
    background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)'
};

const bannerStyle = {
    padding: '40px 80px',
    border: '2px solid',
    borderLeft: '10px solid',
    borderRight: '10px solid',
    textAlign: 'center',
    backdropFilter: 'blur(5px)',
    transform: 'scale(1)',
    animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
};

const titleStyle = {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '48px',
    margin: '0 0 10px 0',
    letterSpacing: '4px'
};

const subStyle = {
    fontFamily: '"Rajdhani", sans-serif',
    fontSize: '24px',
    margin: 0,
    letterSpacing: '2px',
    opacity: 0.8
};
