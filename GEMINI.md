# Project Overview

This project implements an Advanced Real-Time Weather Monitoring System, integrating a robust Django web application with specialized Python scripts for real-time sensor data acquisition and streaming.

The system is designed to:
*   Collect sensor data from remote locations via RS485 serial communication.
*   Process raw data, including statistical analysis (e.g., circular mean for wind direction) using `pandas` and `scipy`.
*   Stream processed data in real-time via WebSockets to a central web server.
*   Provide a secure, user-friendly web interface (Django) for authentication, displaying real-time weather data, analytics graphs, and visualizations.
*   Offer control over an LED panel display for industries, allowing dynamic content updates (raw data, HTML-formatted content, text, clock, images, videos).

The core components include:
*   **Django Web Application:** Serves as the central platform, providing a secure, user-friendly web interface for authentication and displaying comprehensive weather data. This includes real-time sensor readings, insightful analytics graphs, and various data visualizations derived from stored information. It also offers administrative functionalities and control mechanisms for external LED panel displays, allowing customization of content with real-time updates, text, clock, images, videos, and more. Behind the scenes, it manages the backend API, data storage (PostgreSQL), and real-time communication layer (Django Channels with Daphne and Redis).
*   **Serial Communication Scripts:** Python scripts (e.g., `scheduler-new.py`) handle asynchronous serial communication (`aioserial`), data processing, and WebSocket client communication (`websockets`) to push data to the Django application.

**Key Technologies:**
*   **Backend:** Python, Django, Django Channels, Daphne (ASGI server), PostgreSQL (database), Redis (channel layer/cache).
*   **Serial Communication/Data Processing:** Python, `asyncio`, `aioserial`, `pandas`, `scipy`, `websockets`.
*   **Containerization:** Docker, Docker Compose.

# Building and Running

## Dependencies

The primary dependencies for the Django web application are listed in `dynamic_led_display_prod/requirements.txt`. Additional dependencies specific to the serial communication scripts are in `scripts/productionScripts/requirements.txt`.

## Django Web Application (Local Setup)

1.  **Install Python Dependencies:**
    ```bash
    pip install -r dynamic_led_display_prod/requirements.txt
    ```

2.  **Database Setup (PostgreSQL):**
    Ensure a PostgreSQL database is running and accessible with the credentials configured in `dynamic_led_display_prod/dynamic_led_display_prod/settings.py` (or via environment variables).

3.  **Run Migrations:**
    ```bash
    python dynamic_led_display_prod/manage.py makemigrations
    python dynamic_led_display_prod/manage.py migrate
    ```

4.  **Create Superuser (for admin access):**
    ```bash
    python dynamic_led_display_prod/manage.py createsuperuser
    ```

5.  **Collect Static Files:**
    ```bash
    python dynamic_led_display_prod/manage.py collectstatic --noinput
    ```

6.  **Start the ASGI Server (Daphne):**
    ```bash
    daphne -b 0.0.0.0 -p 8000 dynamic_led_display_prod.asgi:application
    ```
    The web application should then be accessible at `http://localhost:8000`.

## Django Web Application (Docker Compose)

The `docker-compose.yml` in the root directory can be used to set up and run the Django web application along with its PostgreSQL database and Redis instance.

1.  **Build and Run Services:**
    ```bash
    docker-compose up --build -d
    ```
    This will build the `web` service (from `dynamic_led_display_prod/`), start PostgreSQL, and Redis. The web application will be available on `http://localhost:8000`.

## Serial Communication Scripts

These Python scripts are responsible for reading sensor data and pushing it to the WebSocket endpoint provided by the Django application.

### Dependencies

```bash
pip install -r scripts/productionScripts/requirements.txt
```

### Running `scheduler-new.py` (Live Data)

This script connects to a physical serial port, reads sensor data, processes it, and sends it to the WebSocket server.

```bash
python scripts/productionScripts/scheduler-new.py
```
**Note:** The script attempts to auto-detect serial ports. The WebSocket server address is currently hardcoded in the script, but environment variables (`SERIAL_PORT`, `INTERNAL_IP`) are intended for configuration, especially in containerized environments.

### Running `new-scheduler-test.py` (Simulated Data)

This script is used for testing the data processing and WebSocket communication logic without requiring a physical serial device. It reads simulated sensor data from `data.txt` and sends it to the WebSocket server.

```bash
python scripts/productionScripts/new-scheduler-test.py
```
The `data.txt` file (located in `scripts/productionScripts/`) should contain comma-separated values, one line per sensor reading, mimicking the output of the serial device.

### Docker for Serial Communication Script (Standalone)

A `dockerfile` (`scripts/productionScripts/dockerfile`) is provided to containerize the serial communication script.

1.  **Build the Docker Image:**
    ```bash
    docker build -t dynamic-led-display-scheduler -f scripts/productionScripts/dockerfile .
    ```

2.  **Run the Docker Container:**
    ```bash
    docker run -it --rm \
      -e SERIAL_PORT=/dev/ttyUSB0 \
      -e INTERNAL_IP=your_websocket_server_ip \
      dynamic-led-display-scheduler \
      python scheduler-new.py
    ```
    Replace `/dev/ttyUSB0` with your actual serial port (or the appropriate path within the container) and `your_websocket_server_ip` with the IP address of your WebSocket server.

**Note:** The `docker-compose.yml` in the root contains a commented-out `scheduler` service that outlines how this serial communication script could be integrated directly into the Docker Compose setup.

# Development Conventions

*   **Asynchronous Programming:** Extensive use of Python's `asyncio` for non-blocking I/O operations, particularly for serial and WebSocket communication, and within Django Channels consumers.
*   **Data Manipulation:** `pandas` DataFrames are utilized for efficient data aggregation, statistical calculations, and analysis. `scipy.stats.circmean` is employed for circular statistics like wind direction.
*   **Django Structure:** The project follows standard Django application structure, leveraging its ORM, MVT (Model-View-Template) pattern, and Django Channels for real-time features. This includes Django's built-in templating system for rendering the web interface and serving static assets (CSS, JavaScript, images) for the frontend.
*   **Environment Variables:** Critical configuration parameters (e.g., database credentials, serial port, internal IP for WebSocket) are managed via environment variables for flexible deployment and security.
*   **Error Handling:** Basic error handling with retry mechanisms is implemented for robustness, especially concerning WebSocket disconnections and serial port issues.
