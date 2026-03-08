# libs
import asyncio
import aioserial
import struct
import datetime
from scipy.stats import circmean
import pandas as pd
import math
import websockets
import json
import time
import os

import platform
import serial.tools.list_ports

def detect_serial_port():
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        raise Exception("No serial ports found.")
    print("Available serial ports:")
    for i, port in enumerate(ports):
        print(f"{i}: {port.device} - {port.description}")
    selected_port = ports[-1].device
    print(f"Using serial port: {selected_port}")
    return selected_port

SERIAL_PORT = detect_serial_port()


async def receive_messages(websocket):
    try:
        while True:
            message = await websocket.recv()
            print(message)
    except websockets.ConnectionClosed as e:
        print("WebSocket connection closed")
        raise e


async def send_messages(websocket, data=None):
    try:
        if data is not None:
            await websocket.send(json.dumps(data))
    except websockets.ConnectionClosed as e:
        raise e



def find_averages(dict_to_store,stored_list):
    df = pd.DataFrame(stored_list)
    # Only include following sensors data
    dict_to_store["WSPD"] = df['WSPD'].mean()
    dict_to_store["RTC"] = df['RTC'].iloc[-1]
    dict_to_store["WDIR"] = round(circmean(df['WDIR'], high=360, low=0),3)
    dict_to_store["ATMP"] = df['ATMP'].mean()
    dict_to_store["RAIN"] = df['RAIN'].sum()
    dict_to_store["SRAD"] = df['SRAD'].mean()
    dict_to_store["BPRS"] = df['BPRS'].mean()
    # dict_to_store["WDCH"] = df['WDCH'].mean()
    # dict_to_store["DWPT"] = df['DWPT'].mean()
    dict_to_store["HUMD"] = df['HUMD'].mean()
    print(dict_to_store)
    return dict_to_store

def update_dict_with_values(dict_to_stream,values_list):
    for key,value in zip(dict_to_stream,values_list):
        if key == 'WSPD':
            value = value / 100  # Convert cm/s to m/s
        if key == 'RAIN':
            value = value / 20 if value != 0 else 0  # Convert to mm, set to 0 if raw is 0
        if key == 'SRAD':
            value = (((value/4095.0)*3.3)*1000)/1.67
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

started = False
async def read_and_print(websocket):    
    while True:
        try:
            stored_list = []
            prev_minute = None
            baud_rate = 9600
            data_bits = 8
            parity = 'N'
            stop_bits = 1
            serial_port = detect_serial_port()
            aioserial_instance = aioserial.AioSerial(port=serial_port, baudrate=baud_rate, bytesize=data_bits,parity=parity, stopbits=stop_bits, timeout=1)
            while True:
                dict_to_stream = {"SECOND":None,"MINUTE":None,"HOUR":None,"DAY":None,"MONTH":None,"YEAR":None,"ATMP": None,"HUMD": None, "WSPD": None, "WDIR": None,"RAIN": None,
                                  "SRAD": None, "BPRS": None,"RTC":None, "P12": None, "P13": None,
                                  "P14": None, "P15": None, "P16": None}
                dict_to_store = {"SECOND":None,"MINUTE":None,"HOUR":None,"DAY":None,"MONTH":None,"YEAR":None,"ATMP": None,"HUMD": None, "WSPD": None, "WDIR": None,"RAIN": None,
                                  "SRAD": None, "BPRS": None,"RTC":None, "P12": None, "P13": None,
                                  "P14": None, "P15": None, "P16": None}
                response = await aioserial_instance.readline_async()
                if response:
                    data = response.decode().strip()
                    if len(data) > 0:
                        values_list = list(map(float, data.split(",")))                
                        print(f"Received data: {values_list}")
                        dict_to_stream = update_dict_with_values(dict_to_stream,values_list)                
                        print(f"Updated dict: {dict_to_stream}")
                        stored_list.append(dict_to_stream)
                        sensors_to_include = ['RTC','WSPD','WDIR','RAIN','SRAD','BPRS','HUMD','ATMP']
                        filtered_dict = {key: dict_to_stream[key] for key in sensors_to_include if key in dict_to_stream}
                        def format_value(key, value):
                            # Replace near-zero with 0
                            if isinstance(value, float) and abs(value) < 1e-6:
                                value = 0.0
                            if key == 'WSPD':
                                return f"{value:.2f}"
                            elif key == 'WDIR':
                                return f"{int(round(value)):03d}"
                            elif key in ['ATMP', 'HUMD', 'RAIN', 'BPRS']:
                                return f"{value:.2f}"
                            else:
                                return value
                        filtered_dict = {key: format_value(key, val) for key, val in filtered_dict.items()}
                        await send_messages(websocket,
                            data={'client': 'producer', 'device': 'rs485', 'action': 'stream',
                                  'frame': filtered_dict})
                        current_minute = dict_to_stream["MINUTE"]
                        if prev_minute is not None and current_minute != prev_minute:
                            print(f"Minute changed: {prev_minute} -> {current_minute}")
                            # Aggregate and store for the previous minute
                            df = pd.DataFrame(stored_list)
                            dict_to_store["WSPD"] = float(df['WSPD'].mean())
                            dict_to_store["RTC"] = str(df['RTC'].iloc[-1])
                            dict_to_store["WDIR"] = float(round(circmean(df['WDIR'], high=360, low=0),3))
                            dict_to_store["ATMP"] = float(df['ATMP'].mean())
                            dict_to_store["RAIN"] = float(df['RAIN'].max() - df['RAIN'].min())
                            dict_to_store["SRAD"] = float(df['SRAD'].mean())
                            dict_to_store["BPRS"] = float(df['BPRS'].mean())
                            dict_to_store["HUMD"] = float(df['HUMD'].mean())
                            def format_store_value(key, value):
                                if isinstance(value, float) and abs(value) < 1e-6:
                                    value = 0.0
                                if key == 'WSPD':
                                    return f"{value:.2f}"
                                elif key == 'WDIR':
                                    return f"{int(round(value)):03d}"
                                elif key in ['ATMP', 'HUMD', 'RAIN', 'BPRS']:
                                    return f"{value:.2f}"
                                else:
                                    return value
                            dict_to_store = {key: format_store_value(key, val) for key, val in dict_to_store.items()}
                            await send_messages(websocket, data={'client': 'producer', 'device': 'rs485', 'action': 'store', 'frame': dict_to_store})
                            stored_list = []
                        prev_minute = current_minute
        except websockets.ConnectionClosed as e:
            print(f"WebSocket closed in read_and_print: {e}")
            raise e
        except Exception as e:
            print(f"Serial port error: {e}. Retrying with new port in 5 seconds...")
            await asyncio.sleep(5)

async def main():        
    while True:    
        try:
            async with websockets.connect(f"ws://localhost:8000/ws/serial_communication/producer/") as websocket:                                
                await websocket.send(json.dumps({'client': 'producer','device': 'rs485','action': 'connection'}))
                await asyncio.gather(read_and_print(websocket),receive_messages(websocket=websocket))                
        except Exception as e:
            print(f"Connection failed or interrupted: {e}")
            await asyncio.sleep(5)
            continue

asyncio.run(main())