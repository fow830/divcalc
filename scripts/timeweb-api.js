/**
 * Timeweb Cloud API Client
 * Документация: https://timeweb.cloud/api-docs
 */

const API_BASE_URL = 'https://api.timeweb.cloud/api/v1';

class TimewebAPI {
  constructor(token) {
    this.token = token;
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`API Error: ${error.message || response.statusText} (${response.status})`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Получить список серверов
  async getServers() {
    return this.request('/servers');
  }

  // Получить информацию о сервере
  async getServer(serverId) {
    return this.request(`/servers/${serverId}`);
  }

  // Получить список баз данных
  async getDatabases() {
    return this.request('/databases');
  }

  // Получить информацию об аккаунте
  async getAccount() {
    try {
      return await this.request('/account');
    } catch (error) {
      // Если эндпоинт не найден, пробуем альтернативные
      try {
        return await this.request('/user');
      } catch (e) {
        throw error;
      }
    }
  }

  // Получить баланс
  async getBalance() {
    try {
      return await this.request('/account/balance');
    } catch (error) {
      // Если эндпоинт не найден, возвращаем пустой объект
      return { balance: 'N/A' };
    }
  }
}

module.exports = { TimewebAPI };

