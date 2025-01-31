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
    
    dict_to_store['SECOND'] = df['SECOND'].last()
    dict_to_store['MINUTE'] = df['MINUTE'].last()
    dict_to_store['HOUR'] = df['HOUR'].last()
    dict_to_store['YEAR'] = df['YEAR'].last()
    dict_to_store["WSPD"] = df['WSPD'].mean()
    dict_to_store["WDIR"] = round(circmean(df['WDIR'], high=360, low=0),3)
    dict_to_store["ATMP"] = df['ATMP'].mean()
    dict_to_store["RAIN"] = df['RAIN'].sum()
    dict_to_store["SRAD"] = df['SRAD'].mean()
    dict_to_store["BPRS"] = df['BPRS'].mean()
    dict_to_store["WDCH"] = df['WDCH'].mean()
    dict_to_store["DWPT"] = df['DWPT'].mean()
    dict_to_store["HUMD"] = df['HUMD'].mean()
    return dict_to_store

def update_dict_with_values(dict_to_stream,values_list):  
    for key,value in zip(dict_to_stream,values_list):
        if key == 'WSPD':
            value = value/100
        if key == 'RAIN':
            value = value*.25
        dict_to_stream[key] = value
    return dict_to_stream

started = False
async def read_and_print(websocket):    
    baud_rate = 9600
    data_bits = 8
    parity = 'N'
    stop_bits = 1
    aioserial_instance = aioserial.AioSerial(port=os.environ.get('SERIAL_PORT'), baudrate=baud_rate, bytesize=data_bits,parity=parity, stopbits=stop_bits, timeout=1)
    global started    
    stored_list = []
    data_count = 0

    while True:
        dict_to_stream = {"SECOND":None,"MINUTE":None,"HOUR":None,"YEAR":None,  "ATMP": None,"HUMD": None, "WSPD": None, "WDIR": None,"RAIN": None,
                          "SRAD": None, "BPRS": None}
        
        dict_to_store = {"SECOND":None,"MINUTE":None,"HOUR":None,"YEAR":None,  "ATMP": None,"HUMD": None, "WSPD": None, "WDIR": None,"RAIN": None,
                          "SRAD": None, "BPRS": None}
        
        data = await aioserial_instance.read_async()
        if len(data) > 0:
            values_list = [int(value) for value in data]
            dict_to_stream = update_dict_with_values(dict_to_stream,values_list)
            stored_list.append(dict_to_stream)
            
            await send_messages(websocket,
                            data={'client': 'producer', 'device': 'rs485', 'action': 'stream',
                                'frame': dict_to_stream})    
            data_count+=1                
            if data_count == 60:                      
                dict_to_store = find_averages(dict_to_store=dict_to_store,stored_list=stored_list)
                await send_messages(websocket,
                            data={'client': 'producer', 'device': 'rs485', 'action': 'store',
                                'frame': dict_to_store})                    
                stored_list = []
                data_count=0

async def main():        
    while True:    
        try:
            async with websockets.connect(f"ws://{os.environ.get('INTERNAL_IP')}/ws/serial_communication/producer/") as websocket:                                
                await websocket.send(json.dumps({'client': 'producer','device': 'rs485','action': 'connection'}))
                await asyncio.gather(read_and_print(websocket),receive_messages(websocket=websocket))                
        except Exception as e:
            print(e)        
            await asyncio.sleep(5)                
            continue

asyncio.run(main())