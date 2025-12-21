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
    # Optionally, filter ports by description or VID/PID if you know your device
    print("Available serial ports:")
    for i, port in enumerate(ports):
        print(f"{i}: {port.device} - {port.description}")
    # Automatically select the first port
    selected_port = ports[-1].device
    print(f"Using serial port: {selected_port}")
    return selected_port

SERIAL_PORT = detect_serial_port()


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

def convert_to_number(value):
    try:
        return int(value)  # Try converting to int first
    except ValueError:
        return float(value)  # If it fails, convert to float

def update_dict_with_values(dict_to_stream,values_list):
    # for index,value in enumerate(values_list,start=1):
    #     if index == 9:
    #         values_list[index - 1] = value/100
    #         pass
    #     if index == 11:
    #         values_list[index - 1] = value*.25
    #     if index == 12:
    #         updated_val = (((value/4095.0)*3.3)*1000)/1.67
    #         values_list[index - 1] = updated_val
    # return values_list
    for key,value in zip(dict_to_stream,values_list):
        value = convert_to_number(value)
        if key == 'WSPD':
            value = value/100
        if key == 'RAIN':
            value = value*.25
        if key == 'SRAD':
            value = (((value/4095.0)*3.3)*1000)/1.67
        dict_to_stream[key] = value
    dict_to_stream['RTC'] = datetime.datetime(
        year=dict_to_stream["YEAR"],
        month=dict_to_stream["MONTH"],
        day=dict_to_stream["DAY"],
        hour=dict_to_stream["HOUR"],
        minute=dict_to_stream["MINUTE"],
        second=dict_to_stream["SECOND"]
    ).isoformat()
    return dict_to_stream

started = False
async def read_and_print(websocket):    
    stored_list = []
    data_count = 0
    baud_rate = 9600
    data_bits = 8
    parity = 'N'
    stop_bits = 1
    aioserial_instance = aioserial.AioSerial(port=SERIAL_PORT, baudrate=baud_rate, bytesize=data_bits,parity=parity, stopbits=stop_bits, timeout=1)
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
                dict_to_stream = update_dict_with_values(dict_to_stream,values_list)
                print(f"Decoded dictionary: {dict_to_stream}")
                stored_list.append(dict_to_stream)
                # print(dict_to_stream,data_count)
                sensors_to_include = ['RTC','WSPD','WDIR','RAIN','SRAD','BPRS','HUMD','ATMP']
                filtered_dict = {key: dict_to_stream[key] for key in sensors_to_include if key in dict_to_stream}
                await send_messages(websocket,
                        data={'client': 'producer', 'device': 'rs485', 'action': 'stream',
                              'frame': filtered_dict})    
                data_count+=1                
                if data_count == 60:                      
                    # print(stored_list)
                    dict_to_store = find_averages(dict_to_store=dict_to_store,stored_list=stored_list)
                    await send_messages(websocket,
                                data={'client': 'producer', 'device': 'rs485', 'action': 'store',
                                    'frame': dict_to_store})                    
                    stored_list = []
                    data_count=0

async def main():        
    while True:    
        try:
            async with websockets.connect(f"ws://localhost:8000/ws/serial_communication/producer/") as websocket:                                
                await websocket.send(json.dumps({'client': 'producer','device': 'rs485','action': 'connection'}))
                await asyncio.gather(read_and_print(websocket),receive_messages(websocket=websocket))                
        except Exception as e:
            print(e)        
            await asyncio.sleep(5)                
            continue

asyncio.run(main())