export default function() {
  return function(descriptor) {
    var url = "https://s3-us-west-1.amazonaws.com/observable-dev-user-uploads/" + descriptor.hash;
    switch (descriptor.as) {
      case 'text':
        return fetch(url)
          .then(function (response) { return response.text(); });
      case 'json':
        return fetch(url)
          .then(function (response) { return response.json(); });
      default:
        throw new Error("Unknown file parsing strategy");
    }
  };
}
