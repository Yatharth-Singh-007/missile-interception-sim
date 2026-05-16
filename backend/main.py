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
    threat_type: str
    n_constant: float
    time_scale: float

class SimulationManager:
    def __init__(self):
        self.active_connections = []
        self.running = False
        self.state = None
        self.time = 0.0
        self.threat_type = 'cruise'
        self.n_constant = 4.0
        self.time_scale = 5.0
        self.task = None
        self.evasion_state = None

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
            except WebSocketDisconnect:
                self.disconnect(connection)

    def set_time_scale(self, time_scale: float):
        self.time_scale = time_scale

    def start_simulation(self, threat_type: str, n_constant: float, time_scale: float):
        self.threat_type = threat_type
        self.n_constant = n_constant
        self.time_scale = time_scale
        self.state = get_initial_state(self.threat_type)
        self.evasion_state = EvasionState()
        self.time = 0.0
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
            
            # Integration step
            dt_sim = dt_real * self.time_scale
            self.state = rk4_step(self.time, self.state, dt_sim, self.threat_type, self.n_constant, self.evasion_state)
            self.time += dt_sim
            
            # Extract state
            pos_tgt = self.state[0:3]
            vel_tgt = self.state[3:6]
            pos_int = self.state[6:9]
            vel_int = self.state[9:12]
            
            # Check intercept
            distance = np.linalg.norm(pos_tgt - pos_int)
            intercepted = distance < 15.0
            ground_impact = pos_tgt[1] <= 0.0
            
            status = "ACTIVE"
            if intercepted:
                status = "INTERCEPTED"
            elif ground_impact:
                status = "IMPACT"
            
            # Calculate telemetry
            R_vec = pos_tgt - pos_int
            V_rel = vel_tgt - vel_int
            closing_vel = -np.dot(R_vec / distance, V_rel) if distance > 0 else 0.0
            
            omega_mag = np.linalg.norm(np.cross(R_vec, V_rel) / (distance**2)) if distance > 0 else 0.0
            
            # Approx target G-force
            v_mag = np.linalg.norm(vel_tgt)
            if v_mag > 0:
                # Use simplified lateral G estimation for UI based on recent jink state
                g_force = 50.0 * self.evasion_state.get_jink_multiplier(self.time) / 9.81 if self.threat_type == 'cruise' else (15.0 * self.evasion_state.get_jink_multiplier(self.time) if self.threat_type == 'marv' else 0.0)
            else:
                g_force = 0.0
            
            payload = {
                "status": status,
                "time": self.time,
                "target": {
                    "pos": pos_tgt.tolist(),
                    "vel": vel_tgt.tolist(),
                    "alt": pos_tgt[1],
                    "g_force": abs(g_force)
                },
                "interceptor": {
                    "pos": pos_int.tolist(),
                    "vel": vel_int.tolist(),
                    "alt": pos_int[1]
                },
                "telemetry": {
                    "distance": distance,
                    "closing_velocity": closing_vel,
                    "los_rate": omega_mag
                }
            }
            
            await self.broadcast(payload)
            
            if intercepted or ground_impact:
                self.running = False
                break
                
            elapsed = time.time() - start_time
            sleep_time = max(0, dt_real - elapsed)
            await asyncio.sleep(sleep_time)

manager = SimulationManager()

@app.post("/api/start")
async def start_sim(request: StartRequest):
    manager.start_simulation(request.threat_type, request.n_constant, request.time_scale)
    return {"status": "started", "config": request.dict()}

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
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)
