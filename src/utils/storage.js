// Determina el prefijo de empresa desde el path o el hostname
export const getEmpresaSlug = () => {
  const path = window.location.pathname;
  const match = path.match(/^\/([a-z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return window.location.hostname.includes('mundial-2.') ? 'cltiene' : 'divergencyai';
};

const buildStorageKey = (key) => `${getEmpresaSlug()}_${key}`;

export const sGet = (key) => {
  const prefixedKey = buildStorageKey(key);
  const legacyValue = localStorage.getItem(key);
  return localStorage.getItem(prefixedKey) ?? legacyValue;
};

export const sSet = (key, value) => {
  const prefixedKey = buildStorageKey(key);
  localStorage.setItem(prefixedKey, value);
  localStorage.setItem(key, value);
};

export const sRemove = (key) => {
  const prefixedKey = buildStorageKey(key);
  localStorage.removeItem(prefixedKey);
  localStorage.removeItem(key);
};
