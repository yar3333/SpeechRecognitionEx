"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetPath = void 0;
// nextjs@14 bundler may attempt to execute this during SSR and crash
const isWeb = typeof window !== "undefined" && typeof window.document !== "undefined";
const currentScript = isWeb
    ? window.document.currentScript
    : null;
let basePath = "/";
if (currentScript) {
    basePath = currentScript.src
        .replace(/#.*$/, "")
        .replace(/\?.*$/, "")
        .replace(/\/[^\/]+$/, "/");
}
const assetPath = (file) => {
    return basePath + file;
};
exports.assetPath = assetPath;
//# sourceMappingURL=asset-path.js.map