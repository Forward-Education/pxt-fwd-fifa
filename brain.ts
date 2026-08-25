/**
 * FIFA breakout — Jacdac clients for the onboard STM32 brain.
 *
 * The brain hosts three 270° servo services (edge ports SERVO 1-3) and a
 * relay service. Roles share the "fifaBrain/" prefix so the role manager
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
        constructor(role: string) {
            super(role)
        }

        /**
         * Move this servo port to an angle.
         * @param angle target angle in degrees (0-270)
         */
        //% group="Servo Ports"
        //% block="set $this to $angle °"
        //% blockId=fwd_fifa_servo_set_angle
        //% angle.min=0 angle.max=270 angle.defl=135
        //% weight=89
        setAngle(angle: number): void {
            this.setEnabled(true)
            this.setAngle2(angle)
        }

        private setAngle2(angle: number): void {
            super.setAngle(angle)
        }
    }

    //% fixedInstance whenUsed block="servo port 1"
    export const servoPort1 = new FwdFifaServoClient("fifaBrain/servo1?srvo=0")
    //% fixedInstance whenUsed block="servo port 2"
    export const servoPort2 = new FwdFifaServoClient("fifaBrain/servo2?srvo=1")
    //% fixedInstance whenUsed block="servo port 3"
    export const servoPort3 = new FwdFifaServoClient("fifaBrain/servo3?srvo=2")

    const _relay = new modules.RelayClient("fifaBrain/relay")

    const _battery = new modules.DcVoltageMeasurementClient("fifaBrain/battery")

    /**
     * The battery voltage in volts, measured by the onboard brain.
     */
    //% group="Battery"
    //% block="battery voltage (V)"
    //% blockId=fwd_fifa_battery_voltage
    //% weight=69
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
    //% weight=68
    export function batteryLevel(): number {
        const v = _battery.measurement()
        if (isNaN(v) || v <= 0) return 0
        return Math.constrain(Math.round(((v - 3.3) / 0.9) * 100), 0, 100)
    }

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
