export default function*(iterator, transform) {
  var result, index = -1;
  while (!(result = iterator.next()).done) {
    yield transform(result.value, ++index);
  }
}
