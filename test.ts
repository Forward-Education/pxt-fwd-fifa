// Compilation test — one of each block (Forward convention: drag one of each
// block into a program and copy the JavaScript).
//
// Covered signatures:
//   fwdMotors.setSpeed / stop / tank / stopAll / servoPort1.setAngle / setRelay
//   fwdSensors.encoderCount / speedRPM / resetEncoder / setCountsPerRevolution
//   fwdSensors.batteryVoltage / batteryLevel
//   fwdSensors.expanderWrite / expanderRead / expanderPullUp / expanderConnected
//   fwdSensors.expanderRegWrite / expanderRegRead
//   fwdLights.initStrip / setAllPixels / setPixel / setBrightness / clearPixels
//   fwdLights.rotatePixels / rgb

fwdSensors.setCountsPerRevolution(1680)

fwdLights.initStrip(8)
fwdLights.setBrightness(64)
fwdLights.setAllPixels(0x00ff00)
fwdLights.setPixel(0, fwdLights.rgb(255, 0, 0))
fwdLights.rotatePixels(1)
fwdLights.clearPixels()

fwdMotors.setSpeed(FwdFifaMotor.M1, 50)
fwdMotors.setSpeed(FwdFifaMotor.M2, -50)
fwdMotors.tank(30, 30)
fwdMotors.stop(FwdFifaMotor.M1, FwdFifaStopMode.Coast)
fwdMotors.stopAll()

fwdMotors.servoPort1.setAngle(135)
fwdMotors.setRelay(true)

fwdSensors.expanderPullUp(FwdFifaExpanderPin.P1, true)
fwdSensors.expanderWrite(FwdFifaExpanderPin.P2, 1)

// Advanced raw register access (MCP23017, IOCON.BANK = 0):
// make all of port B an output, drive it high, then read the port back.
fwdSensors.expanderRegWrite(0x01, 0x00) // IODIRB = all outputs
fwdSensors.expanderRegWrite(0x15, 0xff) // OLATB  = all high
serial.writeValue("gpiob", fwdSensors.expanderRegRead(0x13)) // GPIOB

basic.forever(() => {
    serial.writeValue("enc1", fwdSensors.encoderCount(FwdFifaEncoder.M1))
    serial.writeValue("rpm2", fwdSensors.speedRPM(FwdFifaEncoder.M2))
    serial.writeValue("gpa0", fwdSensors.expanderRead(FwdFifaExpanderPin.P1))
    serial.writeValue("i2c", fwdSensors.expanderConnected() ? 1 : 0)
    serial.writeValue("vbat", fwdSensors.batteryVoltage())
    basic.pause(500)
})

input.onButtonPressed(Button.A, () => {
    fwdSensors.resetEncoder(FwdFifaEncoder.M1)
    fwdSensors.resetEncoder(FwdFifaEncoder.M2)
    basic.showNumber(fwdSensors.batteryLevel())
})
