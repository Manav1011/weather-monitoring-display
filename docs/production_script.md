# Production Script Documentation: `scheduler-new.py`

## Role
The `scheduler-new.py` script is the "Producer" in our architecture. It stands between the physical weather sensors (connected via RS485) and the Django backend. Its job is to read, process, and stream data.

## Key Features

### 1. Asynchronous Communication
- **Serial Reading**: Uses `aioserial` to read from the hardware without blocking the rest of the application.
- **WebSocket Link**: Maintains a persistent connection to `ws://localhost:8000/ws/serial_communication/producer/`.

### 2. Physical Interface (RS485)
- **Port Detection**: Automatically lists and selects the available serial port using `serial.tools.list_ports`.
- **Raw Data Format**: Expects a comma-separated string of sensor values.

### 3. Signal Processing & Aggregation
The script handles two distinct types of data flows:

#### A. Live Streaming (`action: stream`)
- Every time a line is read from the serial port, it is immediately parsed.
- Units are converted (e.g., Wind Speed from pulses/time to m/s).
- It is sent to the backend as a `stream` frame for real-time dashboard updates.

#### B. Minute-Wise Storage (`action: store`)
- The script buffers all readings within a single minute.
- **Aggregation**:
    - **Wind Direction**: Uses `scipy.stats.circmean` to properly average angles (correctly handling the transition from 359° to 0°).
    - **Rain**: Calculates the delta (max - min) over the minute to find precipitation.
    - **Other Sensors**: Standard arithmetic mean using `pandas`.
- Once the minute changes, the aggregated data is sent with a `store` action to be persisted in the database.

### 4. Error Handling & Robustness
- **Automatic Retries**: If the serial port disconnects or the WebSocket server goes down, the script waits for 5 seconds and attempts to reconnect.
- **Isolation**: The script runs as a standalone process, ensuring that if the script crashes, the web server remains unaffected (and vice-versa).

## Dependencies
- `aioserial`: Async serial I/O.
- `websockets`: For connectivity with the backend.
- `pandas`: For data buffering and averaging.
- `scipy`: For circular mean statistics.
- `pyserial`: For port detection utilities.

## How to Run
```bash
python scripts/productionScripts/scheduler-new.py
```
*Note: Ensure the serial port is connected and the Django server is running.*
