import asyncio
import random
import datetime
import pandas as pd
from scipy.stats import circmean
import websockets
import json
import time

import platform
import serial.tools.list_ports

def detect_serial_port():
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        raise Exception("No serial ports found.")    
    print("Available serial ports:")
    for i, port in enumerate(ports):
        print(f"{i}: {port.device} - {port.description}")
    # Automatically select the first port
    selected_port = ports[0].device
    print(f"Using serial port: {selected_port}")
    return selected_port
SERIAL_PORT = detect_serial_port()
print(f"Detected serial port: {SERIAL_PORT}")

async def receive_messages(websocket):
    try:
        while True:
            message = await websocket.recv()
            print(message)
    except websockets.ConnectionClosed:
        print("WebSocket connection closed")

async def send_messages(websocket, data=None):
    try:
        if data is not None:
            await websocket.send(json.dumps(data))
    except websockets.ConnectionClosed as e:
        exit(e)

def find_averages(dict_to_store, stored_list):
    df = pd.DataFrame(stored_list)
    dict_to_store["WSPD"] = df['WSPD'].mean()
    dict_to_store["RTC"] = df['RTC'].iloc[-1]
    dict_to_store["WDIR"] = round(circmean(df['WDIR'], high=360, low=0), 3)
    dict_to_store["ATMP"] = df['ATMP'].mean()
    dict_to_store["RAIN"] = df['RAIN'].sum()
    dict_to_store["SRAD"] = df['SRAD'].mean()
    dict_to_store["BPRS"] = df['BPRS'].mean()
    dict_to_store["HUMD"] = df['HUMD'].mean()
    print(dict_to_store)
    return dict_to_store

def update_dict_with_values(dict_to_stream, values_list):
    for key, value in zip(dict_to_stream, values_list):
        if key == 'WSPD':
            value = value / 100
        if key == 'RAIN':
            value = value * 0.25
        if key == 'SRAD':
            value = (((value / 4095.0) * 3.3) * 1000) / 1.67
        dict_to_stream[key] = value
    dict_to_stream['RTC'] = datetime.datetime(
        year=int(dict_to_stream["YEAR"]),
        month=int(dict_to_stream["MONTH"]),
        day=int(dict_to_stream["DAY"]),
        hour=int(dict_to_stream["HOUR"]),
        minute=int(dict_to_stream["MINUTE"]),
        second=int(dict_to_stream["SECOND"])
    ).isoformat()
    return dict_to_stream

def generate_fake_values():
    now = datetime.datetime.now()
    values = [
        now.second,
        now.minute,
        now.hour,
        now.day,
        now.month,
        now.year,
        round(random.uniform(10, 40), 2),   # ATMP
        round(random.uniform(30, 90), 2),   # HUMD
        random.randint(0, 3000),            # WSPD (will be divided by 100)
        random.uniform(0, 360),             # WDIR
        random.randint(0, 10),              # RAIN (will be *0.25)
        random.randint(0, 4095),            # SRAD (will be converted)
        round(random.uniform(900, 1100), 2),# BPRS
        0, 0, 0, 0, 0                       # P12-P16
    ]
    return values

async def read_and_print(websocket):
    stored_list = []
    data_count = 0
    while True:
        dict_to_stream = {"SECOND":None,"MINUTE":None,"HOUR":None,"DAY":None,"MONTH":None,"YEAR":None,"ATMP": None,"HUMD": None, "WSPD": None, "WDIR": None,"RAIN": None,
                          "SRAD": None, "BPRS": None,"RTC":None, "P12": None, "P13": None,
                          "P14": None, "P15": None, "P16": None}
        dict_to_store = dict_to_stream.copy()
        values_list = generate_fake_values()
        dict_to_stream = update_dict_with_values(dict_to_stream, values_list)
        stored_list.append(dict_to_stream)
        sensors_to_include = ['RTC','WSPD','WDIR','RAIN','SRAD','BPRS','HUMD','ATMP']
        filtered_dict = {key: dict_to_stream[key] for key in sensors_to_include if key in dict_to_stream}
        await send_messages(websocket,
                data={'client': 'producer', 'device': 'rs485', 'action': 'stream',
                      'frame': filtered_dict})
        data_count += 1
        if data_count == 60:
            dict_to_store = find_averages(dict_to_store=dict_to_store, stored_list=stored_list)
            await send_messages(websocket,
                        data={'client': 'producer', 'device': 'rs485', 'action': 'store',
                              'frame': dict_to_store})
            stored_list = []
            data_count = 0
        await asyncio.sleep(1)

async def main():
    while True:
        try:
            async with websockets.connect(f"ws://localhost:8000/ws/serial_communication/producer/") as websocket:
                await websocket.send(json.dumps({'client': 'producer','device': 'rs485','action': 'connection'}))
                await asyncio.gather(read_and_print(websocket), receive_messages(websocket=websocket))
        except Exception as e:
            print(e)
            await asyncio.sleep(5)
            continue

asyncio.run(main())