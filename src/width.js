import observe from "./generators/observe";

export default function() {
  return observe(function(change) {
    var width = change(document.body.clientWidth);
    function resized() {
      var w = document.body.clientWidth;
      if (w !== width) change(width = w);
    }
    window.addEventListener("resize", resized);
    return function() {
      window.removeEventListener("resize", resized);
    };
  });
}
