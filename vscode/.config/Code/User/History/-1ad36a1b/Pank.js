// src/services/api.js
import { Auth, API } from "aws-amplify";

const API_NAME = "fileStorageAPI";

export const apiService = {
  async getAuthHeaders() {
    try {
      const session = await Auth.currentSession();
      const token = session.getIdToken().getJwtToken();
      return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    } catch (error) {
      console.error("Error getting auth headers:", error);
      throw error;
    }
  },

  async uploadFile(fileName, fileSize, fileType, tags = []) {
    const headers = await this.getAuthHeaders();
    const response = await API.post(API_NAME, "/files", {
      headers,
      body: { fileName, fileSize, fileType, tags },
    });
    return response;
  },

  async uploadComplete(fileId) {
    const headers = await this.getAuthHeaders();
    const response = await API.post(API_NAME, "/files/complete", {
      headers,
      body: { fileId },
    });
    return response;
  },

  async listFiles() {
    const headers = await this.getAuthHeaders();
    const user = await Auth.currentAuthenticatedUser();
    const userId = user.attributes.sub;
    const response = await API.get(API_NAME, `/files/list?userId=${userId}`, {
      headers,
    });
    return response;
  },

  async downloadFile(fileId) {
    const headers = await this.getAuthHeaders();
    const response = await API.get(API_NAME, `/files/${fileId}`, { headers });
    return response;
  },

  async deleteFile(fileId) {
    const headers = await this.getAuthHeaders();
    const response = await API.del(API_NAME, `/files/${fileId}`, { headers });
    return response;
  },

  async createShareLink(fileId, expiresInSeconds = 3600) {
    const headers = await this.getAuthHeaders();
    const response = await API.post(API_NAME, "/share/create", {
      headers,
      body: { fileId, expiresInSeconds },
    });
    return response;
  },
};
