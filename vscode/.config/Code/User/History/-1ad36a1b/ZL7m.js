// src/services/api.js
import { fetchAuthSession } from "aws-amplify/auth";
import { get, post, del } from "aws-amplify/api";

const API_NAME = "fileStorageAPI";

export const apiService = {
  async getAuthHeaders() {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      if (!token) throw new Error("No auth token");
      return {
        Authorization: `Bearer ${token}`,
      };
    } catch (error) {
      console.error("Error getting auth headers:", error);
      throw error;
    }
  },

  async uploadFile(fileName, fileSize, fileType, tags = []) {
    const headers = await this.getAuthHeaders();
    const result = await post({
      apiName: API_NAME,
      path: "/files",
      options: {
        headers,
        body: { fileName, fileSize, fileType, tags },
      },
    }).response;
    return result.body.json();
  },

  async uploadComplete(fileId) {
    const headers = await this.getAuthHeaders();
    const result = await post({
      apiName: API_NAME,
      path: "/files/complete",
      options: {
        headers,
        body: { fileId },
      },
    }).response;
    return result.body.json();
  },

  async listFiles(userId) {
    const headers = await this.getAuthHeaders();
    const result = await get({
      apiName: API_NAME,
      path: `/files/list?userId=${userId}`,
      options: { headers },
    }).response;
    return result.body.json();
  },

  async downloadFile(fileId) {
    const headers = await this.getAuthHeaders();
    const result = await get({
      apiName: API_NAME,
      path: `/files/${fileId}`,
      options: { headers },
    }).response;
    return result.body.json();
  },

  async deleteFile(fileId) {
    const headers = await this.getAuthHeaders();
    const result = await del({
      apiName: API_NAME,
      path: `/files/${fileId}`,
      options: { headers },
    }).response;
    return result.body.json();
  },
};
