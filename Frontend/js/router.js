const routes = new Map();
let notFoundPath = "/dashboard";
let onNavigate = () => {};

export function registerRoute(path, render) {
  routes.set(path, render);
}

export function setDefaultRoute(path) {
  notFoundPath = path;
}

export function onRouteChange(handler) {
  onNavigate = handler;
}

export function currentPath() {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || notFoundPath;
}

export function navigate(path) {
  if (currentPath() === path) {
    render();
  } else {
    window.location.hash = path;
  }
}

async function render() {
  const path = currentPath();
  const renderFn = routes.get(path);
  const container = document.getElementById("page-root");
  if (!container) return;

  if (!renderFn) {
    window.location.hash = notFoundPath;
    return;
  }

  container.innerHTML = "";
  onNavigate(path);
  await renderFn(container);
}

export function startRouter() {
  window.addEventListener("hashchange", render);
  render();
}
