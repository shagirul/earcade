import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import type { Plugin } from "vite";

// Include both HTML entries even when the first visit is directly to the lab.
export function offlineBuild(): Plugin {
  return {
    name: "earcade-offline",
    apply: "build",
    enforce: "post",
    generateBundle: {
      order: "post",
      handler(_, bundle) {
        const worker = readFileSync(new URL("./service-worker.js", import.meta.url), "utf8");
        const hash = createHash("sha256").update(worker);
        const paths: string[] = [];
        function include(path: string, contents: string | Uint8Array) {
          paths.push("/" + path);
          hash.update(path).update("\0").update(contents);
        }
        for (const name of Object.keys(bundle).sort()) {
          const file = bundle[name];
          include(name, file.type === "chunk" ? file.code : file.source);
        }

        const publicDir = new URL("../public/", import.meta.url);
        const manifestName = "manifest.webmanifest";
        const manifest = JSON.parse(readFileSync(new URL(manifestName, publicDir), "utf8"));
        // Desktop Chromium needs an absolute related-app ID on each Vercel alias.
        const hosts = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_URL];
        const ids = hosts.filter(Boolean).map(host => "https://" + host + "/");
        ids.push(manifest.related_applications[0].id);
        manifest.related_applications = [...new Set(ids)].slice(0, 3).map(id => ({
          platform: "webapp", url: "/manifest.webmanifest", id,
        }));
        const manifestSource = JSON.stringify(manifest, null, 2);
        this.emitFile({ type: "asset", fileName: manifestName, source: manifestSource });
        include(manifestName, manifestSource);
        for (const icon of readdirSync(new URL("icons/", publicDir)).sort()) {
          include("icons/" + icon, readFileSync(new URL("icons/" + icon, publicDir)));
        }
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: worker.replace("__REVISION__", hash.digest("hex").slice(0, 20))
            .replace("__PRECACHE_PATHS__", JSON.stringify(paths)),
        });
      },
    },
  };
}
