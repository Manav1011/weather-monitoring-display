from channels.generic.websocket import AsyncWebsocketConsumer
import json
import asyncio
import numpy as np
import pandas as pd
from channels.db import database_sync_to_async
from django.db.models import Min, Max
from django.utils import timezone
from .serializers import DailyAverageSerializer
from .models import SerialCommunication,Averages,Station
import matplotlib.pyplot as plt
import datetime
import io
import numpy as np
import matplotlib.pyplot as plt
from windrose import WindroseAxes
from matplotlib import cm
from matplotlib.colors import ListedColormap
import base64
import matplotlib.dates as mdates
from django.utils.timezone import make_aware, get_current_timezone
from decimal import Decimal


class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (np.integer, np.floating)):
            if np.isnan(obj) or np.isinf(obj):
                return None
            return obj.item()
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (datetime.datetime, datetime.date)):
            return obj.isoformat()
        return super(CustomJSONEncoder, self).default(obj)


class SerialConsumer(AsyncWebsocketConsumer):
    entities = {
        'rs485':{},
        'rs232':{}
    }
    
    # Track instantaneous true 1-second records bypassing 1-min DB aggregation averages
    live_min_max_cache = {}    
    
    async def connect(self):
        self.client = self.scope["url_route"]["kwargs"]["client"]
        if self.client == 'consumer':
            await self.channel_layer.group_add('consumers', self.channel_name)
        await self.accept()
    
    async def disconnect(self,close_code): 
        await self.channel_layer.group_discard('consumers', self.channel_name)       
        self.send(json.dumps(close_code))

    async def receive(self,text_data):
        text_data = json.loads(text_data)        
        # print(text_data)
        # if text_data['client'] == 'panel' and text_data.get('device') and text_data.get('action'):
        #     device = text_data['device']
        #     action = text_data['action']
        #     if action == 'connection':
        #         SerialConsumer.entities[device]['panel'] = self             
        #         print(SerialConsumer.entities) 

        if text_data['client'] == 'consumer' and text_data.get('device') and text_data.get('action'):
            device = text_data['device']
            action = text_data['action']
            
            if action == 'connection':
                SerialConsumer.entities[device]['consumer'] = self
                
                # Fetch today's min-max bounds and push to the new client
                min_max_data = await self.get_today_min_max(device)
                await self.send(json.dumps({
                    'action': 'initial_min_max',
                    'device': device,
                    'minMax': min_max_data
                }, cls=CustomJSONEncoder))
                
                print(SerialConsumer.entities)

            if action == 'get_windrose':
                values = text_data.get('values', False)
                colors = text_data.get('colors', False)
                daterange = text_data.get('daterange', None)
                
                if daterange is None:
                    # Default to last 24 hours
                    end_time = datetime.datetime.now()
                    start_time = end_time - datetime.timedelta(days=1)
                    daterange = [start_time.timestamp() * 1000, end_time.timestamp() * 1000]
                
                result = await self.get_windrose(device,values,colors,daterange)
                if result:                
                    await self.send(json.dumps({
                        'action':'windrose_received',
                        'device':'rs485',
                        'image_base64':result[0],
                        'df_html':result[1],
                        'df_csv':result[2]
                    }, cls=CustomJSONEncoder))
                else:
                    await self.send(json.dumps({
                        'action':'no_windrose_data',
                        'device':'rs485',                        
                    }))
                
            if action == 'get_line_chart':
                params = text_data.get('params', ['ATMP'])
                daterange = text_data.get('daterange', None)
                if daterange is None:
                    end_time = datetime.datetime.now()
                    start_time = end_time - datetime.timedelta(days=1)
                    daterange = [start_time.timestamp() * 1000, end_time.timestamp() * 1000]

                result = await self.get_line_chart(device,params,daterange)
                if result:                
                    await self.send(json.dumps({
                        'action':'graph_received',
                        'device':'rs485',
                        'image_base64':result[0],
                        'df_html':result[1],
                        'df_csv':result[2],
                        'raw_data': result[3] if len(result) > 3 else None
                    }, cls=CustomJSONEncoder))
                else:
                    await self.send(json.dumps({
                        'action':'no_data',
                        'device':'rs485',                        
                    }))
            if action == 'get_area_chart':
                value = text_data.get('value', 'ATMP')
                daterange = text_data.get('daterange', None)
                if daterange is None:
                    end_time = datetime.datetime.now()
                    start_time = end_time - datetime.timedelta(days=1)
                    daterange = [start_time.timestamp() * 1000, end_time.timestamp() * 1000]

                result = await self.get_area_chart(device,value,daterange)
                if result:                
                    await self.send(json.dumps({
                        'action':'graph_received',
                        'device':'rs485',
                        'image_base64':result[0],
                        'df_html':result[1],
                        'df_csv':result[2],
                        'raw_data': result[3] if len(result) > 3 else None
                    }, cls=CustomJSONEncoder))
                else:
                    await self.send(json.dumps({
                        'action':'no_data',
                        'device':'rs485',                        
                    }))
                

        if text_data['client'] == 'producer' and text_data.get('device') and text_data.get('action'):
            device = text_data['device']
            action = text_data['action']

            if action == 'connection':
                SerialConsumer.entities[device]['producer'] = self 
                print(SerialConsumer.entities)

            if action == 'stream' and text_data.get('frame') and text_data.get('device'):
                try:
                    frame_data = text_data['frame']
                    now_date = timezone.localtime().date().isoformat()
                    
                    # Ensure tracking bounds correctly exist on dict format for the active day
                    if device not in SerialConsumer.live_min_max_cache or SerialConsumer.live_min_max_cache[device].get('date') != now_date:
                        SerialConsumer.live_min_max_cache[device] = {'date': now_date, 'bounds': {}}

                    bounds = SerialConsumer.live_min_max_cache[device]['bounds']
                    keys = ['ATMP', 'HUMD', 'WSPD', 'WDIR', 'RAIN', 'BPRS', 'SRAD']
                    
                    # Capture exact 1-second instantaneous limits
                    for key in keys:
                        if key in frame_data and frame_data[key] is not None:
                            val = float(frame_data[key])
                            if key not in bounds:
                                bounds[key] = {'min': val, 'max': val}
                            else:
                                bounds[key]['min'] = min(bounds[key]['min'], val)
                                bounds[key]['max'] = max(bounds[key]['max'], val)

                    # if SerialConsumer.entities[device]['panel']:                        
                        today = datetime.datetime.today()                                                
                        averages = await self.get_averages(today)
                        await self.channel_layer.group_send(
                            'consumers', {"type": "send.frame.stream", "frame_obj": {'device':text_data['device'],'action':'stream','frame':text_data['frame'],'averages':averages}}
                        )
                        # await SerialConsumer.entities[device]['consumer'].send(json.dumps({
                        #     'device':text_data['device'],
                        #     'action':'stream',
                        #     'frame':text_data['frame']
                        # }))
                except Exception as e:      
                    print(e)                                  
            if action == 'store' and text_data.get('frame') and text_data.get('device'):
                # print(text_data['frame'])
                # Store the stream into database
                await self.store_stream_into_db(text_data['device'],text_data['frame'])
            
    @database_sync_to_async
    def get_averages(self,today):
        averages = Averages.objects.first()
        average_serialized = DailyAverageSerializer(averages)        
        return average_serialized.data
    
    @database_sync_to_async
    def get_today_min_max(self, device):
        today = timezone.localtime().date()
        keys = ['ATMP', 'HUMD', 'WSPD', 'WDIR', 'RAIN', 'BPRS', 'SRAD']
        
        # Build the aggregation dictionary dynamically
        agg_args = {}
        for key in keys:
            agg_args[f'{key}_min'] = Min(key)
            agg_args[f'{key}_max'] = Max(key)
            
        aggregates = SerialCommunication.objects.filter(
            device=device,
            RTC__date=today
        ).aggregate(**agg_args)
        
        min_max_dict = {}
        for key in keys:
            min_val = aggregates.get(f'{key}_min')
            max_val = aggregates.get(f'{key}_max')
            # Ignore None objects when zero hardware data has streamed today
            if min_val is not None and max_val is not None:
                min_max_dict[key] = {
                    'min': float(min_val),
                    'max': float(max_val)
                }

        # Merge Memory Trims natively
        now_date = today.isoformat()
        if device in SerialConsumer.live_min_max_cache and SerialConsumer.live_min_max_cache[device].get('date') == now_date:
            bounds = SerialConsumer.live_min_max_cache[device]['bounds']
            for key in keys:
                if key in bounds:
                    if key not in min_max_dict:
                        min_max_dict[key] = {'min': bounds[key]['min'], 'max': bounds[key]['max']}
                    else:
                        min_max_dict[key]['min'] = min(min_max_dict[key]['min'], bounds[key]['min'])
                        min_max_dict[key]['max'] = max(min_max_dict[key]['max'], bounds[key]['max'])

        return min_max_dict
    
    async def send_frame_stream(self, event): 
        text_data = event['frame_obj']        
        await self.send(json.dumps(text_data, cls=CustomJSONEncoder))

    @database_sync_to_async
    def get_windrose(self, device, values=False, colors=False, daterange=None):
        start_date = datetime.datetime.fromtimestamp(daterange[0] / 1000)
        end_date = datetime.datetime.fromtimestamp(daterange[1] / 1000)
        speed_dir_objs = SerialCommunication.objects.filter(device=device, RTC__range=(start_date, end_date)).values('WSPD', 'WDIR')

        if speed_dir_objs:
            df = pd.DataFrame(speed_dir_objs).apply(pd.to_numeric, errors='coerce', downcast='float').round(3)
            # Convert Wind Speed from m/s to km/h
            df['WSPD'] = df['WSPD'] * 3.6
            direction_bins = [0, 45, 90, 135, 180, 225, 270, 315, 360]
            direction_labels = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
            df['WDIR_BIN'] = pd.cut(df['WDIR'], bins=direction_bins, labels=direction_labels, right=False, include_lowest=True)
            distribution_table = df.groupby('WDIR_BIN').size().reset_index(name='count')
            distribution_table['percentage'] = (distribution_table['count'] / distribution_table['count'].sum()) * 100
            distribution_table = distribution_table.set_index('WDIR_BIN').reindex(direction_labels).T
            
            try:
                station = Station.objects.first()
                station_header = f"Station ID: {station.station_id}\nStation Name: {station.station_name}\n\n" if station else "Station ID: N/A\nStation Name: N/A\n\n"
            except Exception:
                station_header = "Station ID: N/A\nStation Name: N/A\n\n"
                
            table_csv = station_header + distribution_table.to_csv()
            # Calculate distribution table
            # wind_bins = [0, 45, 90, 135, 180, 225, 270, 315, 360]  # Adjust as needed
            # df['Wind Direction Category'] = pd.cut(df['WDIR'], bins=wind_bins, labels=False, right=False)
            # df['Wind Speed Category'] = pd.cut(df['WSPD'], bins=[0, 5, 10, 15, 20], labels=False, right=False)

            # distribution_table = pd.pivot_table(df, values='WSPD', index='Wind Speed Category', columns='Wind Direction Category', aggfunc='count', fill_value=0)
            # distribution_table = distribution_table.rename_axis(columns=None).rename_axis(index=None)

            table_html = distribution_table.to_html(classes='table table-bordered table-striped text-center', escape=False, index=True,
                                                    justify='center').replace('\n', '')
            title_html = f'<div class="alert alert-primary" role="alert">FROM {start_date.strftime("%Y-%m-%d %H:%M:%S")} TO {end_date.strftime("%Y-%m-%d %H:%M:%S")}</div>'
            table_html = title_html + table_html

            wind_direction = list(df['WDIR'])
            wind_speed = list(df['WSPD'])

            ax = WindroseAxes.from_ax()

            if values and colors:
                custom_cmap = ListedColormap(colors)
                custom_bins = np.array(values)
                ax.contourf(wind_direction, wind_speed, bins=custom_bins, cmap=custom_cmap)
            else:
                ax.contourf(wind_direction, wind_speed, normed=True, cmap=cm.hot)

            ax.legend(title="Wind Speed (km/h)", decimal_places=0)
            ax.set_title("Windrose")

            image_data = io.BytesIO()
            plt.savefig(image_data, format="png")
            image_data.seek(0)
            image_base64 = base64.b64encode(image_data.read()).decode('utf-8')
            plt.clf()

            return [image_base64, table_html,table_csv]
        else:
            return False

    @database_sync_to_async
    def get_line_chart(self,device,params,daterange):
        tz = get_current_timezone()
        start_date = make_aware(datetime.datetime.fromtimestamp(daterange[0]/1000), tz)
        end_date = make_aware(datetime.datetime.fromtimestamp(daterange[1]/1000), tz)
        
        # Ensure 'RTC' is in the values but keep track of requested params
        requested_params = [p for p in params if p != 'RTC']
        fetch_params = list(set(requested_params + ['RTC']))
        
        line_chart_objs = SerialCommunication.objects.filter(device=device,RTC__range=(start_date, end_date)).order_by('RTC').values(*fetch_params)        
        if line_chart_objs:
            df = pd.DataFrame(line_chart_objs)
            
            # Map for Units
            unit_map = {
                'ATMP': 'Ambient Temperature (°C)',
                'HUMD': 'Humidity (%)',
                'WSPD': 'Wind Speed (m/s)',
                'WDIR': 'Wind Direction (°)',
                'RAIN': 'Rainfall (mm)',
                'BPRS': 'Barometric Pressure (mmHg)',
                'SRAD': 'Solar Radiation (W/m²)',
                'RTC': 'Date & Time'
            }

            # Prepare Raw Data for Frontend Interactive Chart
            raw_data_json = df.copy()
            raw_data_json['RTC'] = raw_data_json['RTC'].dt.strftime('%Y-%m-%d %H:%M:%S')
            raw_data_list = raw_data_json.to_dict(orient='records')

            # Prepare for CSV and Summary
            FLOAT_DF = df[requested_params].apply(pd.to_numeric, errors='coerce', downcast='float').round(3)
            
            # Create a summary DF with Units in column names
            summary_df = FLOAT_DF.describe().round(2)
            summary_df.columns = [unit_map.get(col, col) for col in summary_df.columns]
            
            try:
                station = Station.objects.first()
                station_header = f"Station ID: {station.station_id}\nStation Name: {station.station_name}\n\n" if station else "Station ID: N/A\nStation Name: N/A\n\n"
            except Exception:
                station_header = "Station ID: N/A\nStation Name: N/A\n\n"
            
            # Formatting CSV as requested: Date and Time in columns A and B
            csv_df = df.copy()
            csv_df['Date'] = csv_df['RTC'].dt.strftime('%Y-%m-%d')
            csv_df['Time'] = csv_df['RTC'].dt.strftime('%H:%M:%S')
            
            # Reorder columns: Date, Time, then sensors
            cols = ['Date', 'Time'] + requested_params
            csv_df = csv_df[cols]
            
            # Rename sensor columns to include units
            csv_df.columns = ['Date', 'Time'] + [unit_map.get(p, p) for p in requested_params]
            
            summary_csv = station_header + "--- ANALYSIS SUMMARY ---\n" + summary_df.to_csv()
            raw_data_csv = csv_df.to_csv(index=False)
            table_csv = f"{summary_csv}\n\n--- RAW SENSOR DATA ---\n{station_header}{raw_data_csv}"
            
            table_html = summary_df.to_html(classes='table table-bordered table-striped text-center', escape=False, index=True,justify='center').replace('\n','')
            title_html = f'<div class="alert alert-primary font-weight-bold" role="alert">ANALYTICS FROM {start_date.strftime("%Y-%m-%d %H:%M:%S")} TO {end_date.strftime("%Y-%m-%d %H:%M:%S")} (Total Records: {len(df)})</div>'            
            table_html = title_html + table_html

            # Plotting (Matplotlib fallback)
            plt.figure(figsize=(12, 6))
            for i in requested_params:
                 plt.plot(df['RTC'], FLOAT_DF[i], label=unit_map.get(i, i))
            
            plt.gcf().autofmt_xdate()
            date_format = mdates.DateFormatter("%Y-%m-%d %H:%M:%S")
            plt.gca().xaxis.set_major_formatter(date_format)
            plt.xlabel('Time')
            plt.ylabel('Values')
            plt.title('Parameter Analysis Over Time')
            plt.legend()
            plt.grid(True, alpha=0.3)
            
            line_data = io.BytesIO()        
            plt.savefig(line_data, format="png", bbox_inches='tight', dpi=100)
            line_data.seek(0)
            image_base64 = base64.b64encode(line_data.read()).decode('utf-8')
            plt.close()
            
            return [image_base64, table_html, table_csv, raw_data_list]
        else:
            return False
    
    @database_sync_to_async
    def get_area_chart(self,device,value,daterange):
        tz = get_current_timezone()
        start_date = make_aware(datetime.datetime.fromtimestamp(daterange[0]/1000), tz)
        end_date = make_aware(datetime.datetime.fromtimestamp(daterange[1]/1000), tz)
        
        params = [value,'RTC']
        line_chart_objs = SerialCommunication.objects.filter(device=device,RTC__range=(start_date, end_date)).order_by('RTC').values(*params)        
        if line_chart_objs:
            df = pd.DataFrame(line_chart_objs)
            
            unit_map = {
                'ATMP': 'Ambient Temperature (°C)',
                'HUMD': 'Humidity (%)',
                'WSPD': 'Wind Speed (m/s)',
                'WDIR': 'Wind Direction (°)',
                'RAIN': 'Rainfall (mm)',
                'BPRS': 'Barometric Pressure (mmHg)',
                'SRAD': 'Solar Radiation (W/m²)',
                'RTC': 'Date & Time'
            }
            
            # Prepare Raw Data for Frontend
            raw_data_json = df.copy()
            raw_data_json['RTC'] = raw_data_json['RTC'].dt.strftime('%Y-%m-%d %H:%M:%S')
            raw_data_list = raw_data_json.to_dict(orient='records')
            
            FLOAT_DF = df[value].apply(pd.to_numeric, errors='coerce', downcast='float').round(3)
            
            # Summary Table
            summary_df = pd.DataFrame(FLOAT_DF).describe().round(2)
            summary_df.columns = [unit_map.get(value, value)]
            
            try:
                station = Station.objects.first()
                station_header = f"Station ID: {station.station_id}\nStation Name: {station.station_name}\n\n" if station else "Station ID: N/A\nStation Name: N/A\n\n"
            except Exception:
                station_header = "Station ID: N/A\nStation Name: N/A\n\n"
            
            # CSV with Date/Time split
            csv_df = df.copy()
            csv_df['Date'] = csv_df['RTC'].dt.strftime('%Y-%m-%d')
            csv_df['Time'] = csv_df['RTC'].dt.strftime('%H:%M:%S')
            csv_df[unit_map.get(value, value)] = csv_df[value]
            csv_df = csv_df[['Date', 'Time', unit_map.get(value, value)]]
            
            summary_csv = station_header + "--- ANALYSIS SUMMARY ---\n" + summary_df.to_csv()
            raw_data_csv = csv_df.to_csv(index=False)
            table_csv = f"{summary_csv}\n\n--- RAW SENSOR DATA ---\n{station_header}{raw_data_csv}"
            
            table_html = summary_df.to_html(classes='table table-bordered table-striped text-center', escape=False, index=True,justify='center').replace('\n','')
            title_html = f'<div class="alert alert-primary font-weight-bold" role="alert">AREA ANALYSIS OF {unit_map.get(value, value)} FROM {start_date.strftime("%Y-%m-%d %H:%M:%S")} TO {end_date.strftime("%Y-%m-%d %H:%M:%S")} (Total Records: {len(df)})</div>'            
            table_html = title_html + table_html
            
            # Plotting
            plt.figure(figsize=(12, 6))
            plt.fill_between(df['RTC'], FLOAT_DF, color='skyblue', alpha=0.4, label=f"{unit_map.get(value, value)} area")
            plt.plot(df['RTC'], FLOAT_DF, color='blue', label=f'{unit_map.get(value, value)} Line', marker='', linewidth=1)
            plt.title(f'{unit_map.get(value, value)} Trends Over Time')
            plt.xlabel('Time')
            plt.ylabel(f'{value}')
            plt.legend()
            plt.grid(True, alpha=0.3)
            plt.gcf().autofmt_xdate()

            area_data = io.BytesIO()        
            plt.savefig(area_data, format="png", bbox_inches='tight', dpi=100)
            area_data.seek(0)
            image_base64 = base64.b64encode(area_data.read()).decode('utf-8')
            plt.close()
            
            return [image_base64, table_html, table_csv, raw_data_list]
        else:
            return False


    @database_sync_to_async
    def store_stream_into_db(self,device,frame):
        frame_obj = SerialCommunication(device=device)
        for key, value in frame.items():
            if key != 'RTC':
                 if value == None: 
                     value = 0.0
                 
                 float_val = float(value)
                 if key == 'WDIR':
                     final_val = float(int(round(float_val)))
                 else:
                     final_val = round(float_val, 2)
                     
                 setattr(frame_obj, key, final_val)  # Set the attribute using setattr
            else:
                 setattr(frame_obj, key, datetime.datetime.fromisoformat(value))
        frame_obj.save() 