export default function template(render) {
  return function(strings) {
    var string = strings[0],
        parts = [], part,
        root = null,
        node, nodes,
        walker,
        i, n, j, m, k = -1;

    // Concatenate the text using comments as placeholders.
    for (i = 1, n = arguments.length; i < n; ++i) {
      part = arguments[i];
      if (part instanceof Node) {
        parts[++k] = part;
        string += "<!--o:" + k + "-->";
      } else if (Array.isArray(part)) {
        for (j = 0, m = part.length; j < m; ++j) {
          node = part[j];
          if (node instanceof Node) {
            if (root === null) {
              parts[++k] = root = document.createDocumentFragment();
              string += "<!--o:" + k + "-->";
            }
            root.appendChild(node);
          } else {
            root = null;
            string += node;
          }
        }
        root = null;
      } else {
        string += part;
      }
      string += strings[i];
    }

    // Render the text.
    root = render(string);

    // Walk the rendered content to replace comment placeholders.
    if (++k > 0) {
      nodes = new Array(k);
      walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, null, false);
      while (walker.nextNode()) {
        node = walker.currentNode;
        if (/^o:/.test(node.nodeValue)) {
          nodes[+node.nodeValue.slice(2)] = node;
        }
      }
      for (i = 0; i < k; ++i) {
        if (node = nodes[i]) {
          node.parentNode.replaceChild(parts[i], node);
        }
      }
    }

    // If the rendered content is a single node, detach and return the node.
    return root.childNodes.length === 1
        ? root.removeChild(root.firstChild)
        : root;
  };
}
