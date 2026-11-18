import { useEffect, useRef, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { installInstructions, installState, requestInstall, subscribeInstall } from "./install";

export function InstallButton() {
  const state = useSyncExternalStore(subscribeInstall, installState);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (state === "installed") dialog.current?.close();
  }, [state]);

  async function download() {
    if (installState() === "manual") {
      dialog.current?.showModal();
      return;
    }
    dialog.current?.close();
    if (await requestInstall() === "manual") dialog.current?.showModal();
  }

  return (
    <>
      {state !== "installed" && (
        <button type="button" className="install-button" onClick={download} disabled={state === "prompting"} aria-label="Download Earcade">
          <Download size={16} aria-hidden="true" />
          Download
        </button>
      )}
      <dialog className="home-dialog install-dialog" ref={dialog} aria-labelledby="install-title">
        <img src="/icons/earcade.svg" width="48" height="48" alt="" />
        <h2 className="display" id="install-title">Install Earcade</h2>
        <p>{state === "available" ? "Add Earcade to this device to launch it directly." : installInstructions()}</p>
        {state === "available" && <button type="button" className="primary" onClick={download}>Install</button>}
        <button type="button" className="secondary" onClick={() => dialog.current?.close()}>Close</button>
      </dialog>
    </>
  );
}
