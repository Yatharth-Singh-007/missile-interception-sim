from physics import rk4_step, get_initial_state, EvasionState
import numpy as np

def test_physics():
    state = get_initial_state(0, 300.0, 1500.0)
    evasion = EvasionState('linear')
    
    # Take a step
    new_state = rk4_step(0.0, state, 0.016, 'linear', 'pn', 4.0, evasion, 300.0, 1500.0)
    
    print("Test passed!")

if __name__ == "__main__":
    test_physics()
