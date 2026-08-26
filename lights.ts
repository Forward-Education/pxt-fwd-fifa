/**
 * FIFA breakout — NeoPixels on the 3-pin aux header (P2).
 *
 * Self-contained strip driver on the low-level ws2812b package (no extra
 * toolbox drawer), so all pixel blocks live under the Lights category.
 *
 * The header supply (HEADER_3V3) is current-limited to ~500 mA by the board's
 * TPS2553: ~8 pixels at full white, ~25-30 at the default capped brightness.
 * Overload folds the header supply back safely (lights dim, board unaffected).
 */

namespace fwdLights {
    const PIN = DigitalPin.P2
    const DEFAULT_BRIGHTNESS = 64 // ~25% — keeps ~30 px inside the 0.5 A budget

    let _buf: Buffer = null
    let _numPixels = 0
    let _brightness = DEFAULT_BRIGHTNESS

    function ensure(): void {
        if (!_buf) initStrip(8)
    }

    function apply(): void {
        // scale by brightness into a send buffer (GRB byte order)
        const out = pins.createBuffer(_numPixels * 3)
        for (let i = 0; i < _numPixels * 3; i++)
            out[i] = Math.idiv(_buf[i] * _brightness, 255)
        ws2812b.sendBuffer(out, PIN)
    }

    function setPixelRaw(index: number, color: number): void {
        if (index < 0 || index >= _numPixels) return
        const i = index * 3
        _buf[i] = (color >> 8) & 0xff // G
        _buf[i + 1] = (color >> 16) & 0xff // R
        _buf[i + 2] = color & 0xff // B
    }

    /**
     * Set up the NeoPixel strip plugged into the 3-pin header.
     * Brightness starts capped at 25% to stay inside the header power budget.
     * @param numPixels how many pixels are on the strip
     */
    //% group="NeoPixels"
    //% block="set up NeoPixel strip with $numPixels pixels"
    //% blockId=fwd_fifa_strip_setup
    //% numPixels.min=1 numPixels.max=64 numPixels.defl=8
    //% weight=99
    export function initStrip(numPixels: number): void {
        _numPixels = Math.constrain(numPixels | 0, 1, 64)
        _buf = pins.createBuffer(_numPixels * 3)
        apply()
    }

    /**
     * Set every pixel on the strip to a color.
     * @param color the color to show
     */
    //% group="NeoPixels"
    //% block="set all pixels to $color"
    //% blockId=fwd_fifa_strip_set_all
    //% color.shadow="colorNumberPicker"
    //% weight=98
    export function setAllPixels(color: number): void {
        ensure()
        for (let i = 0; i < _numPixels; i++) setPixelRaw(i, color)
        apply()
    }

    /**
     * Set one pixel to a color (pixel 0 is closest to the board).
     * @param index which pixel, starting at 0
     * @param color the color to show
     */
    //% group="NeoPixels"
    //% block="set pixel $index to $color"
    //% blockId=fwd_fifa_strip_set_pixel
    //% index.min=0 index.max=63
    //% color.shadow="colorNumberPicker"
    //% weight=97
    export function setPixel(index: number, color: number): void {
        ensure()
        setPixelRaw(index, color)
        apply()
    }

    /**
     * Set the strip brightness. Values above ~64 shorten how many pixels the
     * header's 0.5 A supply can light at full white.
     * @param brightness brightness from 0 (off) to 255 (full)
     */
    //% group="NeoPixels"
    //% block="set strip brightness to $brightness"
    //% blockId=fwd_fifa_strip_brightness
    //% brightness.min=0 brightness.max=255 brightness.defl=64
    //% weight=96
    export function setBrightness(brightness: number): void {
        ensure()
        _brightness = Math.constrain(brightness | 0, 0, 255)
        apply()
    }

    /**
     * Turn all pixels off.
     */
    //% group="NeoPixels"
    //% block="turn all pixels off"
    //% blockId=fwd_fifa_strip_clear
    //% weight=95
    export function clearPixels(): void {
        ensure()
        _buf.fill(0)
        apply()
    }

    /**
     * Move every pixel's color along the strip, wrapping around the end.
     * @param positions how many positions to rotate by
     */
    //% group="NeoPixels"
    //% block="rotate pixels by $positions"
    //% blockId=fwd_fifa_strip_rotate
    //% positions.defl=1
    //% weight=94
    export function rotatePixels(positions: number): void {
        ensure()
        const n = _numPixels
        if (n <= 1) return
        let shift = ((positions | 0) % n + n) % n
        if (shift === 0) return
        const copy = _buf.slice(0, n * 3)
        for (let i = 0; i < n; i++) {
            const src = ((i - shift + n) % n) * 3
            _buf[i * 3] = copy[src]
            _buf[i * 3 + 1] = copy[src + 1]
            _buf[i * 3 + 2] = copy[src + 2]
        }
        apply()
    }

    /**
     * Make a color from red, green and blue parts (advanced).
     * @param red red part, 0-255
     * @param green green part, 0-255
     * @param blue blue part, 0-255
     */
    //% group="NeoPixels"
    //% block="red $red green $green blue $blue"
    //% blockId=fwd_fifa_strip_rgb
    //% red.min=0 red.max=255 green.min=0 green.max=255 blue.min=0 blue.max=255
    //% weight=59
    //% advanced=true
    export function rgb(red: number, green: number, blue: number): number {
        return ((red & 0xff) << 16) | ((green & 0xff) << 8) | (blue & 0xff)
    }
}
