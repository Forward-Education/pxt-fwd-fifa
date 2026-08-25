/**
 * FIFA breakout — encoded DC motor driver (DRV8833 on micro:bit pins).
 *
 * Wiring (REV A):
 *   Motor 1: AIN1 = P13, AIN2 = P14
 *   Motor 2: BIN1 = P15, BIN2 = P16
 *
 * Drive scheme: slow decay ("drive/brake" PWM) — one input held high, the
 * other PWMed. Better low-speed torque and quieter than fast decay on TT
 * gearmotors. DRV8833 truth table (slow decay, forward):
 *   IN1 = 1, IN2 = PWM (low portion = drive) → duty(IN2) = 100% − speed%.
 * PWM period 50 µs (20 kHz, above audible).
 */

enum FwdFifaMotor {
    //% block="motor 1"
    M1 = 1,
    //% block="motor 2"
    M2 = 2,
}

enum FwdFifaStopMode {
    //% block="brake"
    Brake = 0,
    //% block="coast"
    Coast = 1,
}

namespace fwdMotors {
    const PWM_PERIOD_US = 50

    interface MotorPins {
        in1: AnalogPin
        in2: AnalogPin
    }

    function motorPins(motor: FwdFifaMotor): MotorPins {
        return motor === FwdFifaMotor.M1
            ? { in1: AnalogPin.P13, in2: AnalogPin.P14 }
            : { in1: AnalogPin.P15, in2: AnalogPin.P16 }
    }

    // Track commanded direction so the encoder MVP can sign its counts.
    export const _direction: { [key: number]: number } = { 1: 0, 2: 0 }

    function digitalHigh(pin: AnalogPin): void {
        pins.digitalWritePin(<number>pin, 1)
    }

    function digitalLow(pin: AnalogPin): void {
        pins.digitalWritePin(<number>pin, 0)
    }

    function pwm(pin: AnalogPin, duty1023: number): void {
        pins.analogWritePin(pin, duty1023)
        pins.analogSetPeriod(pin, PWM_PERIOD_US)
    }

    /**
     * Run a motor at a speed. Positive is forward, negative is reverse.
     * @param motor which motor port
     * @param speed speed from -100 to 100 (%)
     */
    //% group="DC Motors"
    //% block="set $motor to $speed \\%"
    //% blockId=fwd_fifa_motor_set_speed
    //% speed.min=-100 speed.max=100 speed.defl=50
    //% weight=99
    export function setSpeed(motor: FwdFifaMotor, speed: number): void {
        speed = Math.constrain(speed, -100, 100)
        const p = motorPins(motor)
        fwdMotors._direction[motor] = speed === 0 ? 0 : speed > 0 ? 1 : -1
        if (speed === 0) {
            stop(motor, FwdFifaStopMode.Brake)
            return
        }
        // slow decay: drive pin held high, other pin PWMed with inverted duty
        const duty = Math.idiv((100 - Math.abs(speed)) * 1023, 100)
        if (speed > 0) {
            digitalHigh(p.in1)
            pwm(p.in2, duty)
        } else {
            digitalHigh(p.in2)
            pwm(p.in1, duty)
        }
    }

    /**
     * Stop a motor, braking (short the windings) or coasting (freewheel).
     * @param motor which motor port
     * @param mode brake or coast
     */
    //% group="DC Motors"
    //% block="stop $motor || with $mode"
    //% blockId=fwd_fifa_motor_stop
    //% expandableArgumentMode="toggle"
    //% weight=98
    export function stop(
        motor: FwdFifaMotor,
        mode: FwdFifaStopMode = FwdFifaStopMode.Brake
    ): void {
        const p = motorPins(motor)
        fwdMotors._direction[motor] = 0
        if (mode === FwdFifaStopMode.Brake) {
            digitalHigh(p.in1)
            digitalHigh(p.in2)
        } else {
            digitalLow(p.in1)
            digitalLow(p.in2)
        }
    }

    /**
     * Run both motors at once (tank drive).
     * @param left speed for motor 1, -100 to 100 (%)
     * @param right speed for motor 2, -100 to 100 (%)
     */
    //% group="DC Motors"
    //% block="drive left $left \\% right $right \\%"
    //% blockId=fwd_fifa_motor_tank
    //% left.min=-100 left.max=100 left.defl=50
    //% right.min=-100 right.max=100 right.defl=50
    //% weight=97
    export function tank(left: number, right: number): void {
        setSpeed(FwdFifaMotor.M1, left)
        setSpeed(FwdFifaMotor.M2, right)
    }

    /**
     * Stop both motors.
     */
    //% group="DC Motors"
    //% block="stop both motors"
    //% blockId=fwd_fifa_motor_stop_all
    //% weight=96
    export function stopAll(): void {
        stop(FwdFifaMotor.M1, FwdFifaStopMode.Brake)
        stop(FwdFifaMotor.M2, FwdFifaStopMode.Brake)
    }
}
