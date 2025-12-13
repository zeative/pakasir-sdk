export const sanitizeUrlSafe = (s: string) => String(s).replace(/[^\w\-_.~0-9]/g, '');
