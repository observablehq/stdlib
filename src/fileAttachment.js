import {require as requireDefault} from "d3-require";

async function remote_fetch(file) {
  const response = await fetch(await file.url());
  if (!response.ok) throw new Error(`Unable to load file: ${file.name}`);
  return response;
}

async function dsv(file, delimiter, {array = false, typed = false} = {}) {
  const [text, d3] = await Promise.all([file.text(), requireDefault("d3-dsv@2.0.0/dist/d3-dsv.min.js")]);
  return (delimiter === "\t"
      ? (array ? d3.tsvParseRows : d3.tsvParse)
      : (array ? d3.csvParseRows : d3.csvParse))(text, typed && d3.autoType);
}

class FileAttachment {
  constructor(url, name) {
    Object.defineProperties(this, {
      _url: {value: url},
      name: {value: name, enumerable: true}
    });
  }
  async url() {
    return (await this._url) + "";
  }
  async blob() {
    return (await remote_fetch(this)).blob();
  }
  async arrayBuffer() {
    return (await remote_fetch(this)).arrayBuffer();
  }
  async text() {
    return (await remote_fetch(this)).text();
  }
  async json() {
    return (await remote_fetch(this)).json();
  }
  async stream() {
    return (await remote_fetch(this)).body;
  }
  async csv(options) {
    return dsv(this, ",", options);
  }
  async tsv(options) {
    return dsv(this, "\t", options);
  }
  async image() {
    const url = await this.url();
    return new Promise((resolve, reject) => {
      const i = new Image;
      if (new URL(url, document.baseURI).origin !== new URL(location).origin) {
        i.crossOrigin = "anonymous";
      }
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error(`Unable to load file: ${this.name}`));
      i.src = url;
    });
  }
}

export function NoFileAttachments(name) {
  throw new Error(`File not found: ${name}`);
}

export default function FileAttachments(resolve) {
  return Object.assign(
    name => {
      const url = resolve(name += ""); // Returns a Promise, string, or null.
      if (url == null) throw new Error(`File not found: ${name}`);
      return new FileAttachment(url, name);
    },
    {prototype: FileAttachment.prototype} // instanceof
  );
}
