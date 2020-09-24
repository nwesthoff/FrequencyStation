from envirophat import leds
import time
from i2clibraries import i2c_hmc5883l

# INITIALISATION START

compass = i2c_hmc5883l.i2c_hmc5883l(1)
compass.setContinuousMode()
compass.setDeclination(1, 47)

# INITIALISATION DONE


try:
    print('started compass')
    while True:
        heading = compass.getHeading()
        print(heading)
        time.sleep(.2)

except KeyboardInterrupt:
    leds.off()
