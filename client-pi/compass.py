from envirophat import motion, analog, leds
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
        (heading, minutes) = compass.getHeading()
        compareHeading = motion.heading()
        print(heading, compareHeading)
        time.sleep(.2)

except KeyboardInterrupt:
    leds.off()
