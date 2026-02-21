# Backend Architecture Documentation

## Overview
The backend is built using **Django 4.2** and **Django Channels**, designed for real-time data ingestion, storage, and visualization. It serves as a central hub where weather sensor data is received, processed, and broadcasted to various clients (Web UI, LED Panels).

## Core Components

### 1. Real-Time Communication (Django Channels)
The system uses **WebSockets** for both data ingestion (from scripts) and data broadcasting (to dashboards).
- **ASGI Server**: Run using `daphne` to handle both HTTP and WebSocket protocols.
- **Consumer (`serial_comm/consumers.py`)**:
    - **Producers**: Raspberry Pi or similar units running serial scripts. They send `stream` actions (instant updates) and `store` actions (minute-wise averages).
    - **Consumers**: Web users. They subscribe to a Channel Group called `consumers` to receive live sensor updates.
    - **Panels**: Industrial LED displays that display real-time weather information and custom messages.
- **Channel Layer**: Uses **Redis** (in production) to manage communication between different instances of the application.

### 2. Data Models (`serial_comm/models.py`)
- **SerialCommunication**: The main table storing the raw/aggregated sensor data (Wind Speed, Direction, Temp, Humidity, Rain, etc.).
- **Averages**: Stores the calculated averages for display on the dashboard summary cards.
- **States / StatesWeekly**: These are summary tables populated by cron jobs. They store statistical data (mean, min, max, std) for specific parameters over daily and weekly intervals.

### 3. Dynamic Analytics and Visualization
The backend doesn't just serve data; it generates visuals.
- **Windrose Diagrams**: Generated using `windrose` and `matplotlib` based on historical wind speed and direction data.
- **Line/Area Charts**: Generated using `matplotlib` and `pandas`.
- **Base64 Encoding**: Maps and charts are generated in memory, encoded to Base64, and sent as a JSON string over WebSockets to avoid excessive file I/O.

### 4. Background Tasks (Cron Jobs)
Managed via `django-crontab`.
- **Daily Summaries**: Every day at 00:01, `serial_comm.cron.fill_daily_states` runs to aggregate the previous day's data.
- **Weekly Summaries**: Every Sunday at 01:00, `fill_weekly_states` runs to aggregate the week's performance.

## Technology Stack
- **Framework**: Django
- **Real-time**: Django Channels & Redis
- **Data Analysis**: Pandas, Scipy, Numpy
- **Visualization**: Matplotlib, Windrose
- **Database**: PostgreSQL (Production), SQLite (Development)
- **Server**: Daphne
