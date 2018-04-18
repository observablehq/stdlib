# @observablehq/notebook-stdlib

The Observable notebook standard library.

For examples, see https://beta.observablehq.com/@mbostock/standard-library.

## API Reference

* [DOM](#dom) - create HTML and SVG elements.
* [Files](#files) - read local files into memory.
* [Generators](#generators) - utilities for generators and iterators.
* [Promises](#promises) - utilities for promises.
* [require](#require) - load third-party libraries.
* [resolve](#resolve) - find third-party resources.
* [html](#html) - render HTML.
* [md](#markdown) - render Markdown.
* [svg](#svg) - render SVG.
* [tex](#tex) - render LaTeX.
* [now](#now) - the current value of Date.now.
* [width](#width) - the current page width.

### DOM

<a href="#DOM_canvas" name="DOM_canvas">#</a> DOM.<b>canvas</b>(<i>width</i>, <i>height</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/canvas.js "Source")

Returns a new canvas element with the specified *width* and *height*. For example, to create a 960×500 canvas:

```js
DOM.canvas(960, 500)
```

This is equivalent to using the [html](#html) tagged template literal:

```js
html`<canvas width=960 height=500>`
```

If you are using [2D Canvas](https://www.w3.org/TR/2dcontext/) (rather than [WebGL](https://webglfundamentals.org/)), you should use [DOM.context2d](#DOM_context2d) instead of DOM.canvas for automatic pixel density scaling.

<a href="#DOM_context2d" name="DOM_context2d">#</a> DOM.<b>context2d</b>(<i>width</i>, <i>height</i>[, <i>dpi</i>]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/context2d.js "Source")

Returns a new canvas context with the specified *width* and *height* and the specified device pixel ratio *dpi*. If *dpi* is not specified, it defaults to [*window*.devicePixelRatio](https://developer.mozilla.org/docs/Web/API/Window/devicePixelRatio). To access the context’s canvas, use [*context*.canvas](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/canvas). For example, to create a 960×500 canvas:

```js
{
  const context = DOM.context2d(960, 500);
  return context.canvas;
}
```

If you are using [WebGL](https://webglfundamentals.org/) (rather than [2D Canvas](https://www.w3.org/TR/2dcontext/)), you should use [DOM.canvas](#DOM_canvas) or  the [html](#html) tagged template literal instead of DOM.context2d.

<a href="#DOM_download" name="DOM_download">#</a> DOM.<b>download</b>(<i>object</i>\[, <i>name</i>\]\[, <i>value</i>\]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/download.js "Source")

Returns an anchor element containing a button that when clicked will download a file representing the specified *object*. The *object* should be anything supported by [URL.createObjectURL](https://developer.mozilla.org/docs/Web/API/URL/createObjectURL) such as a [file](https://developer.mozilla.org/docs/Web/API/File) or a [blob](https://developer.mozilla.org/docs/Web/API/Blob).

<a href="#DOM_element" name="DOM_element">#</a> DOM.<b>element</b>(<i>name</i>[, <i>attributes</i>]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/element.js "Source")

Returns a new element with the specified *name*. For example, to create an empty H1 element:

```js
DOM.element("h1")
```

This is equivalent to using the [html](#html) tagged template literal:

```js
html`<h1>`
```

If *attributes* is specified, sets any attributes in the specified object before returning the new element. For example:

```js
DOM.element("a", {target: "_blank"})
```

This is equivalent to using the [html](#html) tagged template literal:

```js
html`<a target=_blank>`
```

If the *name* has the prefix `svg:`, `math:` or `xhtml:`, uses [*document*.createElementNS](https://developer.mozilla.org/docs/Web/API/Document/createElementNS) instead of [*document*.createElement](https://developer.mozilla.org/docs/Web/API/Document/createElement). For example, to create an empty SVG element (see also [DOM.svg](#DOM_svg)):

```js
DOM.element("svg:svg")
```

This is equivalent to using the [svg](#svg) (or [html](#html)) tagged template literal:

```js
svg`<svg>`
```

<a href="#DOM_input" name="DOM_input">#</a> DOM.<b>input</b>([<i>type</i>]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/input.js "Source")

Returns a new input element with the specified *type*. If *type* is not specified or null, a text input is created. For example, to create a new file input:

```js
DOM.input("file")
```

This is equivalent to using the [html](#html) tagged template literal:

```js
html`<input type=file>`
```

<a href="#DOM_range" name="DOM_range">#</a> DOM.<b>range</b>(\[<i>min</i>, \]\[<i>max</i>\]\[, <i>step</i>\]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/range.js "Source")

Returns a new range input element. (See also [DOM.input](#input).) If *max* is specified, sets the maximum value of the range to the specified number; if *max* is not specified or null, sets the maximum value of the range to 1. If *min* is specified, sets the minimum value of the range to the specified number; if *min* is not specified or null, sets the minimum value of the range to 0. If *step* is specified, sets the step value of the range to the specified number; if *step* is not specified or null, sets the step value of the range to `any`. For example, to create a slider that ranges the integers from -180 to +180, inclusive:

```js
DOM.range(-180, 180, 1)
```

This is equivalent to using the [html](#html) tagged template literal:

```js
html`<input type=range min=-180 max=180 step=1>`
```

<a href="#DOM_select" name="DOM_select">#</a> DOM.<b>select</b>(<i>values</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/select.js "Source")

Returns a new select element with an option for each string in the specified *values* array. For example, to create a drop-down menu of three colors:

```js
DOM.select(["red", "green", "blue"])
```

This is equivalent to using the [html](#html) tagged template literal:

```js
html`<select>
  <option value="red">red</option>
  <option value="green">green</option>
  <option value="blue">blue</option>
</select>`
```

Or, from an array of data:

```js
html`<select>${colors.map(color => `
  <option value="${color}">${color}</option>`)}
</select>`
```

The template literal approach is recommended instead of DOM.select for greater control, such as when the value and label of the select options are different.

<a href="#DOM_svg" name="DOM_svg">#</a> DOM.<b>svg</b>(<i>width</i>, <i>height</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/svg.js "Source")

Returns a new SVG element with the specified *width* and *height*. For example, to create a 960×500 blank SVG:

```js
DOM.svg(960, 500)
```

This is equivalent to using the [svg](#svg) tagged template literal:

```js
svg`<svg width=960 height=500 viewBox="0,0,960,500">`
```

To create responsive SVG, set the max-width to 100% and the height to auto:

```js
svg`<svg
  width=960
  height=500
  viewBox="0,0,960,500"
  style="max-width:100%;height:auto;"
>`
```

<a href="#DOM_text" name="DOM_text">#</a> DOM.<b>text</b>(<i>string</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/text.js "Source")

Returns a new text node with the specified *string* value. For example, to say hello:

```js
DOM.text("Hello, world!")
```

This is equivalent to using the [html](#html) tagged template literal:


```js
html`Hello, world!`
```

<a href="#DOM_uid" name="DOM_uid">#</a> DOM.<b>uid</b>([<i>name</i>]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/dom/uid.js "Source")

Returns a new unique *identifier*. If *name* is specified, the *identifier*.id will be derived from the specified *name*, which may be useful for debugging. If DOM.uid is called repeatedly with the same *name*, every returned *identifier* is still unique (that is, different). Identifiers are useful in SVG: use *identifier*.href for IRI references, such as the [xlink:href](https://www.w3.org/TR/SVG/animate.html#HrefAttribute) attribute; use *identifier*.toString for functional notation, such as the [clip-path](https://www.w3.org/TR/SVG/masking.html#ClipPathProperty) presentation attribute.

For example, to clip the Mona Lisa to a circle of radius 320px:

```js
{
  const clip = uid("clip");
  return svg`<svg width="640" height="640">
  <defs>
    <clipPath id="${clip.id}">
      <circle cx="320" cy="320" r="320"></circle>
    </clipPath>
  </defs>
  <image
    clip-path="${clip}"
    width="640" height="640"
    preserveAspectRatio="xMidYMin slice"
    xlink:href="https://raw.githubusercontent.com/mbostock/9511ae067889eefa5537eedcbbf87dab/raw/98449954e2eea4ef96c177759635de49a970e8c6/mona-lisa.jpg"
  ></image>
</svg>`;
}
```

The use of DOM.uid is strongly recommended over hand-coding as it ensures that your identifiers are still unique if your code is imported into another notebook. Because *identifier*.href and *identifier*.toString return absolute rather than local IRIs, it also works well in conjunction with a notebook’s [base URL](https://developer.mozilla.org/docs/Web/HTML/Element/base).

### Files

See [Reading Local Files](https://beta.observablehq.com/@mbostock/reading-local-files) for examples.

<a href="#Files_buffer" name="Files_buffer">#</a> Files.<b>buffer</b>(<i>file</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/files/buffer.js "Source")

Reads the specified *file*, returning a promise of the ArrayBuffer yielded by [*fileReader*.readAsArrayBuffer](https://developer.mozilla.org/docs/Web/API/FileReader/readAsArrayBuffer). This is useful for reading binary files, such as shapefiles and ZIP archives.

<a href="#Files_text" name="Files_text">#</a> Files.<b>text</b>(<i>file</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/files/text.js "Source")

Reads the specified *file*, returning a promise of the string yielded by [*fileReader*.readAsText](https://developer.mozilla.org/docs/Web/API/FileReader/readAsText). This is useful for reading text files, such as plain text, CSV, Markdown and HTML.

<a href="#Files_url" name="Files_url">#</a> Files.<b>url</b>(<i>file</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/files/url.js "Source")

Reads the specified *file*, returning a promise of the data URL yielded by [*fileReader*.readAsDataURL](https://developer.mozilla.org/docs/Web/API/FileReader/readAsDataURL). This is useful for reading a file into memory, represented as a data URL. For example, to display a local file as an image:

```js
Files.url(file).then(url => {
  var image = new Image;
  image.src = url;
  return image;
})
```

A data URL may be significantly less efficient than [URL.createObjectURL](https://developer.mozilla.org/docs/Web/API/URL/createObjectURL) method for large files. For example:

```js
{
  const image = new Image;
  image.src = URL.createObjectURL(file);
  invalidation.then(() => URL.revokeObjectURL(image.src));
  return image;
}
```

### Generators

<a href="#Generators_disposable" name="Generators_disposable">#</a> Generators.<b>disposable</b>(<i>value</i>, <i>dispose</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/generators/disposable.js "Source")

Returns a new generator that yields the specified *value* exactly once. The [*generator*.return](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) method of the generator will call the specified *dispose* function, passing in the specified *value*. When this generator is the return value of a cell, this allows resources associated with the specified *value* to be disposed automatically when a cell is re-evaluated: *generator*.return is called by the Observable runtime on invalidation.  For example, to define a cell that creates a self-disposing [Tensor](https://js.tensorflow.org/):

```js
x = Generators.disposable(tf.tensor2d([[0.0, 2.0], [4.0, 6.0]]), x => x.dispose())
```

See also [invalidation](#invalidation).

<a href="#Generators_filter" name="Generators_filter">#</a> Generators.<b>filter</b>(<i>iterator</i>, <i>test</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/generators/filter.js "Source")

…

<a href="#Generators_input" name="Generators_input">#</a> Generators.<b>input</b>(<i>input</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/generators/input.js "Source")

…

<a href="#Generators_map" name="Generators_map">#</a> Generators.<b>map</b>(<i>iterator</i>, <i>transform</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/generators/map.js "Source")

…

<a href="#Generators_observe" name="Generators_observe">#</a> Generators.<b>observe</b>(<i>initialize</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/generators/observe.js "Source")

…

<a href="#Generators_queue" name="Generators_queue">#</a> Generators.<b>queue</b>(<i>initialize</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/generators/queue.js "Source")

…

<a href="#Generators_range" name="Generators_range">#</a> Generators.<b>range</b>([<i>start</i>, ]<i>stop</i>[, <i>step</i>]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/generators/range.js "Source")

…

<a href="#Generators_valueAt" name="Generators_valueAt">#</a> Generators.<b>valueAt</b>(<i>iterator</i>, <i>index</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/generators/valueAt.js "Source")

…

<a href="#Generators_worker" name="Generators_worker">#</a> Generators.<b>worker</b>(<i>source</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/generators/worker.js "Source")

Returns a new [disposable generator](#Generators_disposable) that yields a [dedicated Worker](https://developer.mozilla.org/docs/Web/API/Web_Workers_API) running the specified JavaScript *source*. For example, to create a worker that echos messages sent to it:

```js
worker = Generators.worker(`
onmessage = function({data}) {
  postMessage({echo: data});
};
`)
```

The worker will be automatically [terminated](https://developer.mozilla.org/docs/Web/API/Worker/terminate) when [*generator*.return](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Generator/return) is called.

### Promises

<a href="#Promises_delay" name="Promises_delay">#</a> Promises.<b>delay</b>(<i>duration</i>[, <i>value</i>]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/promises/delay.js "Source")

Returns a promise that resolves with the specified *value* after the specified *duration* in milliseconds.

<a href="#Promises_tick" name="Promises_tick">#</a> Promises.<b>tick</b>(<i>duration</i>[, <i>value</i>]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/promises/tick.js "Source")

Returns a promise that resolves with the specified *value* at the next integer multiple of *milliseconds* since the UNIX epoch. This is much like [Promises.delay](#Promises_delay), except it allows promises to be synchronized.

<a href="#Promises_when" name="Promises_when">#</a> Promises.<b>when</b>(<i>date</i>[, <i>value</i>]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/promises/when.js "Source")

… Note: the current implementation relies on [setTimeout](https://developer.mozilla.org/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout), and thus the specified *date* must be no longer than 2,147,483,647 milliseconds (24.9 days) from now.

### Specials

<a href="#invalidation" name="invalidation">#</a> <b>invalidation</b>

A promise that resolves when the current cell is re-evaluated: when the cell’s code changes, when it is run using Shift-Enter, or when a referenced input changes. This promise is typically used to dispose of resources that were allocated by the cell. For example, to abort a fetch if the cell is invalidated:

```js
{
  const controller = new AbortController;
  invalidation.then(() => controller.abort());
  const response = await fetch(url, {signal: controller.signal});
  return response.json();
}
```

The invalidation promise is provided by the runtime rather than the standard library because it resolves to a new promise each time a cell is evaluated. See also [Generators.disposable](#Generators_disposable).

<a href="#now" name="now">#</a> <b>now</b> [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/now.js "Source")

The current value of [Date.now](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date/now). For example, to display the current time in Markdown:

```js
md`The current time is: ${new Date(now).toISOString()}`
```

<a href="#width" name="width">#</a> <b>width</b> [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/width.js "Source")

The current width of cells. For example, to make a rounded rectangle in SVG that resizes to fit the page:

```js
html`<svg width=${width} height=200>
  <rect width=${width} height=200 rx=10 ry=10></circle>
</svg>`
```

### HTML

<a href="#html" name="html">#</a> <b>html</b>(<i>strings</i>, <i>values…</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/html.js "Source")

Returns the HTML element represented by the specified *strings* and *values*. This function is intended to be used as a [tagged template literal](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals_and_escape_sequences). For example, to create an H1 element whose content is “Hello, world!”:

```js
html`<h1>Hello, world!`
```

If the resulting HTML fragment is not a single HTML element or node, is it wrapped in a DIV element. For example, this expression:

```js
html`Hello, <b>world</b>!`
```

Is equivalent to this expression:

```js
html`<div>Hello, <b>world</b>!</div>`
```

If an embedded expression is a DOM element, it is embedded in generated HTML. For example, to embed [TeX](#tex) within HTML:

```js
html`I like ${tex`\KaTeX`} for math.`
```

If an embedded expression is an array, the elements of the array are embedded in the generated HTML. For example, to create a table from an array of values:

```js
html`<table>
  <tbody>${["zero", "one", "two"].map((name, i) => html`<tr>
    <td>${name}</td><td>${i}</td>
  </tr>`)}</tbody>
</table>`
```

<a href="#svg" name="svg">#</a> <b>svg</b>(<i>strings</i>, <i>values…</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/svg.js "Source")

Returns the SVG element represented by the specified *strings* and *values*. This function is intended to be used as a [tagged template literal](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals_and_escape_sequences). For example, to create an SVG element whose content is a circle:

```js
svg`<svg width=16 height=16>
  <circle cx=8 cy=8 r=4></circle>
</svg>`
```

If the resulting SVG fragment is not a single SVG element, is it wrapped in a G element. For example, this expression:

```js
svg`
<circle cx=8 cy=4 r=4></circle>
<circle cx=8 cy=8 r=4></circle>
`
```

Is equivalent to this expression:

```js
svg`<g>
  <circle cx=8 cy=4 r=4></circle>
  <circle cx=8 cy=8 r=4></circle>
</g>`
```

If an embedded expression is a DOM element, it is embedded in generated SVG. If an embedded expression is an array, the elements of the array are embedded in the generated SVG.

### Markdown

<a href="#md" name="md">#</a> <b>md</b>(<i>strings</i>, <i>values…</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/md.js "Source")

```js
md`Hello, *world*!`
```

If an embedded expression is a DOM element, it is embedded in generated HTML. If an embedded expression is an array, the elements of the array are embedded in the generated HTML.

### TeX

<a href="#tex" name="tex">#</a> <b>tex</b>(<i>strings</i>, <i>values…</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/tex.js "Source")

```js
tex`E = mc^2`
```

<a href="#tex_block" name="tex_block">#</a> tex.<b>block</b>(<i>strings</i>, <i>values…</i>) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/tex.js "Source")

Equivalent to [tex](#tex), but uses KaTeX’s display mode to produce a bigger block element rather than a smaller inline element.

```js
tex.block`E = mc^2`
```

### require

<a href="#require" name="require">#</a> <b>require</b>(<i>names…</i>) [<>](https://github.com/d3/d3-require/blob/master/index.js "Source")

Returns a promise of the [asynchronous module definition](https://github.com/amdjs/amdjs-api/blob/master/AMD.md) (AMD) with the specified *names*, loaded from [unpkg](https://unpkg.com/). Each module *name* can be a package (or scoped package) name optionally followed by the at sign (`@`) and a semver range. For example, to load [d3-array](https://github.com/d3/d3-array):

```js
require("d3-array").then(d3 => {
  console.log(d3.range(100));
});
```

Or, to load [d3-array](https://github.com/d3/d3-array) and [d3-color](https://github.com/d3/d3-color) and merge them into a single object:

```js
require("d3-array", "d3-color").then(d3 => {
  console.log(d3.range(360).map(h => d3.hsl(h, 1, 0.5)));
});
```

Or, to load [d3-array](https://github.com/d3/d3-array) 1.1.x:

```js
require("d3-array@1.1").then(d3 => {
  console.log(d3.range(100));
});
```

See [d3-require](https://github.com/d3/d3-require) for more information.

<a href="#resolve" name="resolve">#</a> <b>resolve</b>(<i>name</i>) [<>](https://github.com/d3/d3-require/blob/master/index.js "Source")

Returns the resolved URL to require the module with the specified *name*.

## Installing

The Observable notebook standard library is built-in to Observable, so you don’t normally need to install or instantiate it directly. If you use NPM, `npm install @observablehq/notebook-stdlib`.

<a href="#Library" name="Library">#</a> <b>Library</b>([<i>resolve</i>]) [<>](https://github.com/observablehq/notebook-stdlib/blob/master/src/index.js "Source")

Returns a new standard library object. If a *resolve* function is specified, it is a function that returns the URL of the module with the specified *name*; this is used internally by [require](#require) (and by extension, [md](#md) and [tex](#tex)). See [d3.resolve](https://github.com/d3/d3-require/blob/master/README.md#resolve) for the default implementation.

For example, to create the default standard library, and then use it to create a [canvas](#DOM_canvas):

```js
const library = new Library();
const canvas = library.DOM.canvas(960, 500);
```

The properties on the returned *library* instance correspond to the symbols (documented above) that are available in Observable notebook cells. However, note that the library fields (such as *library*.now) are *definitions*, not values: the values may be wrapped in a function which, when invoked, returns the corresponding value.
