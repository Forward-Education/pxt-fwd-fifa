# fwd-fifa

MakeCode extension for the Forward Education **FIFA micro:bit breakout board** (micro:bit V2 only).

Out of the box:

- **Encoded DC motors** — 2× TT gearmotor ports driven by the onboard DRV8833
  (P13–P16), with quadrature encoder counting and RPM (P8/P9, P0/P1)
- **Servo ports** — 3× 270° servo edge ports via the onboard Jacdac brain
- **Relay port** — via the onboard Jacdac brain
- **Battery** — voltage and level blocks, served by the brain over Jacdac
- **NeoPixels** — on the 3-pin aux header (P2), power-budget-aware defaults
- **GPIO expander** — MCP23017 @ 0x20 behind the 5-pin aux header
- **Jacdac** — full jacdac module support on the 4 Jacdac edge ports (P12)

## Status: scaffold (pre-hardware alpha)

Built ahead of first boards. Known gaps, in priority order:

1. **Encoder decoding is a TypeScript MVP** — 1× decoding on channel A, sign
   from commanded direction. Fine for speed control; loses counts on reversal.
   Planned: C++ GPIOTE shim for true 4× signed quadrature (first native code
   in the fwd extension family — budget accordingly). Blocked on measured
   encoder CPR from the production motor.
2. **No closed loop yet** — PI speed control / drive-straight / move-cm blocks
   land after encoder CPR + wheel geometry are known.
3. **NeoPixel surface is strip-level** (self-contained on `ws2812b`, all blocks
   under Lights, brightness capped at 25% for the 0.5 A header limit). The
   richer fwd-neopixel matrix/animation surface can be lifted later.
4. **Brain binding uses role grouping** (`fifaBrain/*?srvo=N`), not product-ID
   binding (which doesn't exist in pxt-jacdac role queries).
5. Localization (`_locales/{de,es,fr}`) not yet generated.
6. `icon.png` is a placeholder — replace with the brand asset before launch.

## Blocks API

### Motors (`fwdMotors`)

```sig
fwdMotors.setSpeed(FwdFifaMotor.M1, 50)
```
Run a motor at a speed from `-100` to `100` %. Positive is forward.

```sig
fwdMotors.stop(FwdFifaMotor.M1, FwdFifaStopMode.Brake)
```
Stop a motor, braking (short the windings) or coasting (freewheel).

```sig
fwdMotors.tank(50, 50)
```
Run both motors at once (tank drive): left = motor 1, right = motor 2.

```sig
fwdMotors.stopAll()
```
Stop both motors (brake).

```sig
fwdMotors.servoPort1.setAngle(135)
```
Move a servo edge port (1–3) to an angle, 0–270 degrees.

```sig
fwdMotors.setRelay(true)
```
Switch the relay port on or off.

### Sensors (`fwdSensors`)

```sig
fwdSensors.batteryVoltage()
```
The battery voltage in volts, measured by the onboard brain.

```sig
fwdSensors.batteryLevel()
```
The battery charge level as a percentage (LiPo: 3.3 V = 0 %, 4.2 V = 100 %).

```sig
fwdSensors.encoderCount(FwdFifaEncoder.M1)
```
The encoder count for a motor since reset. Forward counts up.

```sig
fwdSensors.speedRPM(FwdFifaEncoder.M1)
```
The motor speed in revolutions per minute of the output shaft. Requires
counts-per-revolution to be set first.

```sig
fwdSensors.resetEncoder(FwdFifaEncoder.M1)
```
Reset a motor's encoder count to zero.

```sig
fwdSensors.setCountsPerRevolution(576)
```
Set how many encoder counts equal one full turn of the output shaft.

```sig
fwdSensors.expanderWrite(FwdFifaExpanderPin.P1, 1)
```
Set a 5-pin-header GPIO high or low (under Sensors → more; makes it an output).

```sig
fwdSensors.expanderRead(FwdFifaExpanderPin.P1)
```
Read an expander pin (makes it an input).

```sig
fwdSensors.expanderPullUp(FwdFifaExpanderPin.P1, true)
```
Turn the internal pull-up on or off for an expander pin.

```sig
fwdSensors.expanderConnected()
```
Whether the expander answers on the I2C bus.

### Lights (`fwdLights`)

All NeoPixel blocks live under the **Lights** drawer (self-contained driver on
P2 — no separate Neopixel category).

```sig
fwdLights.initStrip(8)
```
Set up the strip plugged into the 3-pin header. Brightness starts capped at
25 % to stay inside the header's 0.5 A power budget.

```sig
fwdLights.setAllPixels(0x00ff00)
```
Set every pixel to a color (color picker).

```sig
fwdLights.setPixel(0, 0xff0000)
```
Set one pixel to a color (pixel 0 is closest to the board).

```sig
fwdLights.setBrightness(64)
```
Set the strip brightness, 0–255.

```sig
fwdLights.clearPixels()
```
Turn all pixels off.

```sig
fwdLights.rotatePixels(1)
```
Move every pixel's color along the strip, wrapping around.

```sig
fwdLights.rgb(255, 128, 0)
```
Make a color from red/green/blue parts (under Lights → more).

## Conventions

Follows `pxt-fwd-base` / `pxt-fwd-modules` style: shared drawers (`fwdMotors`
#239DD1, `fwdLights` #CCBB00, `fwdSensors` #5BA42D), `$param` block syntax,
`blockId=fwd_fifa_*`, lowercase block text, units in parentheses, full JSDoc.

## Hardware

Board design: `hw-fifa-breakout-board-v2.5` (REV A). Pin map and firmware
architecture: `hw-fifa-breakout-board-v2.5/docs/firmware-plan.md`. Brain
firmware target: `firmware/targets/fwd-fifa-breakout`.

## Use as Extension

This repository can be added as an **extension** in MakeCode:

- open [https://makecode.microbit.org/](https://makecode.microbit.org/)
- click on **New Project**
- click on **Extensions** under the gearwheel menu
- search for **https://github.com/Forward-Education/pxt-fwd-fifa** and import

#### Metadata (used for search, rendering)

- for PXT/microbit
