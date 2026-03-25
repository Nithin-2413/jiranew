import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL + '/api';

export class JiraService {
  constructor(config) {
    this.baseUrl = config.url?.replace(/\/+$/, '');
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.projectKey = config.projectKey;
    this.storyPointsFieldId = config.storyPointsFieldId || null;
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

  async fetchFields() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/fields`,
        { config: this.getConfig() }
      );
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message,
        storyPointsFields: []
      };
    }
  }

  async fetchUsers() {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/jira/users`,
        { config: this.getConfig() }
      );
      return response.data;
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message,
        users: []
      };
    }
  }

  async fetchIssues(filters = {}) {
    try {
      console.log('Fetching issues with filters:', filters);
      console.log('Story Points Field ID:', this.storyPointsFieldId);
      
      const response = await axios.post(
        `${API_BASE_URL}/jira/search`,
        {
          config: this.getConfig(),
          filters: filters,
          storyPointsFieldId: this.storyPointsFieldId,
          excludeSubtasks: true,  // Exclude Sub-tasks by default to match Jira
          dateField: filters.dateField || 'created'  // Support different date fields
        }
      );
      
      const data = response.data;
      console.log('=== API Response ===');
      console.log('Total Issues:', data.total);
      console.log('Issues by Type:', data.issueTypeCounts);
      console.log('JQL Used:', data.jqlUsed);
      console.log('Story Points Field:', data.storyPointsField);
      console.log('Issues with points:', data.issuesWithPoints, 'Total points:', data.totalStoryPoints);
      console.log('===================');
      
      // Log sample issue to check story points
      if (data.issues && data.issues.length > 0) {
        const sampleIssue = data.issues[0];
        console.log('Sample issue story points:', sampleIssue.fields?.storyPoints);
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching issues:', error);
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
