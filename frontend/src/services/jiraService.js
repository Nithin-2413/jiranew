import axios from 'axios';

const MAX_RESULTS = 100;

export class JiraService {
  constructor(config) {
    this.baseUrl = config.url?.replace(/\/+$/, '');
    this.email = config.email;
    this.apiToken = config.apiToken;
    this.projectKey = config.projectKey;
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
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/myself`,
        { headers: this.getAuthHeaders() }
      );
      return { success: true, data: response.data };
    } catch (error) {
      let errorMessage = error.message;
      
      if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        errorMessage = 'CORS Error: Direct browser access to JIRA API is blocked. Consider using a CORS proxy or backend service.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please check your email and API token.';
      } else if (error.response?.data?.errorMessages?.[0]) {
        errorMessage = error.response.data.errorMessages[0];
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  async fetchIssues(filters = {}) {
    try {
      const jql = this.buildJQL(filters);
      let startAt = 0;
      let allIssues = [];
      let total = 0;

      do {
        const response = await axios.post(
          `${this.baseUrl}/rest/api/3/search`,
          {
            jql,
            startAt,
            maxResults: MAX_RESULTS,
            fields: [
              'summary',
              'status',
              'issuetype',
              'priority',
              'assignee',
              'created',
              'resolutiondate',
              'labels',
              'subtasks',
              'parent',
              'customfield_10016', // Story points (common field ID)
              'sprint'
            ]
          },
          { headers: this.getAuthHeaders() }
        );

        allIssues = [...allIssues, ...response.data.issues];
        total = response.data.total;
        startAt += MAX_RESULTS;
      } while (allIssues.length < total && startAt < 1000); // Safety limit

      return { success: true, issues: allIssues, total };
    } catch (error) {
      let errorMessage = error.message;
      
      if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        errorMessage = 'CORS Error: Unable to fetch data from JIRA. Browser-based JIRA API access is restricted. Consider using mock data or a backend proxy.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please verify your JIRA credentials.';
      } else if (error.response?.data?.errorMessages?.[0]) {
        errorMessage = error.response.data.errorMessages[0];
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  async fetchSprints() {
    try {
      // First, get all boards for the project
      const boardsResponse = await axios.get(
        `${this.baseUrl}/rest/agile/1.0/board?projectKeyOrId=${this.projectKey}`,
        { headers: this.getAuthHeaders() }
      );

      if (boardsResponse.data.values.length === 0) {
        return { success: true, sprints: [] };
      }

      const boardId = boardsResponse.data.values[0].id;

      // Fetch sprints for the board
      const sprintsResponse = await axios.get(
        `${this.baseUrl}/rest/agile/1.0/board/${boardId}/sprint?maxResults=50`,
        { headers: this.getAuthHeaders() }
      );

      return { success: true, sprints: sprintsResponse.data.values };
    } catch (error) {
      return { 
        success: true, 
        sprints: [],
        error: error.response?.data?.message || error.message 
      };
    }
  }

  async fetchProject() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/project/${this.projectKey}`,
        { headers: this.getAuthHeaders() }
      );
      return { success: true, project: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.errorMessages?.[0] || error.message 
      };
    }
  }

  buildJQL(filters) {
    const conditions = [`project = ${this.projectKey}`];

    if (filters.startDate) {
      conditions.push(`created >= "${filters.startDate}"`);
    }

    if (filters.endDate) {
      conditions.push(`created <= "${filters.endDate}"`);
    }

    if (filters.status && filters.status.length > 0) {
      const statusList = filters.status.map(s => `"${s}"`).join(',');
      conditions.push(`status in (${statusList})`);
    }

    if (filters.issueType && filters.issueType.length > 0) {
      const typeList = filters.issueType.map(t => `"${t}"`).join(',');
      conditions.push(`issuetype in (${typeList})`);
    }

    if (filters.labels && filters.labels.length > 0) {
      const labelList = filters.labels.map(l => `"${l}"`).join(',');
      conditions.push(`labels in (${labelList})`);
    }

    if (filters.sprint) {
      conditions.push(`sprint = "${filters.sprint}"`);
    }

    return conditions.join(' AND ') + ' ORDER BY created DESC';
  }
}

export default JiraService;