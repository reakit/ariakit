import colorString from "color-string";
import plugin from "tailwindcss/plugin";

const LIGHTNESS_LEVELS = 20;

const $ = /** @type {const} */ ({
  layer: "--ak-layer",
  layerBase: "--ak-layer-base",
  layerParent: "--ak-layer-parent",
  frameRadius: "--ak-frame-radius",
  framePadding: "--ak-frame-padding",
  text: "--ak-text",
  edge: "--ak-edge",
  shadow: "--ak-shadow",

  _layerL: "--_ak-layer-l",
  _layerAppearance: "--_ak-layer-appearance",
  _layerLevel: "--_ak-layer-level",
  _layerParent: "--_ak-layer-parent",
  _layerOriginal: "--_ak-layer-original",
});

/** @type {ReturnType<typeof plugin>} */
const AriakitTailwind = plugin(
  ({ addBase, addVariant, addUtilities, matchUtilities, theme }) => {
    addBase({
      // Whether the layer is dark (lch(100 0 0)) or light (lch(0 0 0))
      [`@property ${$._layerAppearance}`]: {
        syntax: "'<color>'",
        inherits: "true",
        initialValue: "lch(0 0 0)",
      },
      // The rounded lightness value of the layer (0-100)
      [`@property ${$._layerL}`]: {
        syntax: "'<color>'",
        inherits: "true",
        initialValue: "oklch(100 0 0)",
      },
    });

    const IN_DARK = `@container style(${$._layerAppearance}: lch(100 0 0))`;
    const IN_LIGHT = `@container style(${$._layerAppearance}: lch(0 0 0))`;
    addVariant("ak-dark", IN_DARK);
    addVariant("ak-light", IN_LIGHT);

    /**
     * @param {string | null | undefined} token
     * @param {string} level
     * @param {string} [highlightLevel]
     */
    function getLayerCss(token, level, highlightLevel) {
      const baseColor = tv("color", token, cssVar($.layerBase));

      const { l, c, h } = getLayerOkLCH(
        level,
        // If the color token is provided, we use the level as is, otherwise we
        // stack the levels.
        token ? level : cssVar($._layerLevel),
      );

      const isDown = level.startsWith("-");

      const textL = `calc((49.44 - l) * infinity)`;
      const isBgDark = `clamp(0, ${textL}, 1)`;
      const isBgLight = `clamp(0, 1 - ${textL}, 1)`;

      const borderC = `calc(c * 3)`;
      const borderAlphaBase = `calc(15% * ${isBgDark} + 15% * ${isBgLight})`;
      const borderAlphaLAdd = `calc(l * 0.1% * ${isBgDark} + (100 - l) * 0.1% * ${isBgLight})`;
      const borderAlphaCAdd = `calc(c * 0.2%)`;
      const borderAlpha = `calc(${borderAlphaBase} + ${borderAlphaLAdd} + ${borderAlphaCAdd})`;

      const shadowAlpha = `calc(25% + (1 - l) * 25%)`;

      const result = css({
        backgroundColor: cssVar($.layer),
        color: cssVar($.text),

        [$.shadow]: `oklch(from ${cssVar($.layer)} 0 0 0 / ${shadowAlpha})`,
        [$.edge]: `lch(from ${cssVar($.layer)} ${textL} ${borderC} h / ${borderAlpha})`,
        [$.text]: `lch(from ${cssVar($.layer)} ${textL} 0 0 / 100%)`,
        [$.layer]: cssVar($._layerOriginal),

        [`@apply border-(color:${$.edge}) ring-(color:${$.edge}) shadow-(color:${$.shadow})`]:
          {},

        [$._layerAppearance]: `lch(from var(--ak-layer) ${textL} 0 0 / 100%)`,
        [$._layerL]: `lch(from var(--ak-layer) round(l, ${100 / LIGHTNESS_LEVELS}) 0 0 / 100%)`,
      });

      if (token) {
        Object.assign(result, {
          [$.layerBase]:
            level === "0"
              ? baseColor
              : `oklch(from ${baseColor} ${l} ${c} ${h})`,
          [$._layerOriginal]: cssVar($.layerBase),
        });
      } else {
        Object.assign(result, {
          [$._layerOriginal]: `oklch(from ${baseColor} ${l} ${c} ${h})`,
        });
      }

      Object.assign(
        result,
        withParent("layer", !!token, ({ provide, inherit }) => ({
          // Provide the current layer level for children
          [provide($._layerLevel)]: token
            ? // Reset level for children when using a color token
              "0"
            : // If the color token is not provided, continue the level stack
              `calc(${inherit($._layerLevel)} + ${highlightLevel || level})`,
          // Provide the current layer level for itself
          [$._layerLevel]: `calc(${inherit($._layerLevel)} + ${level})`,
        })),
      );

      Object.assign(
        result,
        withParent("layer-parent", false, ({ provide, inherit }) => ({
          [provide($._layerParent)]: cssVar($.layer),
          [$.layerParent]: inherit($._layerParent),

          ...(!isDown && {
            // "--ak-edge": `lch(from ${inherit(AK_LAYER_PARENT)} ${textL} c h / ${borderAlpha})`,
            [$.shadow]: `oklch(from ${inherit($._layerParent)} 0 0 0 / ${shadowAlpha})`,
          }),
        })),
      );

      return result;
    }

    matchUtilities(
      {
        "ak-layer-down": (value) => {
          const { token, level } = parseColorLevel(value);
          return getLayerCss(token, `-${level}`);
        },
        "ak-layer": (value) => {
          const { token, level } = parseColorLevel(value);
          return getLayerCss(token, level);
        },
      },
      { values: getLayerValues() },
    );

    addUtilities({
      ".ak-layer-current": getLayerCss(null, "0"),
    });

    matchUtilities(
      {
        "ak-layer-mix": (value, { modifier }) => {
          const { token, level } = parseColorLevel(value);
          const baseColor = tv("color", token, cssVar($.layerParent));
          const { l, c, h } = getLayerOkLCH(level, level);
          const color = `oklch(from ${baseColor} ${l} ${c} ${h})`;
          const percentage = toPercent(modifier, "50%");
          return getLayerCss(
            `color-mix(in oklab, ${cssVar($.layerParent)}, ${color} ${percentage})`,
            level,
          );
        },
      },
      {
        values: getLayerValues(),
        modifiers: "any",
      },
    );

    /**
     * @param {string} level
     * @param {string | number} threshold
     * @param {string | number} contrast
     */
    function getLayerInvertCss(level, threshold, contrast) {
      // light: -1, dark: 1
      const mode = `clamp(-1, (calc(${threshold} * 10) - l * 10) * infinity - 1, 1)`;
      const relativeLevel = `calc(${level} * ${mode})`;
      const l = `calc(l + ${relativeLevel} * 0.01 * ${contrast})`;
      return {
        ...getLayerCss(null, "0", relativeLevel),
        [$.layer]: `oklch(from ${cssVar($._layerOriginal)} ${l} c h)`,
      };
    }

    /** @param {string} level */
    function getLayerHighlightCss(level) {
      const threshold = t("layer", "highlight-threshold", "0.92");
      const contrastBase = t("layer", "highlight-contrast", "8");
      const contrastUp = t("layer", "highlight-contrast-up", contrastBase);
      const contrastDown = t("layer", "highlight-contrast-down", contrastBase);
      const contrast = level.startsWith("-") ? contrastDown : contrastUp;
      return getLayerInvertCss(level, threshold, contrast);
    }

    /** @param {string} level */
    function getLayerHoverCss(level) {
      const threshold = t("layer", "hover-threshold", "0.5");
      const contrastBase = t("layer", "hover-contrast", "8");
      const contrastUp = t("layer", "hover-contrast-up", contrastBase);
      const contrastDown = t("layer", "hover-contrast-down", contrastBase);
      const contrast = level.startsWith("-") ? contrastDown : contrastUp;
      return getLayerInvertCss(level, threshold, contrast);
    }

    matchUtilities(
      {
        "ak-layer-down-hover": (value) => getLayerHoverCss(`-${value}`),
        "ak-layer-hover": getLayerHoverCss,
        "ak-layer-down-highlight": (value) => getLayerHighlightCss(`-${value}`),
        "ak-layer-highlight": getLayerHighlightCss,
      },
      { values: getLayerValues({ colors: false }) },
    );

    /**
     * @param {string} radiusKey
     * @param {string | null} [modifier]
     * @param {boolean} [force]
     */
    function getFrameCss(radiusKey, modifier, force = false) {
      const radius = t("radius", radiusKey);
      const padding =
        modifier ||
        (radiusKey === "DEFAULT"
          ? "0px"
          : theme("spacing")[radiusKey]
            ? t("spacing", radiusKey)
            : "0px");

      const result = { padding, borderRadius: radius };

      Object.assign(
        result,
        withParent("frame", force, ({ provide, inherit }) => {
          const computedRadius = force
            ? radius
            : `calc(${inherit($.frameRadius, radius)} - ${inherit($.framePadding, "0px")})`;
          return {
            [provide($.framePadding)]: padding,
            [provide($.frameRadius)]: computedRadius,
            borderRadius: computedRadius,
          };
        }),
      );

      return result;
    }

    matchUtilities(
      {
        "ak-frame-force": (radiusKey, extra) =>
          getFrameCss(radiusKey, extra.modifier, true),
        "ak-frame": (radiusKey, extra) =>
          getFrameCss(radiusKey, extra.modifier),
      },
      {
        values: Object.keys(theme("radius")).reduce(
          (acc, key) => {
            if (key === "__CSS_VALUES__") return acc;
            acc[key] = key;
            return acc;
          },
          /** @type {Record<string, string>} */ ({}),
        ),
        modifiers: Object.keys(theme("spacing")).reduce(
          (acc, key) => {
            if (key === "__CSS_VALUES__") return acc;
            if (key === "DEFAULT") return acc;
            const isNumber = /^\d*\.?\d+$/u.test(key);
            if (isNumber) {
              acc[key] = `--spacing(${key})`;
            } else {
              acc[key] = t("spacing", key);
            }
            return acc;
          },
          /** @type {Record<string, string>} */ ({}),
        ),
      },
    );

    matchUtilities(
      {
        "ak-text": (value) => {
          const { token } = parseColorLevel(value);
          const baseColor = tv("color", token, cssVar($.layer));

          // const colored = baseColor === "var(--ak-layer)" ? 0 : -1;
          // const textL = `calc((49.44 - l) * infinity)`;
          // const isBgDark = `clamp(0, ${textL}, 1)`;
          // const isBgLight = `clamp(0, 1 - ${textL}, 1)`;
          // const baseAlpha = `((45.7 * ${isBgDark}) + (53.6 * ${isBgLight}))`;
          // const lAdd = `((l * 1.08 * ${isBgDark}) + ((100 - l) * 0.85 * ${isBgLight}))`;
          // const cAdd = `(c * 0.036)`;
          // const minAlpha = `calc(${baseAlpha} + ${lAdd} + ${cAdd})`;
          // const alpha = `clamp(${minAlpha} * 1%, 0%, 100%)`;

          return withLayerLevel((l) => {
            if (l === 50) return;
            const l2 = l < 50 ? l + 53 : l - 53;
            const lString = l < 50 ? `max(l, ${l2})` : `min(l, ${l2})`;
            const c = l > 50 ? `min(c, 92)` : `c`;
            return {
              [$.text]: `lch(from ${baseColor} ${lString} ${c} h / 100%)`,
              color: cssVar($.text),
            };
          });
        },
      },
      {
        values: { ...getLayerValues(), DEFAULT: "0" },
      },
    );

    // =========================================================================
    // ===== THEME UTILS =======================================================
    // =========================================================================

    /**
     * Returns either the inline value or the CSS variable reference.
     * @param {string} namespace
     * @param {string} token
     * @param {string} [defaultValue]
     */
    function t(namespace, token, defaultValue) {
      const options = theme(namespace)?.__CSS_VALUES__?.[token];
      const key = `--${namespace}${token === "DEFAULT" ? "" : `-${token}`}`;
      if (isInlineThemeReference(options)) {
        return theme(key, defaultValue);
      }
      if (defaultValue) {
        return `var(${key}, ${defaultValue})`;
      }
      return `var(${key})`;
    }

    /**
     * Returns either t(namespace, token) or the inline defaultValue if the
     * token is not provided.
     * @param {string} namespace
     * @param {string | null | undefined} token
     * @param {string} [defaultValue]
     */
    function tv(namespace, token, defaultValue) {
      if (!token) return defaultValue;
      if (theme(namespace)?.[token]) {
        return t(namespace, token);
      }
      return token;
    }

    /**
     * Returns the accepted values for the layer utilities.
     * @param {{ colors?: boolean, levels?: boolean, DEFAULT?: string }}
     * [options]
     */
    function getLayerValues({
      colors = true,
      levels = true,
      DEFAULT = levels ? "1" : undefined,
    } = {}) {
      const { __CSS_VALUES__, ...themeColors } = theme("colors");
      const keys = Object.keys(themeColors);
      const maxNonBareLevels = 10;
      /** @type {Record<string, string>} */
      const values = {};
      if (DEFAULT) {
        values.DEFAULT = DEFAULT;
      }
      if (levels) {
        // Add non bare level values
        for (let i = 0; i <= maxNonBareLevels; i++) {
          values[i] = `${i}`;
        }
      }
      // Add non bare color and level values
      if (colors) {
        for (const key of keys) {
          const hasTrailingNumber = /-\d+$/.test(key);
          if (hasTrailingNumber) {
            values[key] = key;
            continue;
          }
          values[key] = key;
          for (let i = 1; i <= maxNonBareLevels; i++) {
            values[`${key}-${i}`] = `${key}-${i}`;
          }
        }
        Object.assign(
          values,
          bareValue(({ value }) => {
            const { token } = parseColorLevel(value);
            if (!token) return;
            if (!theme("colors")[token]) return;
            return token;
          }),
        );
      }
      return values;
    }

    /**
     * Parses the color token and level from the provided value.
     * @param {string} [value]
     */
    function parseColorLevel(value) {
      if (!value) {
        return { token: undefined, level: "1" };
      }
      const matches = value.match(/\d+$/);
      if (!matches) {
        return { token: value, level: "0" };
      }
      const [level] = matches;
      if (!level || theme("colors")[value] || colorString.get(value)) {
        return { token: value, level: "0" };
      }
      return { token: value.slice(0, -level.length - 1), level };
    }

    /**
     * Returns the layer's computed okLCH values based on the provided level.
     * @param {string} level
     * @param {string} computedLevel
     */
    function getLayerOkLCH(level, computedLevel) {
      const isDown = level.startsWith("-");
      const minL = 0.11;
      const contrastBase = t("layer", "contrast", "8");
      const contrastUp = t("layer", "contrast-up", contrastBase);
      const contrastDown = t("layer", "contrast-down", contrastBase);
      const contrast = isDown ? contrastDown : contrastUp;
      const l = `calc(max(l, ${minL}) + ${computedLevel} * 0.01 * ${contrast})`;
      const c = `calc(c - ${abs(computedLevel)} * 0.0004 * ${contrast})`;
      const h = "h";
      return { l, c, h };
    }
  },
);

// =============================================================================
// ===== UTILS =================================================================
// =============================================================================

/**
 * @param {(typeof $)[keyof typeof $]} name
 * @param {string} [defaultValue]
 */
function cssVar(name, defaultValue) {
  return `var(${name}${defaultValue ? `, ${defaultValue}` : ""})`;
}

/**
 * @param {number} [value]
 */
function isInlineThemeReference(value) {
  if (!value) return false;
  if (value & (1 << 0)) return true;
  if (value & (1 << 1)) return true;
  return false;
}

/**
 * Return the absolute value in CSS.
 * @param {string} value
 */
function abs(value) {
  return `max(${value}, ${value} * -1)`;
}

/**
 * Parses a string value into a percentage.
 * @param {string | null | undefined} value
 * @param {string} [defaultValue]
 */
function toPercent(value, defaultValue = "100%") {
  if (!value) return defaultValue;
  return /^\d+$/.test(value) ? `${value}%` : value;
}

/**
 * Just to please TypeScript.
 * @typedef {{[key: string]: string | string[] | CssInJs | CssInJs[]}} CssInJs
 * @param {CssInJs} [object]
 */
function css(object = {}) {
  return object;
}

/**
 * @typedef {{ value: string, kind: string, fraction: string | null }}
 * BareValueFnParams
 * @param {(params: BareValueFnParams) => string | undefined} fn
 * @returns {Record<string, string>}
 */
function bareValue(fn) {
  return {
    // @ts-expect-error
    __BARE_VALUE__: fn,
  };
}

/**
 * Returns CSS that enables a child to apply CSS based on the parent's layer
 * lightness level (0-100).
 * @param {(l: number) => CssInJs | null | undefined} fn
 */
function withLayerLevel(fn) {
  const levels = Array.from(
    { length: LIGHTNESS_LEVELS + 1 },
    (_, i) => (i / LIGHTNESS_LEVELS) * 100,
  );
  return levels.reduce((acc, l) => {
    l = Math.round(l);
    const query = `@container style(${$._layerL}: lch(${l} 0 0))`;
    const result = fn(l);
    if (!result) return acc;
    Object.assign(acc, { [query]: result });
    return acc;
  }, css());
}

/**
 * Returns CSS that enables a child to inherit CSS variables from its parent.
 * @typedef {"even" | "odd"} Parity
 * @typedef {(prop: (typeof $)[keyof typeof $]) => string} Provide
 * @typedef {(prop: (typeof $)[keyof typeof $], defaultValue?: string) =>
 * string} Inherit
 * @typedef {{ provide: Provide, inherit: Inherit }} WithParentFnParams
 * @typedef {(params: WithParentFnParams) => CssInJs} WithParentFn
 * @param {string} id
 * @param {boolean} reset
 * @param {WithParentFn} fn
 */
function withParent(id, reset, fn) {
  const getParityKey = () => `--_ak-${id}-parity`;

  /** @param {Parity} parity */
  const getNextParity = (parity) =>
    // TODO: Check if this !reset is necessary
    parity === "even" && !reset ? "odd" : "even";

  /**
   * @param {Parity} parity
   * @returns {Inherit}
   */
  const createInherit = (parity) => (prop, defaultValue) => {
    return `var(${prop}-${parity}${defaultValue ? `, ${defaultValue}` : ""})`;
  };

  /**
   * @param {Parity} parity
   * @returns {Provide}
   */
  const createProvide = (parity) => (prop) => {
    return `${prop}-${getNextParity(parity)}`;
  };

  /**
   * @param {Parity} [parity]
   * @returns {CssInJs}
   */
  const getCss = (parity = "even") => ({
    [getParityKey()]: getNextParity(parity),
    ...fn({
      provide: createProvide(parity),
      inherit: createInherit(parity),
    }),
  });

  if (reset) {
    return getCss();
  }

  /** @type {CssInJs} */
  const css = {};

  for (const parity of /** @type {Parity[]} */ (["even", "odd"])) {
    css[`@container style(${getParityKey()}: ${parity})`] = getCss(parity);
  }

  css[`@container not style(${getParityKey()})`] = getCss();

  return css;
}

export default AriakitTailwind;
