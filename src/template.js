export default function template(compile) {
  return function(strings) {
    var string = strings[0],
        parts = [], part,
        node,
        template = document.createElement("template"),
        fragment = template.content,
        walker,
        i, n, j, m;

    // Concatenate the template contents, using comments as placeholders.
    for (i = 1, n = arguments.length; i < n; ++i) {
      part = arguments[i];
      if (Array.isArray(part)) {
        fragment = document.createDocumentFragment();
        for (j = 0, m = part.length; j < m; ++j) {
          node = part[j];
          fragment.appendChild(node instanceof Node ? node : document.createTextNode(node));
        }
        part = fragment;
      }
      if (part instanceof Node) {
        parts[i] = part;
        part = "<!--o:" + i + "-->";
      }
      string += part + strings[i];
    }

    // Compile the template.
    template.innerHTML = compile(string);

    // Walk the template, replacing comment placeholders.
    walker = document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT, null, false);
    while (walker.nextNode()) {
      node = walker.currentNode;
      if (/^o:/.test(node.nodeValue)) {
        node.parentNode.replaceChild(parts[node.nodeValue.slice(2)], node);
      }
    }

    // If the document fragment is a single node, detach and return the node.
    return fragment.childNodes.length === 1
        ? fragment.removeChild(fragment.firstChild)
        : fragment;
  };
}
