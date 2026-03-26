export function registerAppServiceWorker({ onUpdateAvailable, onReload } = {}) {
  if (!("serviceWorker" in navigator)) return;

  let refreshing = false;

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");

      observeServiceWorker(registration, onUpdateAvailable);
      await registration.update();

      window.addEventListener("focus", () => {
        registration?.update().catch(() => {});
      });

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        onReload?.();
      });
    } catch (error) {
      console.error("No se pudo registrar el service worker", error);
    }
  });
}

function observeServiceWorker(registration, onUpdateAvailable) {
  if (!registration) return;

  if (registration.waiting) {
    onUpdateAvailable?.(registration);
  }

  registration.addEventListener("updatefound", () => {
    const installingWorker = registration.installing;
    if (!installingWorker) return;

    installingWorker.addEventListener("statechange", () => {
      if (
        installingWorker.state === "installed" &&
        navigator.serviceWorker.controller
      ) {
        onUpdateAvailable?.(registration);
      }
    });
  });
}
