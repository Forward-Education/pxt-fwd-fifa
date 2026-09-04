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
| 3 × servo ports | 270° servos | Motors |
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

Button **A** drives forward and counts wheel turns; button **B** stops. The
NeoPixel strip shows green while the battery is healthy and red when it's low.

```blocks
input.onButtonPressed(Button.A, function () {
    fwdSensors.resetEncoder(FwdFifaEncoder.M1)
    fwdMotors.tank(60, 60)
})
input.onButtonPressed(Button.B, function () {
    fwdMotors.stopAll()
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

### Motors

```sig
fwdMotors.setSpeed(FwdFifaMotor.M1, 50)
```
Run a motor at a speed from `-100` to `100` %. Positive is forward.

```sig
fwdMotors.tank(50, 50)
```
Run both motors at once (tank drive): left = motor 1, right = motor 2.

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
fwdMotors.servoPort1.setAngle(135)
```
Move a servo port (1–3) to an angle, 0–270 degrees.

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
