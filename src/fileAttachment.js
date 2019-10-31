async function remote_fetch(file) {
  const response = await fetch(await file.url());
  if (!response.ok) throw new Error(`Unable to load file: ${file.name}`);
  return response;
}

class FileAttachment {
  constructor(url, name) {
    Object.defineProperties(this, {
      _url: {value: url},
      name: {value: name, enumerable: true}
    });
  }
  async url() {
    return this._url;
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
  return name => {
    const url = resolve(name += ""); // Returns a Promise, string, or null.
    if (url == null) throw new Error(`File not found: ${name}`);
    return new FileAttachment(url, name);
  };
}
