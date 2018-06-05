import {require as requireDefault, requireFrom} from "d3-require";

export default function(resolve) {
  const require = resolve == null ? requireDefault : requireFrom(resolve);
  require.alias = requireAlias(require.resolve);
  return require;
}

function requireAlias(resolve) {
  return map => requireFrom((name, base) => {
    return resolve(name in map ? map[name] : name, base);
  });
}
