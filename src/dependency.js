export default function dependency(name, version, main) {
  return {
    resolve(path = main) {
      return `https://cdn.jsdelivr.net/npm/${name}@${version}/${path}`;
    }
  };
}
