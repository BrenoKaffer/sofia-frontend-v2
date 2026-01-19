const env = (globalThis as any)?.process?.env || {};
export const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL || "";
export const APP_NAME = "SOFIA Admin – Portal do Parceiro";
