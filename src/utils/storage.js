// Determina el prefijo de empresa desde el path o el hostname
export const getEmpresaSlug = () => {
  const path = window.location.pathname;
  const match = path.match(/^\/([a-z0-9_-]+)/);
  if (match && match[1]) return match[1];
  return window.location.hostname.includes('mundial-2.') ? 'cltiene' : 'divergencyai';
};

export const sGet = (key) => localStorage.getItem(`${getEmpresaSlug()}_${key}`);
export const sSet = (key, value) => localStorage.setItem(`${getEmpresaSlug()}_${key}`, value);
export const sRemove = (key) => localStorage.removeItem(`${getEmpresaSlug()}_${key}`);
