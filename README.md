# fwd-fifa

MakeCode extension for the Forward Education **FIFA breakout board** — a
circular, battery-powered robotics hub for the BBC micro:bit.

Slot a micro:bit into the board's edge connector and it gains motors, servos,
a relay, lights and sensor ports, all powered from the onboard rechargeable
battery. Everything is programmed from MakeCode with the blocks below.

The FIFA breakout board is distributed by the FIFA Foundation as part of its
Digital Education Programme and is not sold separately. This extension is
developed and maintained by [Forward Education](https://forwardedu.com).

### ~ reminder

![works with micro:bit V2 only image](/static/v2/v2-only.png)

The FIFA board works with **micro:bit V2 only**.

### ~

## What's on the board

| Port | What you plug in | Blocks |
|---|---|---|
| 2 × motor ports | TT gearmotors with encoders | Motors, Sensors |
| 3 × servo ports | 180°, 270° or continuous-rotation servos (4.8–6 V) | Motors |
| 3-pin header | a Dupont/JR servo (3.3–6 V rated — the header supplies 3.3 V) or a NeoPixel strip | Motors / Lights |
| 1 × relay port | A device to switch on and off | Motors |
| 4 × Jacdac ports | Any Jacdac module | that module's extension |
| 3-pin header | A NeoPixel strip | Lights |
| 5-pin header | Up to 3 extra on/off signals | Sensors → more |
| 4-pin header | I2C devices — use the micro:bit's own I2C blocks | — |
| Battery | 1S LiPo, charges over USB | Sensors |

## Add the extension

1. Open [makecode.microbit.org](https://makecode.microbit.org/)
2. Click **Extensions** under the gearwheel menu
3. Search for `https://github.com/Forward-Education/pxt-fwd-fifa` and import

The **Motors**, **Lights** and **Sensors** categories appear in the toolbox.

## Example

Button **A** drives the robot in a 30 cm square. The NeoPixel strip shows
green while the battery is healthy and red when it's low.

```blocks
input.onButtonPressed(Button.A, function () {
    for (let i = 0; i < 4; i++) {
        fwdMotors.driveFor(FwdFifaDirection.Forward, 30, FwdFifaMoveUnit.Cm)
        fwdMotors.turnFor(FwdFifaTurn.Right, 90)
    }
})
fwdLights.initStrip(8)
basic.forever(function () {
    if (fwdSensors.batteryLevel() < 20) {
        fwdLights.setAllPixels(0xff0000)
    } else {
        fwdLights.setAllPixels(0x00ff00)
    }
    basic.pause(1000)
})
```

## Blocks

### Driving

These blocks use the encoders to travel a measured distance, so the robot goes
the same distance whether the battery is full or nearly flat.

```sig
fwdMotors.driveFor(FwdFifaDirection.Forward, 20, FwdFifaMoveUnit.Cm)
```
Drive both motors a set distance, then stop — in centimetres, wheel rotations
or seconds. The program waits until the robot has finished moving.

```sig
fwdMotors.turnFor(FwdFifaTurn.Right, 90)
```
Turn the robot on the spot by a number of degrees, then stop.

```sig
fwdMotors.startDriving(FwdFifaDirection.Forward)
```
Start driving and keep going until told to stop.

```sig
fwdMotors.stopDriving()
```
Stop both motors.

```sig
fwdMotors.setDriveSpeed(40)
```
Set the speed the driving blocks use, 1–40 %.

```sig
fwdMotors.setDistancePerRotation(21.36)
```
How far the robot travels for one full turn of its wheels. The default matches
the wheels in the kit. To measure your own: mark a wheel, roll the robot
forward exactly one wheel turn, and measure how far it moved.

```sig
fwdMotors.setWheelSpacing(13.5)
```
The distance between the two wheels, used to work out turns. The default
(13.5 cm) is tuned for the kit car: a little less than the tape-measured
13.85 cm, because the tyres scrub as the car pivots. If turns go too
far, make it smaller; if they stop short, make it bigger. To tune it: turn
360°, see how far the robot really turned, and set
`new spacing = old spacing × 360 ÷ degrees turned`.

> **Why 40 %?** The driving blocks are limited to 40 % speed (about 11 cm/s) so
> that encoder counting stays reliable. The `set motor` and `drive left/right`
> blocks below are not limited, but they don't measure distance.

> Turning on the spot slips more than driving straight, so expect a few degrees
> of error on a turn. Driving straight is accurate to a few millimetres.

### Motors

```sig
fwdMotors.setSpeed(FwdFifaMotor.M1, 50)
```
Run a motor at a speed from `-100` to `100` %. Positive is forward.

On the car in the kit, **motor 1 is the right wheel** (port J5) and **motor 2
is the left wheel** (port J6). The two motors are mounted facing opposite ways,
so motor 2 starts out reversed: "forward" drives the car forward on both.

```sig
fwdMotors.tank(50, 50)
```
Run both motors at once (tank drive): left = motor 2, right = motor 1.

```sig
fwdMotors.setReversed(FwdFifaMotor.M2, true)
```
Reverse which way a motor turns for "forward". Motor 2 starts reversed, which
is right for the kit car. If you build something else and a motor runs
backwards, change it here.

```sig
fwdMotors.stop(FwdFifaMotor.M1, FwdFifaStopMode.Brake)
```
Stop a motor, braking (short the windings) or coasting (freewheel).

```sig
fwdMotors.stopAll()
```
Stop both motors (brake).

### Servos and relay

```sig
fwdMotors.servoPort1.setType(FwdFifaServoType.Positional180)
```
Tell the board what kind of servo is on a servo port: a **180° servo** (most 9 g
servos), a **270° servo**, or a **continuous rotation servo**. The port starts as
270°. Set the type once at the start of the program.

```sig
fwdMotors.servoPort1.setAngle(90)
```
Move a servo port (1–3) to an angle. 0–180 for a 180° servo, 0–270 for a 270° one.

```sig
fwdMotors.servoPort1.runAt(50)
```
Run a continuous-rotation servo at a speed, −100 % to 100 %. 0 stops it.

```sig
fwdMotors.servoPort1.release()
```
Stop driving the servo. A positional servo stops holding its angle (and stops
drawing current); a continuous servo stops turning.

#### Servo on the 3-pin header

The 3-pin header takes a servo plug directly (signal on P2). The header supplies
**3.3 V**, so use a servo rated for 3.3–6 V. One servo only.

```sig
fwdMotors.setHeaderServoType(FwdFifaServoType.Positional180)
```
```sig
fwdMotors.setHeaderServoAngle(90)
```
```sig
fwdMotors.runHeaderServo(50)
```
```sig
fwdMotors.releaseHeaderServo()
```
Same four operations for the header servo.

```sig
fwdMotors.setRelay(true)
```
Switch the relay port on or off.

> The servo and relay ports are served by the board's onboard Jacdac brain,
> which takes a few seconds to connect after power-on. If a servo doesn't move
> in the first moments of a program, give it a short `pause` on start.

### Encoders

The motors count how far they have turned, so your program can drive a set
distance or measure speed.

```sig
fwdSensors.encoderCount(FwdFifaEncoder.M1)
```
The encoder count for a motor since reset. Forward counts up.

```sig
fwdSensors.resetEncoder(FwdFifaEncoder.M1)
```
Reset a motor's encoder count to zero.

```sig
fwdSensors.speedRPM(FwdFifaEncoder.M1)
```
The motor speed in revolutions per minute of the output shaft.

```sig
fwdSensors.setCountsPerRevolution(1680)
```
How many encoder counts equal one full turn of the wheel. The default (1680)
is right for the motors in the kit — you only need this block if you fit
motors with a different gearbox.

### Battery

```sig
fwdSensors.batteryVoltage()
```
The battery voltage in volts.

```sig
fwdSensors.batteryLevel()
```
The battery charge level as a percentage (3.3 V = 0 %, 4.2 V = 100 %).

### Lights

NeoPixel blocks drive a strip plugged into the 3-pin header.

```sig
fwdLights.initStrip(8)
```
Set up the strip. Brightness starts at 25 % so that a long strip stays inside
the header's power budget.

```sig
fwdLights.setAllPixels(0x00ff00)
```
Set every pixel to a color.

```sig
fwdLights.setPixel(0, 0xff0000)
```
Set one pixel to a color (pixel 0 is closest to the board).

```sig
fwdLights.clearPixels()
```
Turn all pixels off.

```sig
fwdLights.rotatePixels(1)
```
Move every pixel's color along the strip, wrapping around.

```sig
fwdLights.setBrightness(64)
```
Set the strip brightness, 0–255.

```sig
fwdLights.rgb(255, 128, 0)
```
Make a color from red/green/blue parts (under Lights → more).

> The 3-pin header supplies about half an amp. That lights roughly 8 pixels at
> full-brightness white, or around 30 at the default brightness. Going over
> that dims the strip; it can't harm the board.

### 5-pin header

Three extra on/off signals, under **Sensors → more**.

```sig
fwdSensors.expanderWrite(FwdFifaExpanderPin.P1, 1)
```
Set a header pin high or low (makes it an output).

```sig
fwdSensors.expanderRead(FwdFifaExpanderPin.P1)
```
Read a header pin (makes it an input).

```sig
fwdSensors.expanderPullUp(FwdFifaExpanderPin.P1, true)
```
Turn the internal pull-up on or off for a header pin.

```sig
fwdSensors.expanderConnected()
```
Whether the header's expander chip answers on the I2C bus.

## Use as Extension

This repository can be added as an **extension** in MakeCode:

- open [https://makecode.microbit.org/](https://makecode.microbit.org/)
- click on **New Project**
- click on **Extensions** under the gearwheel menu
- search for **https://github.com/Forward-Education/pxt-fwd-fifa** and import

## Edit this project

To edit this repository in MakeCode:

- open [https://makecode.microbit.org/](https://makecode.microbit.org/)
- click on **Import** then click on **Import URL**
- paste **https://github.com/Forward-Education/pxt-fwd-fifa** and click import

#### Metadata (used for search, rendering)

- for PXT/microbit

<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
