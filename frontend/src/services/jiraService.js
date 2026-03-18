import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

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
      console.log('Fetching issues with filters:', filters);
      const response = await axios.post(
        `${API_BASE_URL}/jira/search`,
        {
          config: this.getConfig(),
          filters: filters
        }
      );
      
      const data = response.data;
      console.log('Fetched issues:', data.total, 'Story Points Field:', data.storyPointsField);
      
      // Log sample issue to check story points
      if (data.issues && data.issues.length > 0) {
        const sampleIssue = data.issues[0];
        console.log('Sample issue fields:', Object.keys(sampleIssue.fields || {}));
        console.log('Story points in sample:', 
          sampleIssue.fields?.customfield_10016 || 
          sampleIssue.fields?.customfield_10024 || 
          sampleIssue.fields?.customfield_10004 || 
          sampleIssue.fields?.customfield_10008 ||
          'NOT FOUND'
        );
      }
      
      return data;
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
    return { 
      success: true, 
      project: { key: this.projectKey } 
    };
  }
}

export default JiraService;