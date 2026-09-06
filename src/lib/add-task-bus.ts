const EVENT = "vin:add-task";

export function emitAddTask() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function onAddTask(handler: () => void) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
