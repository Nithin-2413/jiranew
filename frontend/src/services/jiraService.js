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

  getAuthHeaders() {
    const auth = btoa(`${this.email}:${this.apiToken}`);
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
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
      // First, get all fields to find story points field dynamically
      let storyPointsFieldId = 'customfield_10016'; // Default common ID
      
      try {
        const fieldsResponse = await axios.get(
          `${this.baseUrl}/rest/api/3/field`,
          { headers: this.getAuthHeaders() }
        );
        
        // Search for story points field
        const storyPointsField = fieldsResponse.data.find(field => 
          field.name && (
            field.name.toLowerCase().includes('story point') ||
            field.name.toLowerCase().includes('story points') ||
            field.id === 'customfield_10016' ||
            field.id === 'customfield_10024' ||
            field.id === 'customfield_10004'
          )
        );
        
        if (storyPointsField) {
          storyPointsFieldId = storyPointsField.id;
          console.log('Found story points field:', storyPointsFieldId, storyPointsField.name);
        }
      } catch (error) {
        console.warn('Could not fetch fields, using default story points field ID');
      }

      const response = await axios.post(
        `${API_BASE_URL}/jira/search`,
        {
          config: this.getConfig(),
          filters: filters,
          storyPointsFieldId: storyPointsFieldId
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