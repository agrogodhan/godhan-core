import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';


function createApiClient(baseURL, token = null) {
  const client = axios.create({ baseURL, timeout: 10000 });
  client.interceptors.request.use(config => {
    config.headers = config.headers || {};
    config.headers['x-trace-id'] = config.headers['x-trace-id'] || uuidv4();
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
    return config;
  });
  return client;
}

export default createApiClient;