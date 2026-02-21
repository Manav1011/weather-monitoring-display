# Project Overview

This directory contains Python scripts designed for reading sensor data from a serial port (RS485), processing it, and streaming/storing it via WebSockets. The core functionality involves:
*   Asynchronous serial communication using `aioserial`.
*   Data processing, including statistical analysis (e.g., circular mean for wind direction) using `pandas` and `scipy`.
*   Real-time data streaming and minute-based aggregation for storage via `websockets`.

The primary script for live data acquisition and transmission is `scheduler-new.py`. A utility script, `new-scheduler-test.py`, is provided for testing the data processing and WebSocket communication using a `data.txt` file as input, simulating live sensor data.

## Building and Running

### Dependencies

The project dependencies are listed in `requirements.txt`. Install them using pip:

```bash
pip install -r requirements.txt
```

### Docker

A `dockerfile` is provided to create a containerized environment for the application.

To build the Docker image:

```bash
docker build -t dynamic-led-display-scheduler .
```

To run the Docker container (for `scheduler-new.py`):

```bash
docker run -it --rm \
  -e SERIAL_PORT=/dev/ttyUSB0 \
  -e INTERNAL_IP=your_websocket_server_ip \
  dynamic-led-display-scheduler \
  python scheduler-new.py
```

Replace `/dev/ttyUSB0` with your actual serial port and `your_websocket_server_ip` with the IP address of your WebSocket server.

### Running `scheduler-new.py` (Live Data)

This script connects to a physical serial port, reads sensor data, processes it, and sends it to a WebSocket server.

It requires a serial port to be available and accessible. The script attempts to detect available serial ports automatically. The WebSocket server address is currently hardcoded to `ws://localhost:8000/ws/serial_communication/producer/`.

```bash
python scheduler-new.py
```

### Running `new-scheduler-test.py` (Simulated Data)

This script is used for testing the data processing and WebSocket communication logic without requiring a physical serial device. It reads simulated sensor data from `data.txt` and sends it to the WebSocket server.

```bash
python new-scheduler-test.py
```

The `data.txt` file should contain comma-separated values, one line per sensor reading, mimicking the output of the serial device.

## Development Conventions

*   **Asynchronous Programming:** The project heavily utilizes Python's `asyncio` for non-blocking I/O operations, especially for serial and WebSocket communication.
*   **Data Manipulation:** `pandas` DataFrames are used for efficient data aggregation and statistical calculations. `scipy.stats.circmean` is used for circular statistics like wind direction.
*   **Environment Variables:** Critical configuration parameters like the serial port (`SERIAL_PORT`) and internal IP (`INTERNAL_IP`) for the WebSocket server are intended to be configured via environment variables. Note that `scheduler-new.py` currently hardcodes the WebSocket IP to `localhost:8000`.
*   **Error Handling:** Basic error handling for WebSocket disconnections and serial port issues is implemented with retry mechanisms.
