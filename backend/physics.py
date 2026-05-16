import numpy as np
import math
import random

G = 9.81
RHO_0 = 1.225
H = 8500.0
TARGET_MASS = 1000.0
TARGET_CD = 0.3
TARGET_AREA = 0.5
INTERCEPTOR_SPEED = 1500.0
CRUISE_SPEED = 300.0

class EvasionState:
    def __init__(self):
        self.phase1 = random.uniform(0, 2 * math.pi)
        self.phase2 = random.uniform(0, 2 * math.pi)
        self.freq1 = random.uniform(0.3, 0.8)
        self.freq2 = random.uniform(0.8, 1.5)

    def update(self, dt):
        self.phase1 += dt * random.uniform(-0.1, 0.1)
        self.phase2 += dt * random.uniform(-0.2, 0.2)
        self.freq1 += dt * random.uniform(-0.05, 0.05)
        self.freq2 += dt * random.uniform(-0.1, 0.1)

    def get_jink_multiplier(self, t):
        return math.sin(self.freq1 * t + self.phase1) + 0.5 * math.cos(self.freq2 * t + self.phase2)

def calculate_apn(pos_int, vel_int, pos_tgt, vel_tgt, a_tgt, N):
    R_vec = pos_tgt - pos_int
    R_mag = np.linalg.norm(R_vec)
    if R_mag == 0:
        return np.zeros(3)
        
    V_rel = vel_tgt - vel_int
    u_R = R_vec / R_mag
    V_c = -np.dot(u_R, V_rel)
    
    Omega = np.cross(R_vec, V_rel) / (R_mag ** 2)
    
    # Project a_tgt onto plane normal to LOS
    # a_T_lateral = a_tgt - (a_tgt dot u_R) * u_R
    a_T_parallel = np.dot(a_tgt, u_R) * u_R
    a_T_lateral = a_tgt - a_T_parallel
    
    # APN command acceleration
    a_c = N * V_c * np.cross(Omega, u_R) + (N * a_T_lateral) / 2.0
    return a_c

def get_cruise_accel(t, state, evasion_state):
    vel = state[3:6]
    v_mag = np.linalg.norm(vel)
    
    if v_mag > 0:
        forward = vel / v_mag
        # Create a lateral vector. We want it primarily horizontal for cruise
        up = np.array([0.0, 1.0, 0.0])
        lat_dir = np.cross(forward, up)
        
        # If moving straight up/down, pick arbitrary lateral
        if np.linalg.norm(lat_dir) < 0.01:
            lat_dir = np.array([1.0, 0.0, 0.0])
        else:
            lat_dir = lat_dir / np.linalg.norm(lat_dir)
            
        jink = evasion_state.get_jink_multiplier(t)
        return 50.0 * jink * lat_dir
    return np.zeros(3)

def get_ballistic_accel(t, state, evasion_state, is_marv=False):
    pos = state[0:3]
    vel = state[3:6]
    y = pos[1]
    
    v_mag = np.linalg.norm(vel)
    rho = RHO_0 * math.exp(-max(y, 0) / H)
    
    drag_force_mag = 0.5 * rho * (v_mag**2) * TARGET_CD * TARGET_AREA
    drag_accel_mag = drag_force_mag / TARGET_MASS
    
    if v_mag > 0:
        a_drag = -drag_accel_mag * (vel / v_mag)
    else:
        a_drag = np.zeros(3)
        
    a_grav = np.array([0.0, -G, 0.0])
    a_total = a_drag + a_grav
    
    if is_marv and y < 15000 and v_mag > 0:
        forward = vel / v_mag
        # MaRV jinks can be more chaotic, let's use a dynamic lateral direction
        arbitrary = np.array([0.0, 1.0, 0.0]) if abs(forward[1]) < 0.99 else np.array([1.0, 0.0, 0.0])
        lat_dir = np.cross(forward, arbitrary)
        lat_dir = lat_dir / np.linalg.norm(lat_dir)
        
        # Rotate lateral direction slowly over time
        theta = t * 0.5
        c, s = math.cos(theta), math.sin(theta)
        # Rodrigues' rotation formula to rotate lat_dir around forward vector
        v = lat_dir
        k = forward
        lat_dir_rot = v * c + np.cross(k, v) * s + k * np.dot(k, v) * (1 - c)
        
        jink = evasion_state.get_jink_multiplier(t)
        maneuver_g = 15.0 * G * jink
        a_total += maneuver_g * lat_dir_rot
            
    return a_total

def get_target_accel(t, state_tgt, threat_type, evasion_state):
    if threat_type == 'cruise':
        return get_cruise_accel(t, state_tgt, evasion_state)
    elif threat_type == 'srbm':
        return get_ballistic_accel(t, state_tgt, evasion_state, is_marv=False)
    elif threat_type == 'marv':
        return get_ballistic_accel(t, state_tgt, evasion_state, is_marv=True)
    return np.zeros(3)

def derivative(t, state, threat_type, N, evasion_state):
    state_tgt = state[0:6]
    state_int = state[6:12]
    
    a_tgt = get_target_accel(t, state_tgt, threat_type, evasion_state)
    a_int = calculate_apn(state_int[0:3], state_int[3:6], state_tgt[0:3], state_tgt[3:6], a_tgt, N)
    
    d_state = np.zeros(12)
    d_state[0:3] = state_tgt[3:6]
    d_state[3:6] = a_tgt
    d_state[6:9] = state_int[3:6]
    d_state[9:12] = a_int
    
    return d_state

def rk4_step(t, state, dt, threat_type, N, evasion_state):
    # Update evasion state (drift)
    evasion_state.update(dt)
    
    k1 = derivative(t, state, threat_type, N, evasion_state)
    k2 = derivative(t + dt/2, state + k1 * dt/2, threat_type, N, evasion_state)
    k3 = derivative(t + dt/2, state + k2 * dt/2, threat_type, N, evasion_state)
    k4 = derivative(t + dt, state + k3 * dt, threat_type, N, evasion_state)
    
    new_state = state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
    
    vel_int = new_state[9:12]
    v_mag = np.linalg.norm(vel_int)
    if v_mag > 0:
        new_state[9:12] = (vel_int / v_mag) * INTERCEPTOR_SPEED
        
    if threat_type == 'cruise':
        vel_tgt = new_state[3:6]
        v_tgt_mag = np.linalg.norm(vel_tgt)
        if v_tgt_mag > 0:
            new_state[3:6] = (vel_tgt / v_tgt_mag) * CRUISE_SPEED
            
    return new_state

def get_initial_state(threat_type):
    # state: [x_t, y_t, z_t, vx_t, vy_t, vz_t, x_i, y_i, z_i, vx_i, vy_i, vz_i]
    state = np.zeros(12)
    
    # Interceptor spawns at origin
    state[6:9] = np.array([0.0, 0.0, 0.0])
    
    if threat_type == 'cruise':
        state[0:3] = np.array([40000.0, 5000.0, 40000.0])
        # Point towards origin
        dir_t = -state[0:3] / np.linalg.norm(state[0:3])
        # Ensure it stays at altitude 5000, so zero out y velocity
        dir_t[1] = 0.0
        dir_t = dir_t / np.linalg.norm(dir_t)
        state[3:6] = dir_t * CRUISE_SPEED
    elif threat_type in ['srbm', 'marv']:
        state[0:3] = np.array([80000.0, 40000.0, 0.0])
        dir_t = -state[0:3] / np.linalg.norm(state[0:3])
        state[3:6] = dir_t * 2000.0 # High initial velocity for terminal descent
        
    # Interceptor initial velocity pointing at target
    dir_i = state[0:3] - state[6:9]
    dir_i = dir_i / np.linalg.norm(dir_i)
    state[9:12] = dir_i * INTERCEPTOR_SPEED
    
    return state
