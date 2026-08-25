/**
 * FIFA breakout — quadrature encoder counting (MVP, TypeScript).
 *
 * Wiring (REV A): Motor 1 encoder A/B = P8/P9, Motor 2 encoder A/B = P0/P1.
 * Encoders are hall quadrature on the motor shaft (before the 1:48 gearbox),
 * pulled up to 3V3B on the board.
 *
 * MVP strategy: count rising edges on channel A only (1× decoding); sign the
 * count from the last commanded motor direction. This keeps the event rate at
 * 1/4 of full quadrature and needs no native code, at the cost of losing
 * counts during direction reversals (acceptable for speed control, not for
 * odometry-grade position).
 *
 * TODO(C++ shim): replace with GPIOTE-based 2×/4× decoding in a .cpp shim for
 * true signed position counting — this would be the first native code in the
 * Forward extension family. Blocked on measured encoder CPR from the motor
 * sample to budget the interrupt rate.
 */

enum FwdFifaEncoder {
    //% block="motor 1"
    M1 = 1,
    //% block="motor 2"
    M2 = 2,
}

namespace fwdSensors {
    let _initialized = false
    const _counts: { [key: number]: number } = { 1: 0, 2: 0 }
    // speed measurement state
    const _lastCount: { [key: number]: number } = { 1: 0, 2: 0 }
    const _lastRpm: { [key: number]: number } = { 1: 0, 2: 0 }
    let _cpr = 0 // counts per output-shaft revolution at 1× decoding; 0 = unset

    function ensureInit(): void {
        if (_initialized) return
        _initialized = true
        pins.setPull(DigitalPin.P8, PinPullMode.PullNone) // board has 10k pull-ups
        pins.setPull(DigitalPin.P0, PinPullMode.PullNone)
        pins.setEvents(DigitalPin.P8, PinEventType.Edge)
        pins.setEvents(DigitalPin.P0, PinEventType.Edge)
        control.onEvent(EventBusSource.MICROBIT_ID_IO_P8, EventBusValue.MICROBIT_PIN_EVT_RISE, () => {
            _counts[1] += fwdMotors._direction[1] >= 0 ? 1 : -1
        })
        control.onEvent(EventBusSource.MICROBIT_ID_IO_P0, EventBusValue.MICROBIT_PIN_EVT_RISE, () => {
            _counts[2] += fwdMotors._direction[2] >= 0 ? 1 : -1
        })
        // 10 Hz speed estimator
        control.inBackground(() => {
            while (true) {
                basic.pause(100)
                for (let m = 1; m <= 2; m++) {
                    const c = _counts[m]
                    const delta = c - _lastCount[m]
                    _lastCount[m] = c
                    if (_cpr > 0)
                        _lastRpm[m] = Math.idiv(delta * 600, _cpr)
                }
            }
        })
    }

    /**
     * Set how many encoder counts equal one full turn of the wheel/output
     * shaft. Measure this once for your motor and call it at program start.
     * @param counts encoder counts per output-shaft revolution
     */
    //% group="Encoders"
    //% block="set encoder counts per revolution to $counts"
    //% blockId=fwd_fifa_encoder_set_cpr
    //% counts.defl=576
    //% weight=89
    export function setCountsPerRevolution(counts: number): void {
        _cpr = counts
        ensureInit()
    }

    /**
     * The encoder count for a motor since reset. Forward counts up, reverse
     * counts down.
     * @param encoder which motor's encoder
     */
    //% group="Encoders"
    //% block="$encoder encoder count"
    //% blockId=fwd_fifa_encoder_count
    //% weight=99
    export function encoderCount(encoder: FwdFifaEncoder): number {
        ensureInit()
        return _counts[encoder]
    }

    /**
     * The motor speed in revolutions per minute of the output shaft.
     * Requires counts-per-revolution to be set first.
     * @param encoder which motor's encoder
     */
    //% group="Encoders"
    //% block="$encoder speed (rpm)"
    //% blockId=fwd_fifa_encoder_rpm
    //% weight=98
    export function speedRPM(encoder: FwdFifaEncoder): number {
        ensureInit()
        return _lastRpm[encoder]
    }

    /**
     * Reset a motor's encoder count to zero.
     * @param encoder which motor's encoder
     */
    //% group="Encoders"
    //% block="reset $encoder encoder"
    //% blockId=fwd_fifa_encoder_reset
    //% weight=97
    export function resetEncoder(encoder: FwdFifaEncoder): void {
        ensureInit()
        _counts[encoder] = 0
        _lastCount[encoder] = 0
    }
}
