import asyncio
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

from physics import get_initial_state, rk4_step, EvasionState

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartRequest(BaseModel):
    target_profile: str
    guidance_mode: str
    target_velocity: float
    interceptor_velocity: float
    time_scale: float

class SimulationPair:
    def __init__(self, index, target_profile, guidance_mode, target_velocity, interceptor_velocity):
        self.index = index
        self.target_profile = target_profile
        self.guidance_mode = guidance_mode
        self.target_velocity = target_velocity
        self.interceptor_velocity = interceptor_velocity
        self.state = get_initial_state(index, target_velocity, interceptor_velocity)
        self.evasion_state = EvasionState(target_profile)
        self.status = "ACTIVE"
        self.n_constant = 4.0 # Default PN constant

    def step(self, t, dt):
        if self.status != "ACTIVE":
            return

        self.state = rk4_step(t, self.state, dt, self.target_profile, self.guidance_mode, self.n_constant, self.evasion_state, self.target_velocity, self.interceptor_velocity)

        pos_tgt = self.state[0:3]
        pos_int = self.state[6:9]

        distance = np.linalg.norm(pos_tgt - pos_int)
        if distance < 15.0:
            self.status = "INTERCEPTED"
        elif pos_tgt[1] <= 0.0:
            self.status = "IMPACT"

class SimulationManager:
    def __init__(self):
        self.active_connections = []
        self.running = False
        self.pairs = []
        self.time = 0.0
        self.time_scale = 5.0
        self.task = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_json(message)
            except (WebSocketDisconnect, RuntimeError, Exception) as e:
                print(f"Error broadcasting to connection, disconnecting: {e}")
                self.disconnect(connection)

    def set_time_scale(self, time_scale: float):
        self.time_scale = time_scale

    def start_simulation(self, request: StartRequest):
        self.time_scale = request.time_scale
        self.time = 0.0

        # Spawn 3 pairs
        self.pairs = [
            SimulationPair(i, request.target_profile, request.guidance_mode, request.target_velocity, request.interceptor_velocity)
            for i in range(3)
        ]

        self.running = True
        
        if self.task is None or self.task.done():
            self.task = asyncio.create_task(self.simulation_loop())

    def stop_simulation(self):
        self.running = False

    async def simulation_loop(self):
        tick_rate = 60.0
        dt_real = 1.0 / tick_rate
        
        while self.running:
            start_time = time.time()
            
            dt_sim = dt_real * self.time_scale
            
            all_finished = True
            targets_data = []
            interceptors_data = []
            
            for pair in self.pairs:
                pair.step(self.time, dt_sim)
                if pair.status == "ACTIVE":
                    all_finished = False

                pos_tgt = pair.state[0:3]
                vel_tgt = pair.state[3:6]
                pos_int = pair.state[6:9]
                vel_int = pair.state[9:12]

                distance = np.linalg.norm(pos_tgt - pos_int)
                R_vec = pos_tgt - pos_int
                V_rel = vel_tgt - vel_int
                closing_vel = -np.dot(R_vec / distance, V_rel) if distance > 0 else 0.0
                omega_mag = np.linalg.norm(np.cross(R_vec, V_rel) / (distance**2)) if distance > 0 else 0.0

                v_mag = np.linalg.norm(vel_tgt)
                g_force = 0.0
                if v_mag > 0 and pair.status == "ACTIVE":
                    if pair.target_profile == 'zigzag':
                        g_force = 50.0 / 9.81
                    else:
                        g_force = 50.0 * pair.evasion_state.get_jink_multiplier(self.time) / 9.81

                targets_data.append({
                    "id": pair.index,
                    "pos": pos_tgt.tolist(),
                    "vel": vel_tgt.tolist(),
                    "alt": pos_tgt[1],
                    "g_force": abs(g_force),
                    "status": pair.status
                })

                interceptors_data.append({
                    "id": pair.index,
                    "pos": pos_int.tolist(),
                    "vel": vel_int.tolist(),
                    "alt": pos_int[1],
                    "distance": distance,
                    "closing_velocity": closing_vel,
                    "los_rate": omega_mag
                })

            self.time += dt_sim

            # Use the first pair's status as the global status for compatibility, or 'FINISHED' if all done
            global_status = "ACTIVE" if not all_finished else "FINISHED"

            payload = {
                "status": global_status,
                "time": self.time,
                "targets": targets_data,
                "interceptors": interceptors_data
            }
            
            await self.broadcast(payload)
            
            if all_finished:
                self.running = False
                break
                
            elapsed = time.time() - start_time
            sleep_time = max(0, dt_real - elapsed)
            await asyncio.sleep(sleep_time)

manager = SimulationManager()

@app.post("/api/start")
async def start_sim(request: StartRequest):
    manager.start_simulation(request)
    return {"status": "started"}

@app.post("/api/stop")
async def stop_sim():
    manager.stop_simulation()
    return {"status": "stopped"}

class TimeScaleRequest(BaseModel):
    time_scale: float

@app.post("/api/timescale")
async def set_time_scale(request: TimeScaleRequest):
    manager.set_time_scale(request.time_scale)
    return {"status": "updated", "time_scale": request.time_scale}

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
