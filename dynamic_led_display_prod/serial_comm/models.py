from django.db import models

# Create your models here.
class Station(models.Model):
    station_id = models.CharField(max_length=100, default="RS485-PROD-01")
    station_name = models.CharField(max_length=255, default="Default Station")

    def __str__(self):
        return f"{self.station_id} - {self.station_name}"

class SerialCommunication(models.Model):
    RTC = models.DateTimeField()
    WSPD = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    WDIR = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    ATMP = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    HUMD = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    RAIN = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    SRAD = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    BPRS = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    WDCH = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    DWPT = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P12 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P13 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P14 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P15 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P16 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    device = models.CharField(max_length=255,null=True,blank=True)

    def __str__(self) -> str:
        return_str = f"{self.device} => {self.RTC} : {self.WSPD} | {self.WDIR} | {self.ATMP} | {self.HUMD} | {self.RAIN} | {self.SRAD} | {self.BPRS} | {self.WDCH} | {self.DWPT} | {self.P12} | {self.P13} | {self.P14} | {self.P15} | {self.P16}"
        return return_str

class Averages(models.Model):
    date = models.DateTimeField()
    WSPD = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    WDIR = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    ATMP = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    HUMD = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    RAIN = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    SRAD = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    BPRS = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    WDCH = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    DWPT = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P12 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P13 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P14 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P15 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)
    P16 = models.DecimalField(blank=True,null=True,max_digits=16,decimal_places=8)

    def __str__(self) -> str:
        return_str = str(self.date)
        return return_str

class States(models.Model):
    param = models.CharField(max_length=255)
    count = models.IntegerField()
    mean = models.FloatField()
    min = models.FloatField()
    max = models.FloatField()
    std = models.FloatField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return_str = f"{self.param} => count | {self.count}, mean | {self.mean}, min| {self.min}, max | {self.max}, std | {self.std} day | {self.date}"
        return return_str
    
class StatesWeekly(models.Model):
    param = models.CharField(max_length=255)
    count = models.IntegerField()
    mean = models.FloatField()
    min = models.FloatField()
    max = models.FloatField()
    std = models.FloatField()
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return_str = f"{self.param} => count | {self.count}, mean | {self.mean}, min| {self.min}, max | {self.max}, std | {self.std} day | {self.date}"
        return return_str