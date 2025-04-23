import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Service for interacting with the vector database API
const vectorDbService = {
  // Search for space events by keyword and date range
  async searchEvents(keyword, startDate, endDate) {
    try {
      const response = await axios.post(`${API_URL}/search`, {
        keyword,
        startDate,
        endDate
      });
      return response.data;
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  },

  // Get related keywords for a given keyword
  async getRelatedKeywords(keyword) {
    try {
      const response = await axios.post(`${API_URL}/related-keywords`, {
        keyword
      });
      return response.data.relatedKeywords;
    } catch (error) {
      console.error('Error getting related keywords:', error);
      throw error;
    }
  },
  
  // Get a discovery path for a given keyword
  async getDiscoveryPath(keyword) {
    try {
      const response = await axios.post(`${API_URL}/discovery-path`, {
        keyword
      });
      return response.data;
    } catch (error) {
      console.error('Error getting discovery path:', error);
      throw error;
    }
  }
};

export default vectorDbService; 