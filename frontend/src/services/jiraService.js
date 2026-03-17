import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';
const MAX_RESULTS = 100;

export class JiraService {
  constructor(config) {
    this.baseUrl = config.url?.replace(/\/+$/, '');
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.projectKey = config.projectKey;
  }

  getConfig() {
    return {
      url: this.baseUrl,
      email: this.email,
      apiToken: this.apiToken,
      projectKey: this.projectKey
    };
  }

  async testConnection() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/test-connection`,
        this.getConfig()
      );
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  async fetchIssues(filters = {}) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/search`,
        {
          config: this.getConfig(),
          filters: filters
        }
      );
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  }

  async fetchSprints() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/sprints`,
        this.getConfig()
      );
      return response.data;
    } catch (error) {
      return { 
        success: true, 
        sprints: [],
        error: error.response?.data?.error || error.message 
      };
    }
  }

  async fetchProject() {
    // This can be added later if needed
    return { 
      success: true, 
      project: { key: this.projectKey } 
    };
  }
}

export default JiraService;