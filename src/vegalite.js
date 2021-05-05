export default function vl(require) {
  return async () => {
    const [vega, vegalite, api] = await Promise.all([
      "vega@5.20.2/build/vega.min.js",
      "vega-lite@5.1.0/build/vega-lite.min.js",
      "vega-lite-api@5.0.0/build/vega-lite-api.min.js"
    ].map(module => require(module)));
    return api.register(vega, vegalite);
  };
}
