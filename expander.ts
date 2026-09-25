/**
 * FIFA breakout — I2C GPIO expander behind the 5-pin aux header (address 0x20).
 *
 * Two different chips have been fitted, both at 0x20 and both with the three
 * header signals on bits 0-2 of their first port (every other pin on both
 * chips is unconnected — checked against the REV_A, REV_C and REV_E netlists):
 *   REV_A-C  Microchip MCP23017  IOCON.BANK = 0 map; header = GPA0-GPA2
 *   REV_D+   XINLUDA XL9555      PCA9555 map 0x00-0x07; header = P00-P02
 *
 * The chip is identified on first use by register 0x01: that is IODIRB on the
 * MCP23017 (read/write) but Input Port 1 on the XL9555, where "writes to these
 * registers have no effect" (XL9555 datasheet 9.2.2). Flipping one bit and
 * reading it back tells them apart. The bit is GPB7 / P17, which is
 * unconnected on every revision, so the probe cannot disturb anything.
 * Probing a register above 0x07 (e.g. IOCON at 0x0A) is NOT safe: the XL9555
 * only defines the low three bits of the command byte, so it may land on
 * Output Port 0 instead.
 *
 * Differences that show through the blocks:
 *   - The XL9555 has a fixed high-value pull-up on every pin, so on REV_D+
 *     boards the pull-up block has nothing to switch and a floating input
 *     always reads 1.
 *   - The raw register blocks address whichever chip is fitted, in its own
 *     register map.
 *
 * Pure TypeScript over pins.i2c — no native code required.
 */

enum FwdFifaExpanderPin {
    //% block="pin 1"
    P1 = 0, // MCP23017 GPA0 / XL9555 P00
    //% block="pin 2"
    P2 = 1, // GPA1 / P01
    //% block="pin 3"
    P3 = 2, // GPA2 / P02
}

namespace fwdSensors {
    const ADDR = 0x20

    const CHIP_NONE = 0 // nothing answered (3V3B is off until SW1 is on)
    const CHIP_MCP23017 = 1
    const CHIP_XL9555 = 2

    // MCP23017, IOCON.BANK = 0 (the power-on default). Port A is the header.
    const MCP_IODIRA = 0x00 // direction, 1 = input
    const MCP_IODIRB = 0x01
    const MCP_IPOLA = 0x02
    const MCP_GPPUA = 0x0c
    const MCP_GPIOA = 0x12 // pin levels
    const MCP_OLATA = 0x14 // output latch

    // XL9555 (PCA9555 register map). Port 0 is the header.
    const XL_INPUT0 = 0x00 // pin levels, read-only
    const XL_OUTPUT0 = 0x02 // output latch
    const XL_POLARITY0 = 0x04
    const XL_CONFIG0 = 0x06 // direction, 1 = input

    // Register 0x01: MCP23017 IODIRB (read/write), XL9555 Input Port 1
    // (writes ignored). Bit 7 is GPB7 / P17, unconnected on every revision.
    const PROBE_REG = 0x01
    const PROBE_BIT = 0x80

    let _chip = CHIP_NONE
    // Shadows of the header port. Direction is 1 = input on both chips.
    let _dir = 0xff
    let _out = 0x00
    let _pu = 0x00

    // A failed transfer means the chip has gone (usually SW1 switched off).
    // Forget it, so it is identified and reset again when it comes back —
    // it will have lost its settings anyway.
    function writeReg(reg: number, value: number): boolean {
        const ok =
            pins.i2cWriteBuffer(
                ADDR,
                pins.createBufferFromArray([reg, value & 0xff])
            ) === 0
        if (!ok) _chip = CHIP_NONE
        return ok
    }

    // -1 if the chip did not answer.
    function readReg(reg: number): number {
        if (
            pins.i2cWriteBuffer(ADDR, pins.createBufferFromArray([reg]), true) !== 0
        ) {
            _chip = CHIP_NONE
            return -1
        }
        return pins.i2cReadBuffer(ADDR, 1)[0]
    }

    function present(): boolean {
        return pins.i2cWriteBuffer(ADDR, pins.createBufferFromArray([0x00])) === 0
    }

    // Identify the chip on first use and put the header into a known state:
    // all inputs, output latch low, no inversion, pull-ups off. "Not found" is
    // never remembered — the expander runs from 3V3B, which only comes up when
    // SW1 is switched on, so it may appear after the program has started.
    function chip(): number {
        if (_chip !== CHIP_NONE) return _chip
        if (!present()) return CHIP_NONE

        const before = readReg(PROBE_REG)
        if (before < 0) return CHIP_NONE
        // The readback decides, so the write's own result is ignored: the
        // XL9555 discards it, and the datasheet doesn't say whether it ACKs.
        writeReg(PROBE_REG, before ^ PROBE_BIT)
        const after = readReg(PROBE_REG)
        if (after < 0) return CHIP_NONE
        let found = CHIP_XL9555
        if (after === (before ^ PROBE_BIT)) {
            found = CHIP_MCP23017
            writeReg(MCP_IODIRB, before) // put GPB7 back
        }

        _dir = 0xff
        _out = 0x00
        _pu = 0x00
        const ok =
            found === CHIP_MCP23017
                ? writeReg(MCP_OLATA, _out) &&
                  writeReg(MCP_IODIRA, _dir) &&
                  writeReg(MCP_IPOLA, 0x00) &&
                  writeReg(MCP_GPPUA, _pu)
                : writeReg(XL_OUTPUT0, _out) &&
                  writeReg(XL_CONFIG0, _dir) &&
                  writeReg(XL_POLARITY0, 0x00)
        _chip = ok ? found : CHIP_NONE
        return _chip
    }

    function writeDirection(): void {
        writeReg(_chip === CHIP_MCP23017 ? MCP_IODIRA : XL_CONFIG0, _dir)
    }

    function writeOutputs(): void {
        writeReg(_chip === CHIP_MCP23017 ? MCP_OLATA : XL_OUTPUT0, _out)
    }

    /**
     * Whether the expander answers on the I2C bus. It is powered with the
     * battery rail, so this is false until the board's switch is on.
     */
    //% group="5-pin GPIO Header"
    //% block="5-pin header is connected"
    //% advanced=true
    //% blockId=fwd_fifa_expander_connected
    //% weight=79
    export function expanderConnected(): boolean {
        // Always a live check (batt-check uses this as its 3V3B-rail probe).
        if (!present()) {
            _chip = CHIP_NONE
            return false
        }
        return chip() !== CHIP_NONE
    }

    /**
     * Set an expander pin high or low (makes it an output).
     * @param pin which expander pin on the 5-pin header
     * @param value 1 for high, 0 for low
     */
    //% group="5-pin GPIO Header"
    //% block="write $value to header $pin"
    //% advanced=true
    //% blockId=fwd_fifa_expander_write
    //% value.min=0 value.max=1 value.defl=1
    //% weight=99
    export function expanderWrite(pin: FwdFifaExpanderPin, value: number): void {
        if (chip() === CHIP_NONE) return
        const bit = 1 << pin
        if (value) _out |= bit
        else _out &= ~bit
        // Latch first, then direction, so the pin comes up at the new level
        // instead of glitching through the old one.
        writeOutputs()
        _dir &= ~bit
        writeDirection()
    }

    /**
     * Read an expander pin (makes it an input).
     * @param pin which expander pin on the 5-pin header
     */
    //% group="5-pin GPIO Header"
    //% block="read header $pin"
    //% advanced=true
    //% blockId=fwd_fifa_expander_read
    //% weight=98
    export function expanderRead(pin: FwdFifaExpanderPin): number {
        if (chip() === CHIP_NONE) return 0
        const bit = 1 << pin
        _dir |= bit
        writeDirection()
        const levels = readReg(_chip === CHIP_MCP23017 ? MCP_GPIOA : XL_INPUT0)
        return levels >= 0 && (levels & bit) !== 0 ? 1 : 0
    }

    /**
     * Turn the internal pull-up on or off for an expander pin. Boards from
     * REV_D on have fixed pull-ups that are always on, so this has no effect
     * there.
     * @param pin which expander pin on the 5-pin header
     * @param on true to enable the pull-up
     */
    //% group="5-pin GPIO Header"
    //% block="set header $pin pull-up $on"
    //% advanced=true
    //% blockId=fwd_fifa_expander_pullup
    //% on.shadow="toggleOnOff" on.defl=true
    //% weight=97
    export function expanderPullUp(pin: FwdFifaExpanderPin, on: boolean): void {
        if (chip() !== CHIP_MCP23017) return // XL9555: nothing to switch
        const bit = 1 << pin
        if (on) _pu |= bit
        else _pu &= ~bit
        writeReg(MCP_GPPUA, _pu)
    }

    /**
     * Which expander chip was found (internal — no block): "MCP23017",
     * "XL9555", or "none". For bench diagnostics.
     */
    export function _expanderChip(): string {
        const c = chip()
        if (c === CHIP_MCP23017) return "MCP23017"
        if (c === CHIP_XL9555) return "XL9555"
        return "none"
    }

    // ---------- advanced: raw access to all 16 expander pins ----------

    /**
     * Write a raw expander register (advanced). Register numbers are the
     * fitted chip's own: MCP23017 BANK=0 map on REV_A-C boards, XL9555
     * (PCA9555) map on REV_D and later.
     * @param reg register address
     * @param value byte to write
     */
    //% group="5-pin GPIO Header"
    //% block="expander register $reg write $value"
    //% blockId=fwd_fifa_expander_reg_write
    //% weight=59
    //% advanced=true
    export function expanderRegWrite(reg: number, value: number): void {
        writeReg(reg, value)
    }

    /**
     * Read a raw expander register (advanced), or -1 if the expander does not
     * answer. Register numbers are the fitted chip's own (see write).
     * @param reg register address
     */
    //% group="5-pin GPIO Header"
    //% block="expander register $reg read"
    //% blockId=fwd_fifa_expander_reg_read
    //% weight=58
    //% advanced=true
    export function expanderRegRead(reg: number): number {
        return readReg(reg)
    }
}
