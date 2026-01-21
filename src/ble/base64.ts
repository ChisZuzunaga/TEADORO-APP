// En RN moderno puedes usar Buffer (si no, instala "buffer"):
import { Buffer } from "buffer";

export const toBase64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
export const fromBase64 = (b64: string) => Buffer.from(b64, "base64").toString("utf8");
