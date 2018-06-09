export default function(values, initial_selection) {
  var select = document.createElement("select");
  Array.prototype.forEach.call(values, function(value) {
    var option = document.createElement("option");
    option.value = option.textContent = value;
    option.defaultSelected = initial_selection == value;
    select.appendChild(option);
  });
  return select;
}
