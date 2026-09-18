/**
 * FIFA breakout — Jacdac clients for the onboard STM32 brain.
 *
 * The brain hosts three servo services (edge ports SERVO 1-3) and a relay
 * service. The servo services boot with a 270° / 600-2500 µs mapping. The
 * client re-programs the min/max pulse registers (writable, `.fixed = 0` in the
 * firmware profile) for the selected servo type and rescales angles/speeds onto
 * the brain's fixed 0-270° register range, so 180°, 270° and continuous-rotation
 * servos all work without a firmware change. Roles share the "fifaBrain/" prefix so the role manager
 * groups them onto one physical device, and ?srvo=N pins each role to the
 * Nth servo service on that device (same pattern as fwd-servo-base).
 *
 * Note: role-query strings cannot bind by product identifier — if a student
 * plugs an external Jacdac servo module in, best-fit scoring still prefers
 * the device that satisfies the most roles (the brain, with 3 servos + relay).
 * True product-ID binding is a possible later upgrade via the control
 * service's ProductIdentifier register.
 */

namespace fwdMotors {
    //% fixedInstances
    export class FwdFifaServoClient extends modules.ServoClient {
        private _type: FwdFifaServoType = FwdFifaServoType.Positional270
        private _typeSent: boolean = false

        constructor(role: string) {
            super(role)
        }

        /**
         * Tell the board what kind of servo is plugged into this port.
         * @param type the servo type
         */
        //% group="Servo Ports"
        //% block="$this is a $type"
        //% blockId=fwd_fifa_servo_set_type
        //% weight=90
        setType(type: FwdFifaServoType): void {
            if (type != this._type) {
                this._type = type
                this._typeSent = false
            }
            this.applyType()
        }

        // Push the pulse range for the selected type to the brain. The brain's
        // angle range (0-270°) is a read-only register per the Jacdac spec, so
        // requested angles/speeds are rescaled onto 0-270 in brainAngle().
        // Register writes made before the role binds are lost, so this is
        // re-tried on every command until it goes out while connected.
        private applyType(): void {
            if (this._typeSent) return
            const r = _servoRange(this._type)
            this.setMinPulse(r[0])
            this.setMaxPulse(r[1])
            if (this.isConnected()) this._typeSent = true
        }

        // Map a value in the type's own range onto the brain's fixed 0-270° scale,
        // so the brain emits minPulse..maxPulse across the type's travel.
        private brainAngle(value: number): number {
            const r = _servoRange(this._type)
            return Math.map(Math.constrain(value, r[2], r[3]), r[2], r[3], 0, 270)
        }

        /**
         * Move this servo port to an angle (180° or 270° servos).
         * @param angle target angle in degrees
         */
        //% group="Servo Ports"
        //% block="set $this to $angle °"
        //% blockId=fwd_fifa_servo_set_angle
        //% angle.min=0 angle.max=270 angle.defl=135
        //% weight=89
        setAngle(angle: number): void {
            this.applyType()
            if (this._type == FwdFifaServoType.Continuous) {
                super.setAngle(135) // mid-scale = 1500 µs = stop
                return
            }
            this.setEnabled(true)
            super.setAngle(this.brainAngle(angle))
        }

        /**
         * Run this servo port at a speed (continuous rotation servos).
         * @param speed -100 (full reverse) to 100 (full forward)
         */
        //% group="Servo Ports"
        //% block="run $this at $speed \\%"
        //% blockId=fwd_fifa_servo_run
        //% speed.shadow="speedPicker"
        //% weight=88
        runAt(speed: number): void {
            this.applyType()
            this.setEnabled(true)
            // Map speed onto the angle range applyType() programmed into the
            // brain (continuous: -100..100 ↔ 1000..2000 µs). Done locally rather
            // than via the base run(), which reads min/max angle back from the
            // device and could see stale values right after the type change.
            // continuous type: -100..100 % ↔ 0..270 on the brain ↔ 1000..2000 µs
            super.setAngle(this.brainAngle(Math.round(speed)))
        }

        /**
         * Stop driving this servo port. A positional servo stops holding
         * (saves battery); a continuous servo stops turning.
         */
        //% group="Servo Ports"
        //% block="release $this"
        //% blockId=fwd_fifa_servo_release
        //% weight=87
        release(): void {
            if (this._type == FwdFifaServoType.Continuous) super.setAngle(135)
            this.setEnabled(false)
        }
    }

    //% fixedInstance whenUsed block="servo port 1"
    export const servoPort1 = new FwdFifaServoClient("fifaBrain/servo1?srvo=0")
    //% fixedInstance whenUsed block="servo port 2"
    export const servoPort2 = new FwdFifaServoClient("fifaBrain/servo2?srvo=1")
    //% fixedInstance whenUsed block="servo port 3"
    export const servoPort3 = new FwdFifaServoClient("fifaBrain/servo3?srvo=2")

    const _relay = new modules.RelayClient("fifaBrain/relay")

    /**
     * Switch the relay port on or off.
     * @param on true to energize the relay output
     */
    //% group="Relay Port"
    //% block="set relay port $on"
    //% blockId=fwd_fifa_relay_set
    //% on.shadow="toggleOnOff"
    //% weight=79
    export function setRelay(on: boolean): void {
        _relay.setActive(on)
    }
}

namespace fwdSensors {
    const _battery = new modules.DcVoltageMeasurementClient("fifaBrain/battery")

    /**
     * Whether the onboard Jacdac brain has bound its battery role (internal —
     * no block). Lets a diagnostic tell "brain not bound" apart from "brain
     * bound but reading 0 V", which look identical from the voltage alone.
     */
    export function _brainConnected(): boolean {
        return _battery.isConnected()
    }

    /**
     * The raw battery measurement, unfiltered (internal — no block).
     */
    export function _batteryRaw(): number {
        return _battery.measurement()
    }

    /**
     * The battery voltage in volts, measured by the onboard brain.
     */
    //% group="Battery"
    //% block="battery voltage (V)"
    //% blockId=fwd_fifa_battery_voltage
    //% weight=79
    export function batteryVoltage(): number {
        return _battery.measurement()
    }

    /**
     * The battery charge level as a rough percentage (LiPo: 3.3 V = 0%,
     * 4.2 V = 100%).
     */
    //% group="Battery"
    //% block="battery level (\\%)"
    //% blockId=fwd_fifa_battery_level
    //% weight=78
    export function batteryLevel(): number {
        const v = _battery.measurement()
        if (isNaN(v) || v <= 0) return 0
        return Math.constrain(Math.round(((v - 3.3) / 0.9) * 100), 0, 100)
    }
}
