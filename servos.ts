/**
 * FIFA breakout — servo type selection.
 *
 * The board has two kinds of servo connection:
 *  - SERVO 1-3 edge ports, driven by the onboard Jacdac brain (4.5 V rail);
 *  - the 3-pin header J7 (signal = micro:bit P2, 3.3 V supply), which takes a
 *    Dupont/JR servo plug directly.
 *
 * Servos come in three flavours and all three are supported on both:
 *  - 180° positional (typical 9 g servo, 500-2500 µs),
 *  - 270° positional (600-2500 µs, the brain's factory default),
 *  - continuous rotation (1000-2000 µs, 1500 µs = stop; speed, not angle).
 *
 * Selecting a type only changes the pulse mapping. The supply voltage is fixed
 * by the hardware (header = 3.3 V, so use 3.3-6 V rated servos there).
 */

enum FwdFifaServoType {
    //% block="180° servo"
    Positional180 = 180,
    //% block="270° servo"
    Positional270 = 270,
    //% block="continuous rotation servo"
    Continuous = 360,
}

namespace fwdMotors {
    // [minPulse µs, maxPulse µs, minAngle °, maxAngle °]
    export function _servoRange(type: FwdFifaServoType): number[] {
        switch (type) {
            case FwdFifaServoType.Positional180:
                return [500, 2500, 0, 180]
            case FwdFifaServoType.Continuous:
                return [1000, 2000, -100, 100]
            default:
                return [600, 2500, 0, 270]
        }
    }

    /** Pulse (µs) for an angle on a positional servo of the given type. */
    export function _servoPulseForAngle(type: FwdFifaServoType, angle: number): number {
        const r = _servoRange(type)
        const a = Math.constrain(angle, r[2], r[3])
        return Math.round(r[0] + ((a - r[2]) * (r[1] - r[0])) / (r[3] - r[2]))
    }

    /** Pulse (µs) for a speed (-100..100 %) on a continuous-rotation servo. */
    export function _servoPulseForSpeed(speed: number): number {
        const s = Math.constrain(Math.round(speed), -100, 100)
        return 1500 + s * 5
    }

    /**
     * The servo plugged into the 3-pin header (J7, signal on P2, 3.3 V).
     */
    export class FwdFifaHeaderServo {
        private _type: FwdFifaServoType
        private _pin: AnalogPin

        constructor() {
            this._type = FwdFifaServoType.Positional180
            this._pin = AnalogPin.P2
        }

        /**
         * Tell the board what kind of servo is plugged into the 3-pin header.
         * @param type the servo type
         */
        setType(type: FwdFifaServoType): void {
            this._type = type
        }

        /**
         * Move the header servo to an angle (180° or 270° servos).
         * @param angle target angle in degrees
         */
        setAngle(angle: number): void {
            if (this._type == FwdFifaServoType.Continuous) {
                // on a continuous servo "angle" makes no sense; treat as stop
                pins.servoSetPulse(this._pin, 1500)
                return
            }
            pins.servoSetPulse(this._pin, _servoPulseForAngle(this._type, angle))
        }

        /**
         * Run the header servo at a speed (continuous rotation servos).
         * @param speed -100 (full reverse) to 100 (full forward)
         */
        run(speed: number): void {
            pins.servoSetPulse(this._pin, _servoPulseForSpeed(speed))
        }

        /**
         * Stop driving the header servo. A positional servo stops holding
         * (saves battery); a continuous servo stops turning.
         */
        release(): void {
            pins.digitalWritePin(DigitalPin.P2, 0)
        }
    }

    //% whenUsed
    export const headerServo = new FwdFifaHeaderServo()

    // ---- block-friendly wrappers (fixedInstance dropdown not needed: one header) ----

    /**
     * Tell the board what kind of servo is plugged into the 3-pin header.
     */
    //% group="Servo Ports"
    //% block="header servo is a $type"
    //% blockId=fwd_fifa_header_servo_type_fn
    //% weight=75
    export function setHeaderServoType(type: FwdFifaServoType): void {
        headerServo.setType(type)
    }

    /**
     * Move the header servo (3-pin header, P2) to an angle.
     * @param angle target angle in degrees
     */
    //% group="Servo Ports"
    //% block="set header servo to $angle °"
    //% blockId=fwd_fifa_header_servo_angle_fn
    //% angle.min=0 angle.max=270 angle.defl=90
    //% weight=74
    export function setHeaderServoAngle(angle: number): void {
        headerServo.setAngle(angle)
    }

    /**
     * Run a continuous-rotation servo on the 3-pin header at a speed.
     * @param speed -100 (full reverse) to 100 (full forward)
     */
    //% group="Servo Ports"
    //% block="run header servo at $speed \\%"
    //% blockId=fwd_fifa_header_servo_run_fn
    //% speed.shadow="speedPicker"
    //% weight=73
    export function runHeaderServo(speed: number): void {
        headerServo.run(speed)
    }

    /**
     * Stop driving the header servo (release / stop turning).
     */
    //% group="Servo Ports"
    //% block="release header servo"
    //% blockId=fwd_fifa_header_servo_release_fn
    //% weight=72
    export function releaseHeaderServo(): void {
        headerServo.release()
    }
}
