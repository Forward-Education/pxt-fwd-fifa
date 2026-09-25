/**
 * FIFA breakout — distance-based driving (SPIKE-style movement blocks).
 *
 * These blocks treat the two motors as one driving base and use the encoders
 * to travel a measured distance, rather than "run for a while and hope".
 *
 * Kit geometry, measured on the sample chassis 2026-09-04:
 *   wheel diameter 68 mm  -> circumference 21.36 cm
 *   track width (wheel centre to wheel centre) 138.5 mm
 * With 1680 counts per wheel revolution that gives 78.6 counts/cm (0.13 mm
 * per count) and 9.5 counts per degree of pivot turn — far finer than wheel
 * slip, so slip is what actually limits accuracy, not the encoder.
 *
 * SPEED CAP (deliberate, temporary): encoder counting is still TypeScript pin
 * events, and both motors at full speed generate ~4400 events/s — above the
 * ~2.6 kHz rate that has been observed to starve buttons, serial and Jacdac.
 * The drive blocks therefore cap at MAX_DRIVE_SPEED. The uncapped single-motor
 * blocks (set motor / drive left+right) are unaffected. Once encoder counting
 * moves to a C++ shim the cap can be raised without changing this API.
 */

enum FwdFifaDirection {
    //% block="forward"
    Forward = 1,
    //% block="backward"
    Backward = -1,
}

enum FwdFifaMoveUnit {
    //% block="cm"
    Cm = 0,
    //% block="rotations"
    Rotations = 1,
    //% block="seconds"
    Seconds = 2,
}

enum FwdFifaTurn {
    //% block="left"
    Left = -1,
    //% block="right"
    Right = 1,
}

namespace fwdMotors {
    const DEFAULT_DISTANCE_PER_ROTATION_CM = 21.36 // 68 mm wheel
    // EFFECTIVE spacing, not the tape measure: wheel centres are 13.85-14.0 cm
    // apart, but the wide tyres scrub on a pivot turn and the car turned ~2.5°
    // extra per 90° (REV_E car, 2026-09-25) -> 13.85 x 90 / 92.5 = 13.5.
    const DEFAULT_WHEEL_SPACING_CM = 13.5
    const MAX_DRIVE_SPEED = 40 // see SPEED CAP above
    const DEFAULT_DRIVE_SPEED = 40

    // Bench figure: counts/s per motor at 100 %. Only used to size timeouts.
    const COUNTS_PER_SEC_AT_FULL = 2200
    const STALL_MS = 600 // no encoder movement for this long -> give up
    const LOOP_MS = 5
    const TRIM_GAIN = 8 // counts of error per 1 % of speed correction
    // Slow down over the last RAMP_COUNTS so the robot arrives slowly instead
    // of sliding past on the brake (REV_E car 2026-09-25: ~4° overshoot per
    // 90° turn at a flat 40 %). 200 counts ≈ 2.5 cm or 21° of turn.
    const RAMP_COUNTS = 200
    const RAMP_MIN_SPEED = 20 // below this TT motors can stall under load

    let _distancePerRotationCm = DEFAULT_DISTANCE_PER_ROTATION_CM
    let _driveSpeed = DEFAULT_DRIVE_SPEED
    let _wheelSpacingCm = DEFAULT_WHEEL_SPACING_CM

    function countsPerCm(): number {
        if (_distancePerRotationCm <= 0) return 0
        return fwdSensors._countsPerRevolution() / _distancePerRotationCm
    }

    /**
     * Set how far the robot travels for one full turn of its wheels. The
     * default (21.36 cm) matches the wheels in the kit. To measure your own,
     * mark a wheel, roll the robot forward exactly one wheel turn, and
     * measure how far it moved.
     * @param distance distance travelled per wheel rotation (cm)
     */
    //% group="Driving"
    //% block="set 1 rotation to distance moved $distance cm"
    //% blockId=fwd_fifa_set_distance_per_rotation
    //% distance.defl=21.36
    //% weight=79
    export function setDistancePerRotation(distance: number): void {
        _distancePerRotationCm = Math.max(0, distance)
    }

    /**
     * Set the distance between the two wheels, used to work out turns. The
     * default (13.5 cm) is tuned for the car in the kit. If turns come out too far,
     * make this smaller; too short, make it bigger. To tune it, turn 360° and
     * scale by how far it really went: new = old x 360 / degrees turned.
     * @param spacing wheel centre to wheel centre (cm)
     */
    //% group="Driving"
    //% block="set wheel spacing to $spacing cm"
    //% blockId=fwd_fifa_set_wheel_spacing
    //% spacing.defl=13.5
    //% weight=78
    export function setWheelSpacing(spacing: number): void {
        _wheelSpacingCm = Math.max(0, spacing)
    }

    /**
     * Set the speed used by the driving blocks, as a percentage.
     * Capped at 40 % so that encoder counting stays reliable.
     * @param speed drive speed from 1 to 40 (%)
     */
    //% group="Driving"
    //% block="set drive speed to $speed \\%"
    //% blockId=fwd_fifa_set_drive_speed
    //% speed.min=1 speed.max=40 speed.defl=40
    //% weight=89
    export function setDriveSpeed(speed: number): void {
        _driveSpeed = Math.constrain(speed, 1, MAX_DRIVE_SPEED)
    }

    /**
     * Drive both motors a set distance, then stop.
     * Blocks until the robot has travelled the distance (or stalls).
     * @param direction forward or backward
     * @param value how far to travel
     * @param unit centimetres, wheel rotations, or seconds
     */
    //% group="Driving"
    //% block="drive $direction for $value $unit"
    //% blockId=fwd_fifa_drive_for
    //% value.defl=20
    //% weight=99
    export function driveFor(
        direction: FwdFifaDirection,
        value: number,
        unit: FwdFifaMoveUnit
    ): void {
        if (value <= 0) return
        if (unit === FwdFifaMoveUnit.Seconds) {
            startDriving(direction)
            basic.pause(Math.round(value * 1000))
            stopDriving()
            return
        }
        const perUnit =
            unit === FwdFifaMoveUnit.Rotations
                ? fwdSensors._countsPerRevolution()
                : countsPerCm()
        runCounts(direction, direction, Math.round(value * perUnit))
    }

    /**
     * Turn the robot on the spot by a number of degrees, then stop.
     * Blocks until the turn is finished (or the robot stalls). Pivot turns
     * slip more than straight lines, so expect a few degrees of error.
     * @param direction left or right
     * @param degrees how far to turn (degrees)
     */
    //% group="Driving"
    //% block="turn $direction for $degrees °"
    //% blockId=fwd_fifa_turn_for
    //% degrees.min=1 degrees.max=360 degrees.defl=90
    //% weight=98
    export function turnFor(direction: FwdFifaTurn, degrees: number): void {
        if (degrees <= 0) return
        // Each wheel travels along the pivot circle of diameter = track width.
        const cmPerDegree = (Math.PI * _wheelSpacingCm) / 360
        const target = Math.round(degrees * cmPerDegree * countsPerCm())
        // right turn: left wheel forward, right wheel back
        runCounts(direction, -direction, target)
    }

    /**
     * Start both motors driving, and keep going until told to stop.
     * @param direction forward or backward
     */
    //% group="Driving"
    //% block="start driving $direction"
    //% blockId=fwd_fifa_start_driving
    //% weight=97
    export function startDriving(direction: FwdFifaDirection): void {
        tank(_driveSpeed * direction, _driveSpeed * direction)
    }

    /**
     * Stop both motors.
     */
    //% group="Driving"
    //% block="stop driving"
    //% blockId=fwd_fifa_stop_driving
    //% weight=96
    export function stopDriving(): void {
        stopAll()
    }

    /**
     * Drive until both wheels have turned `target` counts, keeping them in
     * step, then brake. Gives up on a stall or a generous timeout so a jammed
     * wheel can never hang a student's program.
     */
    function runCounts(dirLeft: number, dirRight: number, target: number): void {
        if (target <= 0) return
        const speed = _driveSpeed
        const start1 = fwdSensors.encoderCount(FwdFifaEncoder.M1)
        const start2 = fwdSensors.encoderCount(FwdFifaEncoder.M2)

        // motor 1 = right wheel, motor 2 = left wheel (see motors.ts)
        setSpeed(FwdFifaMotor.M1, speed * dirRight)
        setSpeed(FwdFifaMotor.M2, speed * dirLeft)

        // Generous safety net: 3x the expected time, plus a second of slack.
        const expectedMs = Math.idiv(
            target * 1000,
            Math.max(1, Math.idiv(COUNTS_PER_SEC_AT_FULL * speed, 100))
        )
        const deadline = control.millis() + expectedMs * 3 + 1000

        let best = 0
        let lastProgressAt = control.millis()
        let appliedTrim = 0
        let appliedSpeed = speed

        while (true) {
            const d1 = Math.abs(fwdSensors.encoderCount(FwdFifaEncoder.M1) - start1)
            const d2 = Math.abs(fwdSensors.encoderCount(FwdFifaEncoder.M2) - start2)
            const progress = Math.idiv(d1 + d2, 2)
            if (progress >= target) break

            const now = control.millis()
            if (progress > best) {
                best = progress
                lastProgressAt = now
            } else if (now - lastProgressAt > STALL_MS) {
                break // wheel jammed or robot held — stop rather than hang
            }
            if (now > deadline) break

            // Ease off towards the end, but never below the stall floor.
            const remaining = target - progress
            const cur =
                remaining < RAMP_COUNTS
                    ? Math.max(
                          Math.min(speed, RAMP_MIN_SPEED),
                          Math.idiv(speed * remaining, RAMP_COUNTS)
                      )
                    : speed

            // Keep the wheels in step: slow whichever one is ahead.
            const maxTrim = Math.idiv(cur, 2)
            const trim = Math.constrain(
                Math.idiv(d1 - d2, TRIM_GAIN),
                -maxTrim,
                maxTrim
            )
            if (trim !== appliedTrim || cur !== appliedSpeed) {
                appliedTrim = trim
                appliedSpeed = cur
                setSpeed(FwdFifaMotor.M1, (cur - trim) * dirRight)
                setSpeed(FwdFifaMotor.M2, (cur + trim) * dirLeft)
            }
            basic.pause(LOOP_MS)
        }
        stopAll()
    }
}
