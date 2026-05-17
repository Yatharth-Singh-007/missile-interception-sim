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
    def __init__(self, target_profile='linear'):
        self.target_profile = target_profile
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
        if self.target_profile == 'linear':
            return 0.0
        elif self.target_profile == 'zigzag':
            # Alternating hard breaks every 2 seconds
            return 1.0 if (t // 2) % 2 == 0 else -1.0
        else:
            return math.sin(self.freq1 * t + self.phase1) + 0.5 * math.cos(self.freq2 * t + self.phase2)

def calculate_guidance(pos_int, vel_int, pos_tgt, vel_tgt, a_tgt, N, guidance_mode):
    R_vec = pos_tgt - pos_int
    R_mag = np.linalg.norm(R_vec)
    if R_mag == 0:
        return np.zeros(3)
        
    V_rel = vel_tgt - vel_int
    u_R = R_vec / R_mag
    V_c = -np.dot(u_R, V_rel)
    
    if guidance_mode == 'los':
        # Pure Pursuit: align velocity with LOS
        v_mag = np.linalg.norm(vel_int)
        if v_mag > 0:
            v_dir = vel_int / v_mag
            # We want to turn v_dir towards u_R
            error_vec = u_R - v_dir
            # Apply proportional correction to velocity
            return 50.0 * error_vec # tuning constant for pursuit
        return np.zeros(3)
    else: # PN or APN
        Omega = np.cross(R_vec, V_rel) / (R_mag ** 2)
        
        # PN standard
        a_c = N * V_c * np.cross(Omega, u_R)

        if guidance_mode == 'apn':
            a_T_parallel = np.dot(a_tgt, u_R) * u_R
            a_T_lateral = a_tgt - a_T_parallel
            a_c += (N * a_T_lateral) / 2.0
            
        return a_c

def get_target_accel(t, state_tgt, target_profile, evasion_state, target_speed):
    # Base acceleration based on profile
    vel = state_tgt[3:6]
    v_mag = np.linalg.norm(vel)
    
    a_total = np.zeros(3)

    # Air drag and gravity
    y = state_tgt[1]
    rho = RHO_0 * math.exp(-max(y, 0) / H)
    drag_force_mag = 0.5 * rho * (v_mag**2) * TARGET_CD * TARGET_AREA
    drag_accel_mag = drag_force_mag / TARGET_MASS
    
    if v_mag > 0:
        a_drag = -drag_accel_mag * (vel / v_mag)
        a_total += a_drag
        
    # a_total += np.array([0.0, -G, 0.0]) # Simplified out for cruise unless needed, add back if srbm
    
    if target_profile == 'zigzag' and v_mag > 0:
        forward = vel / v_mag
        up = np.array([0.0, 1.0, 0.0])
        lat_dir = np.cross(forward, up)
        
        if np.linalg.norm(lat_dir) < 0.01:
            lat_dir = np.array([1.0, 0.0, 0.0])
        else:
            lat_dir = lat_dir / np.linalg.norm(lat_dir)
            
        jink = evasion_state.get_jink_multiplier(t)
        a_total += 50.0 * jink * lat_dir

    return a_total

def derivative(t, state, target_profile, guidance_mode, N, evasion_state, target_speed, interceptor_speed):
    state_tgt = state[0:6]
    state_int = state[6:12]
    
    a_tgt = get_target_accel(t, state_tgt, target_profile, evasion_state, target_speed)
    a_int = calculate_guidance(state_int[0:3], state_int[3:6], state_tgt[0:3], state_tgt[3:6], a_tgt, N, guidance_mode)
    
    d_state = np.zeros(12)
    d_state[0:3] = state_tgt[3:6]
    d_state[3:6] = a_tgt
    d_state[6:9] = state_int[3:6]
    d_state[9:12] = a_int
    
    return d_state

def rk4_step(t, state, dt, target_profile, guidance_mode, N, evasion_state, target_speed, interceptor_speed):
    evasion_state.update(dt)
    
    k1 = derivative(t, state, target_profile, guidance_mode, N, evasion_state, target_speed, interceptor_speed)
    k2 = derivative(t + dt/2, state + k1 * dt/2, target_profile, guidance_mode, N, evasion_state, target_speed, interceptor_speed)
    k3 = derivative(t + dt/2, state + k2 * dt/2, target_profile, guidance_mode, N, evasion_state, target_speed, interceptor_speed)
    k4 = derivative(t + dt, state + k3 * dt, target_profile, guidance_mode, N, evasion_state, target_speed, interceptor_speed)
    
    new_state = state + (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)
    
    vel_int = new_state[9:12]
    v_mag = np.linalg.norm(vel_int)
    if v_mag > 0:
        new_state[9:12] = (vel_int / v_mag) * interceptor_speed
        
    vel_tgt = new_state[3:6]
    v_tgt_mag = np.linalg.norm(vel_tgt)
    if v_tgt_mag > 0:
        new_state[3:6] = (vel_tgt / v_tgt_mag) * target_speed
            
    return new_state

def get_initial_state(index, target_speed, interceptor_speed):
    state = np.zeros(12)
    
    # Swarm offsets
    offset_x = index * 8000.0 - 8000.0 # -8km, 0, +8km
    offset_z = index * 4000.0

    # Interceptor spawns at origin but staggered slightly
    state[6:9] = np.array([offset_x * 0.1, 0.0, offset_z * 0.1])

    state[0:3] = np.array([40000.0 + offset_x, 5000.0, 40000.0 + offset_z])
    dir_t = -state[0:3] / np.linalg.norm(state[0:3])
    dir_t[1] = 0.0
    dir_t = dir_t / np.linalg.norm(dir_t)
    state[3:6] = dir_t * target_speed
        
    dir_i = state[0:3] - state[6:9]
    dir_i = dir_i / np.linalg.norm(dir_i)
    state[9:12] = dir_i * interceptor_speed
    
    return state
