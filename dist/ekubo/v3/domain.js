"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEkuboV3ExtensionEnabled = isEkuboV3ExtensionEnabled;
exports.resolveEkuboV3Domain = resolveEkuboV3Domain;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
function isEkuboV3ExtensionEnabled(extension) {
    return extension.toLowerCase() !== ZERO_ADDRESS;
}
function resolveEkuboV3Domain(args) {
    if (args.poolKind === 'concentrated') {
        return 'concentrated';
    }
    return isEkuboV3ExtensionEnabled(args.extension) ? 'stableswap-extension' : 'stableswap';
}
//# sourceMappingURL=domain.js.map