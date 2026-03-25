import client from './client';

export const obtenerConfigMarca = async () => {
  const res = await client.get('/config-marca');
  return res.data;
};
