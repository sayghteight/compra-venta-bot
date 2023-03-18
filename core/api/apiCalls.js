const axios = require('axios');

class Api {

    constructor(baseURL) {
        this.baseURL = baseURL || 'https://api.wow-cms.com/api/';
    }

    async callAPI(endpoint, options) {
        try {
            const response = await axios({
                url: `${this.baseURL}/${endpoint}`,
                method: options.method || 'GET',
                data: options.data || {},
            });
            return response.data.data;
        } catch (error) {
            if (error.response) {
                throw new Error(`${error.response.status}: ${error.response.statusText}`);
            } else {
                throw new Error(error.message);
            }
        }
    }

    async getData(endpoint) {
        return await this.callAPI(endpoint, { method: 'GET' });
    }

    async submitData(endpoint, data) {
        return await this.callAPI(endpoint, { method: 'POST', data: data });
    }

    async updateData(endpoint, data) {
        return await this.callAPI(endpoint, { method: 'PUT', data: data });
    }

    async deleteData(endpoint) {
        return await this.callAPI(endpoint, { method: 'DELETE' });
    }
}

module.exports = Api;