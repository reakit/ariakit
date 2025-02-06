import plugin from "tailwindcss/plugin";

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
 * Just to please TypeScript.
 * @typedef {{[key: string]: string | string[] | CssInJs | CssInJs[]}} CssInJs
 * @param {CssInJs} object
 */
function css(object) {
  return object;
}

/**
 * @typedef {"even" | "odd"} Parity
 * @typedef {(prop: string) => string} Key
 * @typedef {(prop: string, defaultValue?: string) => string} Inherit
 * @typedef {(prop: string, value?: string) => string} Provide
 * @typedef {{ key: Key, inherit: Inherit }} FromParentFnParams
 * @typedef {(params: FromParentFnParams) => CssInJs} FromParentFn
 * @param {string} namespace
 * @param {boolean} reset
 * @param {FromParentFn} fn
 */
function fromParent(namespace, reset, fn) {
  const getParityKey = () => `--_${namespace}-parity`;

  /** @param {Parity} parity */
  const getParity = (parity) => (parity === "even" && !reset ? "odd" : "even");

  /**
   * @param {Parity} parity
   * @returns {Inherit}
   */
  const createInherit = (parity) => (prop, defaultValue) => {
    return `var(${prop}-${parity}${defaultValue ? `, ${defaultValue}` : ""})`;
  };

  /**
   * @param {Parity} parity
   * @returns {Key}
   */
  const createKey = (parity) => (prop) => {
    return `${prop}-${getParity(parity)}`;
  };

  /**
   * @param {Parity} parity
   * @returns {CssInJs}
   */
  const getCss = (parity) => ({
    [getParityKey()]: getParity(parity),
    ...fn({
      key: createKey(parity),
      inherit: createInherit(parity),
    }),
  });

  if (reset) {
    return getCss("even");
  }

  /** @type {CssInJs} */
  const css = {};

  for (const parity of /** @type {Parity[]} */ (["even", "odd"])) {
    css[`@container style(${getParityKey()}: ${parity})`] = getCss(parity);
  }

  css[`@container not style(${getParityKey()})`] = getCss("even");

  return css;
}

/** @type {ReturnType<typeof plugin>} */
const AriakitTailwind = plugin(({ addUtilities, matchUtilities, theme }) => {
  /**
   * Returns either the inline value or the CSS variable reference.
   * @param {string} namespace
   * @param {string} token
   * @param {string} [defaultValue]
   */
  function t(namespace, token, defaultValue) {
    const options = theme(namespace)?.__CSS_VALUES__?.[token];
    const key = `--${namespace}-${token}`;
    if (isInlineThemeReference(options)) {
      return theme(key, defaultValue);
    }
    if (defaultValue) {
      return `var(${key}, ${defaultValue})`;
    }
    return `var(${key})`;
  }

  function getLayerValues(onlyLevels = false) {
    const { __CSS_VALUES__, ...colors } = theme("colors");
    const keys = Object.keys(colors);
    const maxNonBareLevels = 10;
    /** @type {Record<string, string>} */
    const values = {
      // @ts-expect-error
      __BARE_VALUE__: ({ value }) => {
        const { token } = parseColorLevel(value);
        if (!token) return value;
        if (!theme("colors")[token]) return;
        return value;
      },
    };
    // Add non bare level values
    for (let i = 0; i <= maxNonBareLevels; i++) {
      values[i] = `${i}`;
    }
    // Add non bare color and level values
    if (!onlyLevels) {
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
    }
    return values;
  }

  /** @param {string} [value] */
  function parseColorLevel(value) {
    if (!value) {
      return { token: undefined, level: "1" };
    }
    const matches = value.match(/\d+$/);
    if (!matches) {
      return { token: value, level: "0" };
    }
    const [level] = matches;
    if (!level || theme("colors")[value]) {
      return { token: value, level: "0" };
    }
    return { token: value.slice(0, -level.length - 1), level };
  }

  /**
   * @param {string | null | undefined} token
   * @param {string} level
   */
  function getLayerCss(token, level, highlightLevel = level) {
    const contrastBase = t("layer", "contrast", "8");
    const contrastUp = t("layer", "contrast-up", contrastBase);
    const contrastDown = t("layer", "contrast-down", contrastBase);
    const contrast = level.startsWith("-") ? contrastDown : contrastUp;
    const l = `calc(max(l, 0.11) + var(--_layer-level) * 0.01 * ${contrast})`;
    const c = `calc(c - ${abs("var(--_layer-level)")} * 0.0004 * ${contrast})`;

    const textL = `calc((49.44 - l) * infinity)`;
    const isBgDark = `clamp(0, ${textL}, 1)`;
    const isBgLight = `clamp(0, 1 - ${textL}, 1)`;
    const alphaBase = `calc(20% * ${isBgDark} + 15% * ${isBgLight})`;
    const alphaAdd = `calc(l * 0.5% * ${isBgDark} + (100 - l) * 0.5% * ${isBgLight})`;
    const alpha = `calc(${alphaBase} + ${alphaAdd})`;

    return css({
      backgroundColor: `var(--ak-layer)`,
      "@apply border-(--ak-border) ring-(--ak-border)": {},

      "--ak-border": `lch(from var(--ak-layer) ${textL} c h / ${alpha})`,

      ...(token
        ? {
            "--ak-layer-base": `oklch(from ${t("color", token)} ${l} ${c} h)`,
            "--ak-layer-current": `var(--ak-layer-base)`,
          }
        : {
            "--ak-layer-current": `oklch(from var(--ak-layer-base) ${l} ${c} h)`,
          }),

      "--ak-layer": `var(--ak-layer-current)`,
      "--ak-layer-level": level,

      ...fromParent("layer", !!token, ({ key, inherit }) => ({
        [key("--_layer-level")]: token
          ? "0"
          : `calc(${inherit("--_layer-level")} + ${highlightLevel})`,
        "--_layer-level": token
          ? level
          : `calc(${inherit("--_layer-level")} + ${level})`,
        "--ak-layer-level": `var(${key("--_layer-level")})`,
      })),
    });
  }

  /**
   * @param {string} level
   * @param {string | number} threshold
   * @param {string | number} contrast
   */
  function getLayerInvertCss(level, threshold, contrast) {
    // light: -1, dark: 1
    const mode = `clamp(-1, (calc(${threshold} * 10) - l * 10) * infinity - 1, 1)`;
    const l = `calc(l + ${mode} * ${level} * 0.01 * ${contrast})`;
    return {
      ...getLayerCss(null, "0", level),
      "--ak-layer": `oklch(from var(--ak-layer-current) ${l} c h)`,
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

  matchUtilities(
    {
      "ak-layer-down-hover": (value) => getLayerHoverCss(`-${value}`),
      "ak-layer-hover": getLayerHoverCss,
      "ak-layer-down-highlight": (value) => getLayerHighlightCss(`-${value}`),
      "ak-layer-highlight": getLayerHighlightCss,
    },
    { values: getLayerValues(true) },
  );

  addUtilities({
    ".ak-layer": getLayerCss(null, "1"),
    ".ak-layer-down": getLayerCss(null, "-1"),
    ".ak-layer-current": getLayerCss(null, "0"),
    ".ak-layer-hover": getLayerHoverCss("1"),
    ".ak-layer-down-hover": getLayerHighlightCss("-1"),
    ".ak-layer-highlight": getLayerHighlightCss("1"),
    ".ak-layer-down-highlight": getLayerHighlightCss("-1"),
  });
});

export default AriakitTailwind;
