import finalize from "./finalize";

export default function worker(source) {
  const url = URL.createObjectURL(new Blob([source], {type: "text/javascript"}));
  const worker = new Worker(url);
  return finalize(worker, () => {
    worker.terminate();
    URL.revokeObjectURL(url);
  });
}
