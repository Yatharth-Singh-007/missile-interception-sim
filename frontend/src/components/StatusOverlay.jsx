import React from 'react';
import { useSimStore } from '../store/useSimStore';

export function StatusOverlay() {
    const { status, time } = useSimStore();

    if (status === 'idle' || status === 'ACTIVE') return null;

    const isIntercepted = status === 'INTERCEPTED'; // Wait, it's 'FINISHED' now globally, but anyway let's handle FINISHED
    const color = status === 'FINISHED' ? '#00FF00' : '#FF0000';
    const text = 'SIMULATION FINISHED';
    const subtext = `COMPLETED AT T+ ${time.toFixed(2)}s`;

    return (
        <div style={overlayContainer}>
            <div style={{...bannerStyle, borderColor: color, boxShadow: `0 0 40px ${color}40`, background: `rgba(0,15,0,0.85)`}}>
                <h1 style={{...titleStyle, color: color, textShadow: `0 0 20px ${color}`}}>{text}</h1>
                <h3 style={{...subStyle, color: '#00FF00'}}>{subtext}</h3>
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
    background: 'radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)'
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
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '48px',
    margin: '0 0 10px 0',
    letterSpacing: '4px',
    fontWeight: 'bold'
};

const subStyle = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '24px',
    margin: 0,
    letterSpacing: '2px',
    opacity: 0.8
};
