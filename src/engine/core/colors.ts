import { Color } from "./color";

/**
 * A static class providing a collection of predefined colors.
 * This class serves as a convenient utility for accessing common colors without needing to manually instantiate a new `Color` object each time.
 * All colors are available as static getters and are read-only.
 */
export abstract class Colors {
  /**
   * A solid white color.
   * @type {Color}
   * @readonly
   */
  public static get white(): Color {
    return new Color(1, 1, 1);
  }
  /**
   * A solid black color.
   * @type {Color}
   * @readonly
   */
  public static get black(): Color {
    return new Color(0, 0, 0);
  }
  /**
   * A solid red color.
   * @type {Color}
   * @readonly
   */
  public static get red(): Color {
    return new Color(1, 0, 0);
  }
  /**
   * A solid green color.
   * @type {Color}
   * @readonly
   */
  public static get green(): Color {
    return new Color(0, 1, 0);
  }
  /**
   * A solid blue color.
   * @type {Color}
   * @readonly
   */
  public static get blue(): Color {
    return new Color(0, 0, 1);
  }
  /**
   * A solid yellow color.
   * @type {Color}
   * @readonly
   */
  public static get yellow(): Color {
    return new Color(1, 1, 0);
  }
  /**
   * A solid cyan color.
   * @type {Color}
   * @readonly
   */
  public static get cyan(): Color {
    return new Color(0, 1, 1);
  }
  /**
   * A solid magenta color.
   * @type {Color}
   * @readonly
   */
  public static get magenta(): Color {
    return new Color(1, 0, 1);
  }
  /**
   * A mid-level gray color.
   * @type {Color}
   * @readonly
   */
  public static get gray(): Color {
    return new Color(0.5, 0.5, 0.5);
  }
  /**
   * A mid-level grey color (alternative spelling).
   * @type {Color}
   * @readonly
   */
  public static get grey(): Color {
    return new Color(0.5, 0.5, 0.5);
  }
  /**
   * A transparent black color.
   * @type {Color}
   * @readonly
   */
  public static get clear(): Color {
    return new Color(0, 0, 0, 0);
  }
  /**
   * A fully transparent color.
   * @type {Color}
   * @readonly
   */
  public static get transparent(): Color {
    return new Color(0, 0, 0, 0);
  }
  /**
   * The color cornflower blue.
   * @type {Color}
   * @readonly
   */
  public static get cornflowerBlue(): Color {
    return new Color(0.392, 0.584, 0.929, 1);
  }
  /**
   * The color alice blue.
   * @type {Color}
   * @readonly
   */
  public static get aliceBlue(): Color {
    return new Color(0.941, 0.973, 1);
  }
  /**
   * The color antique white.
   * @type {Color}
   * @readonly
   */
  public static get antiqueWhite(): Color {
    return new Color(0.98, 0.922, 0.843);
  }
  /**
   * The color aqua.
   * @type {Color}
   * @readonly
   */
  public static get aqua(): Color {
    return new Color(0, 1, 1);
  }
  /**
   * The color aquamarine.
   * @type {Color}
   * @readonly
   */
  public static get aquamarine(): Color {
    return new Color(0.498, 1, 0.831);
  }
  /**
   * The color azure.
   * @type {Color}
   * @readonly
   */
  public static get azure(): Color {
    return new Color(0.941, 1, 1);
  }
  /**
   * The color beige.
   * @type {Color}
   * @readonly
   */
  public static get beige(): Color {
    return new Color(0.961, 0.961, 0.863);
  }
  /**
   * The color bisque.
   * @type {Color}
   * @readonly
   */
  public static get bisque(): Color {
    return new Color(1, 0.894, 0.769);
  }
  /**
   * The color blanched almond.
   * @type {Color}
   * @readonly
   */
  public static get blanchedAlmond(): Color {
    return new Color(1, 0.922, 0.804);
  }
  /**
   * The color blue violet.
   * @type {Color}
   * @readonly
   */
  public static get blueViolet(): Color {
    return new Color(0.541, 0.169, 0.886);
  }
  /**
   * The color brown.
   * @type {Color}
   * @readonly
   */
  public static get brown(): Color {
    return new Color(0.647, 0.165, 0.165);
  }
  /**
   * The color burly wood.
   * @type {Color}
   * @readonly
   */
  public static get burlyWood(): Color {
    return new Color(0.871, 0.722, 0.529);
  }
  /**
   * The color cadet blue.
   * @type {Color}
   * @readonly
   */
  public static get cadetBlue(): Color {
    return new Color(0.373, 0.62, 0.627);
  }
  /**
   * The color chartreuse.
   * @type {Color}
   * @readonly
   */
  public static get chartreuse(): Color {
    return new Color(0.498, 1, 0);
  }
  /**
   * The color chocolate.
   * @type {Color}
   * @readonly
   */
  public static get chocolate(): Color {
    return new Color(0.824, 0.412, 0.118);
  }
  /**
   * The color coral.
   * @type {Color}
   * @readonly
   */
  public static get coral(): Color {
    return new Color(1, 0.498, 0.314);
  }
  /**
   * The color crimson.
   * @type {Color}
   * @readonly
   */
  public static get crimson(): Color {
    return new Color(0.863, 0.078, 0.235);
  }
  /**
   * The color dark blue.
   * @type {Color}
   * @readonly
   */
  public static get darkBlue(): Color {
    return new Color(0, 0, 0.545);
  }
  /**
   * The color dark cyan.
   * @type {Color}
   * @readonly
   */
  public static get darkCyan(): Color {
    return new Color(0, 0.545, 0.545);
  }
  /**
   * The color dark goldenrod.
   * @type {Color}
   * @readonly
   */
  public static get darkGoldenrod(): Color {
    return new Color(0.722, 0.525, 0.043);
  }
  /**
   * The color dark gray.
   * @type {Color}
   * @readonly
   */
  public static get darkGray(): Color {
    return new Color(0.663, 0.663, 0.663);
  }
  /**
   * The color dark green.
   * @type {Color}
   * @readonly
   */
  public static get darkGreen(): Color {
    return new Color(0, 0.392, 0);
  }
  /**
   * The color dark khaki.
   * @type {Color}
   * @readonly
   */
  public static get darkKhaki(): Color {
    return new Color(0.741, 0.718, 0.42);
  }
  /**
   * The color dark magenta.
   * @type {Color}
   * @readonly
   */
  public static get darkMagenta(): Color {
    return new Color(0.545, 0, 0.545);
  }
  /**
   * The color dark olive green.
   * @type {Color}
   * @readonly
   */
  public static get darkOliveGreen(): Color {
    return new Color(0.333, 0.42, 0.184);
  }
  /**
   * The color dark orange.
   * @type {Color}
   * @readonly
   */
  public static get darkOrange(): Color {
    return new Color(1, 0.549, 0);
  }
  /**
   * The color dark orchid.
   * @type {Color}
   * @readonly
   */
  public static get darkOrchid(): Color {
    return new Color(0.6, 0.196, 0.8);
  }
  /**
   * The color dark red.
   * @type {Color}
   * @readonly
   */
  public static get darkRed(): Color {
    return new Color(0.545, 0, 0);
  }
  /**
   * The color dark salmon.
   * @type {Color}
   * @readonly
   */
  public static get darkSalmon(): Color {
    return new Color(0.914, 0.588, 0.478);
  }
  /**
   * The color dark sea green.
   * @type {Color}
   * @readonly
   */
  public static get darkSeaGreen(): Color {
    return new Color(0.557, 0.737, 0.557);
  }
  /**
   * The color dark slate blue.
   * @type {Color}
   * @readonly
   */
  public static get darkSlateBlue(): Color {
    return new Color(0.282, 0.239, 0.545);
  }
  /**
   * The color dark slate gray.
   * @type {Color}
   * @readonly
   */
  public static get darkSlateGray(): Color {
    return new Color(0.184, 0.31, 0.31);
  }
  /**
   * The color dark turquoise.
   * @type {Color}
   * @readonly
   */
  public static get darkTurquoise(): Color {
    return new Color(0, 0.808, 0.82);
  }
  /**
   * The color dark violet.
   * @type {Color}
   * @readonly
   */
  public static get darkViolet(): Color {
    return new Color(0.58, 0, 0.827);
  }
  /**
   * The color deep pink.
   * @type {Color}
   * @readonly
   */
  public static get deepPink(): Color {
    return new Color(1, 0.078, 0.576);
  }
  /**
   * The color deep sky blue.
   * @type {Color}
   * @readonly
   */
  public static get deepSkyBlue(): Color {
    return new Color(0, 0.749, 1);
  }
  /**
   * The color dim gray.
   * @type {Color}
   * @readonly
   */
  public static get dimGray(): Color {
    return new Color(0.412, 0.412, 0.412);
  }
  /**
   * The color dodger blue.
   * @type {Color}
   * @readonly
   */
  public static get dodgerBlue(): Color {
    return new Color(0.118, 0.565, 1);
  }
  /**
   * The color firebrick.
   * @type {Color}
   * @readonly
   */
  public static get firebrick(): Color {
    return new Color(0.698, 0.133, 0.133);
  }
  /**
   * The color floral white.
   * @type {Color}
   * @readonly
   */
  public static get floralWhite(): Color {
    return new Color(1, 0.98, 0.941);
  }
  /**
   * The color forest green.
   * @type {Color}
   * @readonly
   */
  public static get forestGreen(): Color {
    return new Color(0.133, 0.545, 0.133);
  }
  /**
   * The color fuchsia.
   * @type {Color}
   * @readonly
   */
  public static get fuchsia(): Color {
    return new Color(1, 0, 1);
  }
  /**
   * The color gainsboro.
   * @type {Color}
   * @readonly
   */
  public static get gainsboro(): Color {
    return new Color(0.863, 0.863, 0.863);
  }
  /**
   * The color ghost white.
   * @type {Color}
   * @readonly
   */
  public static get ghostWhite(): Color {
    return new Color(0.973, 0.973, 1);
  }
  /**
   * The color gold.
   * @type {Color}
   * @readonly
   */
  public static get gold(): Color {
    return new Color(1, 0.843, 0);
  }
  /**
   * The color goldenrod.
   * @type {Color}
   * @readonly
   */
  public static get goldenrod(): Color {
    return new Color(0.855, 0.647, 0.125);
  }
  /**
   * The color green yellow.
   * @type {Color}
   * @readonly
   */
  public static get greenYellow(): Color {
    return new Color(0.678, 1, 0.184);
  }
  /**
   * The color honeydew.
   * @type {Color}
   * @readonly
   */
  public static get honeydew(): Color {
    return new Color(0.941, 1, 0.941);
  }
  /**
   * The color hot pink.
   * @type {Color}
   * @readonly
   */
  public static get hotPink(): Color {
    return new Color(1, 0.412, 0.706);
  }
  /**
   * The color indian red.
   * @type {Color}
   * @readonly
   */
  public static get indianRed(): Color {
    return new Color(0.804, 0.361, 0.361);
  }
  /**
   * The color indigo.
   * @type {Color}
   * @readonly
   */
  public static get indigo(): Color {
    return new Color(0.294, 0, 0.51);
  }
  /**
   * The color ivory.
   * @type {Color}
   * @readonly
   */
  public static get ivory(): Color {
    return new Color(1, 1, 0.941);
  }
  /**
   * The color khaki.
   * @type {Color}
   * @readonly
   */
  public static get khaki(): Color {
    return new Color(0.941, 0.902, 0.549);
  }
  /**
   * The color lavender.
   * @type {Color}
   * @readonly
   */
  public static get lavender(): Color {
    return new Color(0.902, 0.902, 0.98);
  }
  /**
   * The color lavender blush.
   * @type {Color}
   * @readonly
   */
  public static get lavenderBlush(): Color {
    return new Color(1, 0.941, 0.961);
  }
  /**
   * The color lawn green.
   * @type {Color}
   * @readonly
   */
  public static get lawnGreen(): Color {
    return new Color(0.486, 0.988, 0);
  }
  /**
   * The color lemon chiffon.
   * @type {Color}
   * @readonly
   */
  public static get lemonChiffon(): Color {
    return new Color(1, 0.98, 0.804);
  }
  /**
   * The color light blue.
   * @type {Color}
   * @readonly
   */
  public static get lightBlue(): Color {
    return new Color(0.678, 0.847, 0.902);
  }
  /**
   * The color light coral.
   * @type {Color}
   * @readonly
   */
  public static get lightCoral(): Color {
    return new Color(0.941, 0.502, 0.502);
  }
  /**
   * The color light cyan.
   * @type {Color}
   * @readonly
   */
  public static get lightCyan(): Color {
    return new Color(0.878, 1, 1);
  }
  /**
   * The color light goldenrod yellow.
   * @type {Color}
   * @readonly
   */
  public static get lightGoldenrodYellow(): Color {
    return new Color(0.98, 0.98, 0.824);
  }
  /**
   * The color light gray.
   * @type {Color}
   * @readonly
   */
  public static get lightGray(): Color {
    return new Color(0.827, 0.827, 0.827);
  }
  /**
   * The color light green.
   * @type {Color}
   * @readonly
   */
  public static get lightGreen(): Color {
    return new Color(0.565, 0.933, 0.565);
  }
  /**
   * The color light pink.
   * @type {Color}
   * @readonly
   */
  public static get lightPink(): Color {
    return new Color(1, 0.714, 0.757);
  }
  /**
   * The color light salmon.
   * @type {Color}
   * @readonly
   */
  public static get lightSalmon(): Color {
    return new Color(1, 0.627, 0.478);
  }
  /**
   * The color light sea green.
   * @type {Color}
   * @readonly
   */
  public static get lightSeaGreen(): Color {
    return new Color(0.125, 0.698, 0.667);
  }
  /**
   * The color light sky blue.
   * @type {Color}
   * @readonly
   */
  public static get lightSkyBlue(): Color {
    return new Color(0.529, 0.808, 0.98);
  }
  /**
   * The color light slate gray.
   * @type {Color}
   * @readonly
   */
  public static get lightSlateGray(): Color {
    return new Color(0.467, 0.533, 0.6);
  }
  /**
   * The color light steel blue.
   * @type {Color}
   * @readonly
   */
  public static get lightSteelBlue(): Color {
    return new Color(0.69, 0.769, 0.871);
  }
  /**
   * The color light yellow.
   * @type {Color}
   * @readonly
   */
  public static get lightYellow(): Color {
    return new Color(1, 1, 0.878);
  }
  /**
   * The color lime.
   * @type {Color}
   * @readonly
   */
  public static get lime(): Color {
    return new Color(0, 1, 0);
  }
  /**
   * The color lime green.
   * @type {Color}
   * @readonly
   */
  public static get limeGreen(): Color {
    return new Color(0.196, 0.804, 0.196);
  }
  /**
   * The color linen.
   * @type {Color}
   * @readonly
   */
  public static get linen(): Color {
    return new Color(0.98, 0.941, 0.902);
  }
   /**
   * The color maroon.
   * @type {Color}
   * @readonly
   */
  public static get maroon(): Color {
    return new Color(0.5, 0, 0);
  }
  /**
   * The color medium aquamarine.
   * @type {Color}
   * @readonly
   */
  public static get mediumAquamarine(): Color {
    return new Color(0.4, 0.804, 0.667);
  }
  /**
   * The color medium blue.
   * @type {Color}
   * @readonly
   */
  public static get mediumBlue(): Color {
    return new Color(0, 0, 0.804);
  }
  /**
   * The color medium orchid.
   * @type {Color}
   * @readonly
   */
  public static get mediumOrchid(): Color {
    return new Color(0.729, 0.333, 0.827);
  }
  /**
   * The color medium purple.
   * @type {Color}
   * @readonly
   */
  public static get mediumPurple(): Color {
    return new Color(0.576, 0.439, 0.859);
  }
  /**
   * The color medium sea green.
   * @type {Color}
   * @readonly
   */
  public static get mediumSeaGreen(): Color {
    return new Color(0.235, 0.702, 0.443);
  }
  /**
   * The color medium slate blue.
   * @type {Color}
   * @readonly
   */
  public static get mediumSlateBlue(): Color {
    return new Color(0.482, 0.408, 0.933);
  }
  /**
   * The color medium spring green.
   * @type {Color}
   * @readonly
   */
  public static get mediumSpringGreen(): Color {
    return new Color(0, 0.98, 0.604);
  }
  /**
   * The color medium turquoise.
   * @type {Color}
   * @readonly
   */
  public static get mediumTurquoise(): Color {
    return new Color(0.282, 0.82, 0.8);
  }
  /**
   * The color medium violet red.
   * @type {Color}
   * @readonly
   */
  public static get mediumVioletRed(): Color {
    return new Color(0.78, 0.082, 0.522);
  }
  /**
   * The color midnight blue.
   * @type {Color}
   * @readonly
   */
  public static get midnightBlue(): Color {
    return new Color(0.098, 0.098, 0.439);
  }
  /**
   * The color mint cream.
   * @type {Color}
   * @readonly
   */
  public static get mintCream(): Color {
    return new Color(0.961, 1, 0.98);
  }
  /**
   * The color misty rose.
   * @type {Color}
   * @readonly
   */
  public static get mistyRose(): Color {
    return new Color(1, 0.894, 0.882);
  }
  /**
   * The color moccasin.
   * @type {Color}
   * @readonly
   */
  public static get moccasin(): Color {
    return new Color(1, 0.894, 0.71);
  }
  /**
   * The color navajo white.
   * @type {Color}
   * @readonly
   */
  public static get navajoWhite(): Color {
    return new Color(1, 0.871, 0.678);
  }
  /**
   * The color navy.
   * @type {Color}
   * @readonly
   */
  public static get navy(): Color {
    return new Color(0, 0, 0.5);
  }
  /**
   * The color old lace.
   * @type {Color}
   * @readonly
   */
  public static get oldLace(): Color {
    return new Color(0.992, 0.961, 0.902);
  }
  /**
   * The color olive.
   * @type {Color}
   * @readonly
   */
  public static get olive(): Color {
    return new Color(0.5, 0.5, 0);
  }
  /**
   * The color olive drab.
   * @type {Color}
   * @readonly
   */
  public static get oliveDrab(): Color {
    return new Color(0.42, 0.557, 0.137);
  }
  /**
   * The color orange.
   * @type {Color}
   * @readonly
   */
  public static get orange(): Color {
    return new Color(1, 0.647, 0);
  }
  /**
   * The color orange red.
   * @type {Color}
   * @readonly
   */
  public static get orangeRed(): Color {
    return new Color(1, 0.271, 0);
  }
  /**
   * The color orchid.
   * @type {Color}
   * @readonly
   */
  public static get orchid(): Color {
    return new Color(0.855, 0.439, 0.839);
  }
  /**
   * The color pale goldenrod.
   * @type {Color}
   * @readonly
   */
  public static get paleGoldenrod(): Color {
    return new Color(0.933, 0.91, 0.667);
  }
  /**
   * The color pale green.
   * @type {Color}
   * @readonly
   */
  public static get paleGreen(): Color {
    return new Color(0.596, 0.984, 0.596);
  }
  /**
   * The color pale turquoise.
   * @type {Color}
   * @readonly
   */
  public static get paleTurquoise(): Color {
    return new Color(0.686, 0.933, 0.933);
  }
  /**
   * The color pale violet red.
   * @type {Color}
   * @readonly
   */
  public static get paleVioletRed(): Color {
    return new Color(0.859, 0.439, 0.576);
  }
  /**
   * The color papaya whip.
   * @type {Color}
   * @readonly
   */
  public static get papayaWhip(): Color {
    return new Color(1, 0.937, 0.835);
  }
  /**
   * The color peach puff.
   * @type {Color}
   * @readonly
   */
  public static get peachPuff(): Color {
    return new Color(1, 0.855, 0.725);
  }
  /**
   * The color peru.
   * @type {Color}
   * @readonly
   */
  public static get peru(): Color {
    return new Color(0.804, 0.522, 0.247);
  }
  /**
   * The color pink.
   * @type {Color}
   * @readonly
   */
  public static get pink(): Color {
    return new Color(1, 0.753, 0.796);
  }
  /**
   * The color plum.
   * @type {Color}
   * @readonly
   */
  public static get plum(): Color {
    return new Color(0.867, 0.627, 0.867);
  }
  /**
   * The color powder blue.
   * @type {Color}
   * @readonly
   */
  public static get powderBlue(): Color {
    return new Color(0.69, 0.878, 0.902);
  }
  /**
   * The color purple.
   * @type {Color}
   * @readonly
   */
  public static get purple(): Color {
    return new Color(0.5, 0, 0.5);
  }
  /**
   * The color rosy brown.
   * @type {Color}
   * @readonly
   */
  public static get rosyBrown(): Color {
    return new Color(0.737, 0.561, 0.561);
  }
  /**
   * The color royal blue.
   * @type {Color}
   * @readonly
   */
  public static get royalBlue(): Color {
    return new Color(0.255, 0.412, 0.882);
  }
  /**
   * The color saddle brown.
   * @type {Color}
   * @readonly
   */
  public static get saddleBrown(): Color {
    return new Color(0.545, 0.271, 0.075);
  }
  /**
   * The color salmon.
   * @type {Color}
   * @readonly
   */
  public static get salmon(): Color {
    return new Color(0.98, 0.502, 0.447);
  }
  /**
   * The color sandy brown.
   * @type {Color}
   * @readonly
   */
  public static get sandyBrown(): Color {
    return new Color(0.957, 0.643, 0.376);
  }
  /**
   * The color sea green.
   * @type {Color}
   * @readonly
   */
  public static get seaGreen(): Color {
    return new Color(0.18, 0.545, 0.341);
  }
  /**
   * The color sea shell.
   * @type {Color}
   * @readonly
   */
  public static get seaShell(): Color {
    return new Color(1, 0.961, 0.933);
  }
  /**
   * The color sienna.
   * @type {Color}
   * @readonly
   */
  public static get sienna(): Color {
    return new Color(0.627, 0.322, 0.176);
  }
  /**
   * The color silver.
   * @type {Color}
   * @readonly
   */
  public static get silver(): Color {
    return new Color(0.753, 0.753, 0.753);
  }
  /**
   * The color sky blue.
   * @type {Color}
   * @readonly
   */
  public static get skyBlue(): Color {
    return new Color(0.529, 0.808, 0.922);
  }
  /**
   * The color slate blue.
   * @type {Color}
   * @readonly
   */
  public static get slateBlue(): Color {
    return new Color(0.416, 0.353, 0.804);
  }
  /**
   * The color slate gray.
   * @type {Color}
   * @readonly
   */
  public static get slateGray(): Color {
    return new Color(0.439, 0.5, 0.565);
  }
  /**
   * The color snow.
   * @type {Color}
   * @readonly
   */
  public static get snow(): Color {
    return new Color(1, 0.98, 0.98);
  }
  /**
   * The color spring green.
   * @type {Color}
   * @readonly
   */
  public static get springGreen(): Color {
    return new Color(0, 1, 0.498);
  }
  /**
   * The color steel blue.
   * @type {Color}
   * @readonly
   */
  public static get steelBlue(): Color {
    return new Color(0.275, 0.51, 0.706);
  }
  /**
   * The color tan.
   * @type {Color}
   * @readonly
   */
  public static get tan(): Color {
    return new Color(0.824, 0.706, 0.549);
  }
  /**
   * The color teal.
   * @type {Color}
   * @readonly
   */
  public static get teal(): Color {
    return new Color(0, 0.5, 0.5);
  }
  /**
   * The color thistle.
   * @type {Color}
   * @readonly
   */
  public static get thistle(): Color {
    return new Color(0.847, 0.749, 0.847);
  }
  /**
   * The color tomato.
   * @type {Color}
   * @readonly
   */
  public static get tomato(): Color {
    return new Color(1, 0.388, 0.278);
  }
  /**
   * The color turquoise.
   * @type {Color}
   * @readonly
   */
  public static get turquoise(): Color {
    return new Color(0.251, 0.878, 0.816);
  }
  /**
   * The color violet.
   * @type {Color}
   * @readonly
   */
  public static get violet(): Color {
    return new Color(0.933, 0.51, 0.933);
  }
  /**
   * The color wheat.
   * @type {Color}
   * @readonly
   */
  public static get wheat(): Color {
    return new Color(0.961, 0.871, 0.702);
  }
  /**
   * The color white smoke.
   * @type {Color}
   * @readonly
   */
  public static get whiteSmoke(): Color {
    return new Color(0.961, 0.961, 0.961);
  }
  /**
   * The color yellow green.
   * @type {Color}
   * @readonly
   */
  public static get yellowGreen(): Color {
    return new Color(0.604, 0.804, 0.196);
  }
}