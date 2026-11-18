if (import.meta.env.PROD && window.isSecureContext && "serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(error => {
    console.warn("Earcade offline setup could not finish.", error);
  });
}
