async function remote_fetch(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Unable to load file");
  return response;
}

export default function FileAttachment(resolve) {
  return class FileAttachment {
    constructor(name) {
      Object.defineProperties(this, {
        name: {value: name, enumerable: true}
      });
    }
    async url() {
      return resolve(this.name);
    }
    async blob() {
      return (await remote_fetch(await this.url())).blob();
    }
    async arrayBuffer() {
      return (await remote_fetch(await this.url())).arrayBuffer();
    }
    async text() {
      return (await remote_fetch(await this.url())).text();
    }
    async json() {
      return (await remote_fetch(await this.url())).json();
    }
    async image() {
      return new Promise((resolve, reject) => {
        const img = document.createElement("img");
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Unable to load image"));
        this.url().then(url => {
          img.src = url;
        });
      });
    }
  };
}
