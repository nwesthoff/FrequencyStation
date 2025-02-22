import socketio
from envirophat import motion, analog, leds
import time
from beacontools import BeaconScanner, EddystoneUIDFrame, EddystoneTLMFrame, EddystoneFilter
from i2clibraries import i2c_hmc5883l

# INITIALISATION START

compass = i2c_hmc5883l.i2c_hmc5883l(1)
compass.setContinuousMode()
compass.setDeclination(1, 47)


class CurrentBeacon:
    def __init__(self, rssi=None, bt_addr=None):
        self.rssi = rssi
        self.bt_addr = bt_addr

    def __setattr__(self, name, value):
        self.__dict__[name] = value


currentBeacon = CurrentBeacon(None, None)

print("Starting server")
sio = socketio.Client()


@sio.event
def connect():
    print('connection established')


# @sio.event
def my_message(data):
    # print('data: ', data)
    sio.emit('response', data)


@sio.event
def disconnect():
    print('disconnected from server')


def beaconMsg(bt_addr, rssi, packet, additional_info):
    currentBeacon.__setattr__("bt_addr",  bt_addr)
    currentBeacon.__setattr__("rssi",  rssi)
    # print("<%s, %d> %s %s" % (bt_addr, rssi, packet, additional_info))


scanner = BeaconScanner(beaconMsg, packet_filter=[EddystoneUIDFrame])

# INITIALISATION DONE

try:
    scanner.start()
    sio.connect('https://frequency-station-server.herokuapp.com/')
    print('started server')
    while True:
        (heading, minutes) = compass.getHeading()
        data = {
            "bt_addr": currentBeacon.bt_addr,
            "rssi": currentBeacon.rssi,
            # "packet": packet,
            # "additional_info": additional_info,
            "knobs": {
                "heading": heading,
                "balance": round(analog.read(0)/5, 2),
                "variance": round(analog.read(1)/5, 2),
                "frequency": round(analog.read(2)/5, 2)
            }}
        print("data: ", data)
        time.sleep(.2)
        my_message(data)

except KeyboardInterrupt:
    scanner.stop()
    disconnect()
    leds.off()
