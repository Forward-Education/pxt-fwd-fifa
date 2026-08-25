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
3. **NeoPixel surface is a thin factory** over `microsoft/pxt-neopixel` pinned
   to P2 with brightness capped at 25% (header supply is current-limited to
   0.5 A ≈ 8 px full white). The richer fwd-neopixel matrix/animation surface
   can be lifted later.
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

```sig
fwdMotors.batteryVoltage()
```
The battery voltage in volts, measured by the onboard brain.

```sig
fwdMotors.batteryLevel()
```
The battery charge level as a percentage (LiPo: 3.3 V = 0 %, 4.2 V = 100 %).

### Sensors (`fwdSensors`)

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
Set an expander pin on the 5-pin header high or low (makes it an output).

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

```sig
fwdLights.createStrip(8)
```
Create a NeoPixel strip plugged into the 3-pin header (P2). Brightness starts
capped at 25 % to stay inside the header's 0.5 A power budget; raise it with
the strip's set-brightness block for short strips. Returns a standard
`neopixel.Strip`, so all `neopixel` blocks work on it.

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
