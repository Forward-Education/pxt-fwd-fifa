/**
 * FIFA breakout — MCP23017 I2C GPIO expander driver (address 0x20).
 *
 * The 5-pin aux header exposes expander pins GPA0–GPA2 as "expander pin 1..3".
 * The remaining 13 expander pins are reserved for future kit features and are
 * reachable through the advanced API.
 *
 * Pure TypeScript over pins.i2c — no native code required.
 */

enum FwdFifaExpanderPin {
    //% block="pin 1"
    P1 = 0, // GPA0
    //% block="pin 2"
    P2 = 1, // GPA1
    //% block="pin 3"
    P3 = 2, // GPA2
}

namespace fwdSensors {
    const ADDR = 0x20
    // MCP23017 registers (IOCON.BANK = 0, the power-on default)
    const REG_IODIRA = 0x00
    const REG_IODIRB = 0x01
    const REG_GPPUA = 0x0c
    const REG_GPPUB = 0x0d
    const REG_GPIOA = 0x12
    const REG_GPIOB = 0x13
    const REG_OLATA = 0x14
    const REG_OLATB = 0x15

    let _present = -1 // -1 unknown, 0 absent, 1 present
    let _iodirA = 0xff
    let _gppuA = 0x00
    let _olatA = 0x00

    function writeReg(reg: number, value: number): void {
        pins.i2cWriteBuffer(ADDR, pins.createBufferFromArray([reg, value & 0xff]))
    }

    function readReg(reg: number): number {
        pins.i2cWriteBuffer(ADDR, pins.createBufferFromArray([reg]), true)
        return pins.i2cReadBuffer(ADDR, 1)[0]
    }

    /**
     * Whether the expander answers on the I2C bus.
     */
    //% group="Expander"
    //% block="expander is connected"
    //% blockId=fwd_fifa_expander_connected
    //% weight=79
    export function expanderConnected(): boolean {
        const buf = pins.createBufferFromArray([REG_IODIRA])
        const err = pins.i2cWriteBuffer(ADDR, buf)
        _present = err === 0 ? 1 : 0
        return _present === 1
    }

    /**
     * Set an expander pin high or low (makes it an output).
     * @param pin which expander pin on the 5-pin header
     * @param value 1 for high, 0 for low
     */
    //% group="Expander"
    //% block="write $value to expander $pin"
    //% blockId=fwd_fifa_expander_write
    //% value.min=0 value.max=1 value.defl=1
    //% weight=99
    export function expanderWrite(pin: FwdFifaExpanderPin, value: number): void {
        const bit = 1 << pin
        _iodirA &= ~bit // output
        writeReg(REG_IODIRA, _iodirA)
        if (value) _olatA |= bit
        else _olatA &= ~bit
        writeReg(REG_OLATA, _olatA)
    }

    /**
     * Read an expander pin (makes it an input).
     * @param pin which expander pin on the 5-pin header
     */
    //% group="Expander"
    //% block="read expander $pin"
    //% blockId=fwd_fifa_expander_read
    //% weight=98
    export function expanderRead(pin: FwdFifaExpanderPin): number {
        const bit = 1 << pin
        _iodirA |= bit // input
        writeReg(REG_IODIRA, _iodirA)
        return (readReg(REG_GPIOA) & bit) ? 1 : 0
    }

    /**
     * Turn the internal 100 kΩ pull-up on or off for an expander pin.
     * @param pin which expander pin on the 5-pin header
     * @param on true to enable the pull-up
     */
    //% group="Expander"
    //% block="set expander $pin pull-up $on"
    //% blockId=fwd_fifa_expander_pullup
    //% on.shadow="toggleOnOff" on.defl=true
    //% weight=97
    export function expanderPullUp(pin: FwdFifaExpanderPin, on: boolean): void {
        const bit = 1 << pin
        if (on) _gppuA |= bit
        else _gppuA &= ~bit
        writeReg(REG_GPPUA, _gppuA)
    }

    // ---------- advanced: raw access to all 16 expander pins ----------

    /**
     * Write a raw expander register (advanced).
     * @param reg register address (BANK=0 map)
     * @param value byte to write
     */
    //% group="Expander"
    //% block="expander register $reg write $value"
    //% blockId=fwd_fifa_expander_reg_write
    //% weight=59
    //% advanced=true
    export function expanderRegWrite(reg: number, value: number): void {
        writeReg(reg, value)
    }

    /**
     * Read a raw expander register (advanced).
     * @param reg register address (BANK=0 map)
     */
    //% group="Expander"
    //% block="expander register $reg read"
    //% blockId=fwd_fifa_expander_reg_read
    //% weight=58
    //% advanced=true
    export function expanderRegRead(reg: number): number {
        return readReg(reg)
    }
}
