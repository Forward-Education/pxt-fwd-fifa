/**
 * FIFA breakout — NeoPixels on the 3-pin aux header (P2).
 *
 * The header supply (HEADER_3V3) is current-limited to ~500 mA by the board's
 * TPS2553, which safely supports ~8 pixels at full white or ~25-30 at the
 * default capped brightness. Overload folds the header supply back (lights
 * dim/blank) without affecting the rest of the board.
 *
 * This is a thin factory over the standard Microsoft `neopixel` extension,
 * pinned to DigitalPin.P2 with a safe default brightness. The richer block
 * surface (matrix layouts, animations) can be lifted from pxt-neopixel in a
 * later pass.
 */

namespace fwdLights {
    const DEFAULT_BRIGHTNESS = 64 // ~25% — keeps ~30 px inside the 0.5 A budget

    /**
     * Create a NeoPixel strip plugged into the 3-pin header.
     * Brightness starts capped at 25% to stay inside the header power budget —
     * raise it with the strip's set-brightness block if your strip is short.
     * @param numPixels how many pixels are on the strip
     */
    //% group="NeoPixels"
    //% block="FIFA strip with $numPixels pixels"
    //% blockId=fwd_fifa_create_strip
    //% numPixels.defl=8
    //% blockSetVariable=strip
    //% weight=99
    export function createStrip(numPixels: number): neopixel.Strip {
        const strip = neopixel.create(DigitalPin.P2, numPixels, NeoPixelMode.RGB)
        strip.setBrightness(DEFAULT_BRIGHTNESS)
        return strip
    }
}
