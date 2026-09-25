// Compilation test — one of each block (Forward convention: drag one of each
// block into a program and copy the JavaScript).
//
// Covered signatures:
//   fwdMotors.setSpeed / setReversed / stop / tank / stopAll / setRelay
//   fwdMotors.servoPort1.setType / setAngle / runAt / release
//   fwdMotors.setHeaderServoType / setHeaderServoAngle / runHeaderServo / releaseHeaderServo
//   fwdMotors.driveFor / turnFor / startDriving / stopDriving
//   fwdMotors.setDriveSpeed / setDistancePerRotation / setWheelSpacing
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
fwdMotors.setReversed(FwdFifaMotor.M2, true)
fwdMotors.stop(FwdFifaMotor.M1, FwdFifaStopMode.Coast)
fwdMotors.stopAll()

fwdMotors.setDistancePerRotation(21.36)
fwdMotors.setWheelSpacing(13.5)
fwdMotors.setDriveSpeed(40)
fwdMotors.driveFor(FwdFifaDirection.Forward, 20, FwdFifaMoveUnit.Cm)
fwdMotors.driveFor(FwdFifaDirection.Backward, 2, FwdFifaMoveUnit.Rotations)
fwdMotors.driveFor(FwdFifaDirection.Forward, 1, FwdFifaMoveUnit.Seconds)
fwdMotors.turnFor(FwdFifaTurn.Right, 90)
fwdMotors.startDriving(FwdFifaDirection.Forward)
fwdMotors.stopDriving()

fwdMotors.servoPort1.setType(FwdFifaServoType.Positional180)
fwdMotors.servoPort1.setAngle(90)
fwdMotors.servoPort2.setType(FwdFifaServoType.Continuous)
fwdMotors.servoPort2.runAt(50)
fwdMotors.servoPort2.release()
fwdMotors.servoPort3.setAngle(135)
fwdMotors.servoPort1.release()

fwdMotors.setHeaderServoType(FwdFifaServoType.Positional180)
fwdMotors.setHeaderServoAngle(90)
fwdMotors.runHeaderServo(-30)
fwdMotors.releaseHeaderServo()
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
