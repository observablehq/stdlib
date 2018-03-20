export default function(require) {
  return function() {
    return function(descriptor) {
      var url = "https://s3-us-west-1.amazonaws.com/observable-dev-user-uploads/" + descriptor.hash;
      switch (descriptor.as) {
        case 'text':
          return fetch(url)
            .then(function (response) { return response.text(); });
        case 'json':
          return fetch(url)
            .then(function (response) { return response.json(); });
        case 'csv':
          return fetch(url)
            .then(function (response) { return response.text(); })
            .then(function (text) {
              return require('d3-dsv@1.0.8')
                .then(function (d3) {
                  return d3.csvParse(text);
                });
            });
        default:
          throw new Error("Unknown file parsing strategy");
      }
    };
  };
}
