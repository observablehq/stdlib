import {require as requireDefault} from "d3-require";
import sqlite, {SQLiteDatabaseClient} from "./sqlite.js";
import jszip from "./zip.js";

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

class AbstractFile {
  constructor(name) {
    Object.defineProperty(this, "name", {value: name, enumerable: true});
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
  async sqlite() {
    const [SQL, buffer] = await Promise.all([sqlite(requireDefault), this.arrayBuffer()]);
    const db = new SQL.Database(new Uint8Array(buffer));
    return new SQLiteDatabaseClient(db);
  }
  async zip() {
    const [JSZip, buffer] = await Promise.all([jszip(requireDefault), this.arrayBuffer()]);
    return new ZipArchive(await JSZip.loadAsync(buffer));
  }
}

class FileAttachment extends AbstractFile {
  constructor(url, name) {
    super(name);
    Object.defineProperty(this, "_url", {value: url});
  }
  async url() {
    return (await this._url) + "";
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

export class ZipArchive {
  constructor(archive) {
    Object.defineProperty(this, "_", {value: archive});
    this.filenames = Object.keys(archive.files).filter(name => !archive.files[name].dir);
  }
  file(path) {
    const object = this._.file(path += "");
    if (!object || object.dir) throw new Error(`file not found: ${path}`);
    return new ZipArchiveEntry(object);
  }
}

class ZipArchiveEntry extends AbstractFile {
  constructor(object) {
    super(object.name);
    Object.defineProperty(this, "_", {value: object});
    Object.defineProperty(this, "_url", {writable: true});
  }
  async url() {
    return this._url || (this._url = this.blob().then(URL.createObjectURL));
  }
  async blob() {
    return this._.async("blob");
  }
  async arrayBuffer() {
    return this._.async("arraybuffer");
  }
  async text() {
    return this._.async("text");
  }
  async json() {
    return JSON.parse(await this.text());
  }
}
