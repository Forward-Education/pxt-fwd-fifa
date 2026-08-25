// Compilation test — one of each block (Forward convention: drag one of each
// block into a program and copy the JavaScript).
//
// Covered signatures:
//   fwdMotors.setSpeed / stop / tank / stopAll
//   fwdMotors.servoPort1.setAngle / setRelay
//   fwdSensors.encoderCount / speedRPM / resetEncoder / setCountsPerRevolution
//   fwdSensors.expanderWrite / expanderRead / expanderPullUp / expanderConnected
//   fwdLights.createStrip

fwdSensors.setCountsPerRevolution(576)

let strip = fwdLights.createStrip(8)
strip.showColor(neopixel.colors(NeoPixelColors.Green))

fwdMotors.setSpeed(FwdFifaMotor.M1, 50)
fwdMotors.setSpeed(FwdFifaMotor.M2, -50)
fwdMotors.tank(30, 30)
fwdMotors.stop(FwdFifaMotor.M1, FwdFifaStopMode.Coast)
fwdMotors.stopAll()

fwdMotors.servoPort1.setAngle(135)
fwdMotors.setRelay(true)

fwdSensors.expanderPullUp(FwdFifaExpanderPin.P1, true)
fwdSensors.expanderWrite(FwdFifaExpanderPin.P2, 1)

basic.forever(() => {
    serial.writeValue("enc1", fwdSensors.encoderCount(FwdFifaEncoder.M1))
    serial.writeValue("rpm2", fwdSensors.speedRPM(FwdFifaEncoder.M2))
    serial.writeValue("gpa0", fwdSensors.expanderRead(FwdFifaExpanderPin.P1))
    serial.writeValue("i2c", fwdSensors.expanderConnected() ? 1 : 0)
    basic.pause(500)
})

input.onButtonPressed(Button.A, () => {
    fwdSensors.resetEncoder(FwdFifaEncoder.M1)
    fwdSensors.resetEncoder(FwdFifaEncoder.M2)
})
basic.showNumber(fwdMotors.batteryLevel())
