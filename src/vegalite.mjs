import {vega, vegalite, vegaliteApi} from "./dependencies.mjs";

export default async function vl(require) {
  const [v, vl, api] = await Promise.all([vega, vegalite, vegaliteApi].map(d => require(d.resolve())));
  return api.register(v, vl);
}
