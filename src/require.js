import {require as requireDefault, requireFrom} from "d3-require";

export default function(resolver) {
  const require = resolver == null ? requireDefault : requireFrom(resolver);
  require.alias = requireAlias(require.resolve);
  return require;
}

function requireAlias(resolve) {
  return map => requireFrom((name, base) => {
    return resolve(name in map ? map[name] : name, base);
  });
}
