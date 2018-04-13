import dispose from "./dispose";

export default function worker(source) {
  const url = URL.createObjectURL(new Blob([source], {type: "text/javascript"}));
  const worker = new Worker(url);
  return dispose(worker, () => {
    worker.terminate();
    URL.revokeObjectURL(url);
  });
}
