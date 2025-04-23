import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ChromaClient } from 'chromadb';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Chroma client
const chromaClient = new ChromaClient({
  path: 'http://localhost:8000', // Default Chroma server URL
});

// Collection name for space-related data
const COLLECTION_NAME = 'space_events';

// Function to generate embeddings using OpenAI
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Initialize the database and load data
async function initializeDatabase() {
  try {
    // Check if collection exists, if not create it
    const collections = await chromaClient.listCollections();
    let collection;
    
    if (!collections.includes(COLLECTION_NAME)) {
      console.log(`Creating new collection: ${COLLECTION_NAME}`);
      collection = await chromaClient.createCollection({
        name: COLLECTION_NAME,
        metadata: { description: "Space-related events and data" }
      });
      
      // Load and process the dataset
      const datasetPath = path.join(__dirname, '../dataset/dataset.csv');
      
      if (fs.existsSync(datasetPath)) {
        const csvData = fs.readFileSync(datasetPath, 'utf8');
        
        Papa.parse(csvData, {
          header: true,
          complete: async (results) => {
            console.log(`Loaded ${results.data.length} records from CSV`);
            
            // Process in batches to avoid overwhelming the API
            const batchSize = 10;
            for (let i = 0; i < results.data.length; i += batchSize) {
              const batch = results.data.slice(i, i + batchSize);
              
              // Skip entries without required fields
              const validBatch = batch.filter(item => 
                item.title && item.summary && item.lat && item.long && item.date
              );
              
              if (validBatch.length === 0) continue;
              
              // Generate embeddings for each item
              const ids = [];
              const embeddings = [];
              const metadatas = [];
              const documents = [];
              
              for (const item of validBatch) {
                // Create a combined text for embedding
                const combinedText = `${item.title} ${item.summary}`;
                
                // Generate embedding
                const embedding = await generateEmbedding(combinedText);
                
                // Prepare data for Chroma
                ids.push(item.id || `item-${i}-${validBatch.indexOf(item)}`);
                embeddings.push(embedding);
                metadatas.push({
                  title: item.title,
                  summary: item.summary,
                  url: item.url || '',
                  lat: parseFloat(item.lat),
                  long: parseFloat(item.long),
                  date: item.date
                });
                documents.push(combinedText);
              }
              
              // Add to collection
              await collection.add({
                ids,
                embeddings,
                metadatas,
                documents
              });
              
              console.log(`Added batch ${i/batchSize + 1} to collection`);
            }
            
            console.log('Database initialization complete');
          },
          error: (error) => {
            console.error('Error parsing CSV:', error);
          }
        });
      } else {
        console.error('Dataset file not found:', datasetPath);
      }
    } else {
      console.log(`Collection ${COLLECTION_NAME} already exists`);
      collection = await chromaClient.getCollection({
        name: COLLECTION_NAME
      });
    }
    
    return collection;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// API endpoint to search for space events by keyword
app.post('/api/search', async (req, res) => {
  try {
    const { keyword, startDate, endDate } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    
    // Generate embedding for the keyword
    const embedding = await generateEmbedding(keyword);
    
    // Get the collection
    const collection = await chromaClient.getCollection({
      name: COLLECTION_NAME
    });
    
    // Query the collection
    const queryResults = await collection.query({
      queryEmbeddings: [embedding],
      nResults: 50
    });
    
    // Process results
    let results = [];
    if (queryResults.metadatas && queryResults.metadatas[0]) {
      results = queryResults.metadatas[0].map((metadata, index) => ({
        ...metadata,
        score: queryResults.distances[0][index]
      }));
      
      // Filter by date if provided
      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        results = results.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= startDateObj && itemDate <= endDateObj;
        });
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'An error occurred while searching' });
  }
});

// API endpoint to get related keywords for a given keyword
app.post('/api/related-keywords', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    
    // Use OpenAI to generate related keywords
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates related space exploration keywords."
        },
        {
          role: "user",
          content: `Generate 5 related keywords for space exploration topic: "${keyword}". Return only the keywords as a JSON array.`
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    const relatedKeywords = JSON.parse(content).keywords || [];
    
    res.json({ relatedKeywords });
  } catch (error) {
    console.error('Error generating related keywords:', error);
    res.status(500).json({ error: 'An error occurred while generating related keywords' });
  }
});

// API endpoint to get a discovery path for a given keyword
app.post('/api/discovery-path', async (req, res) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    
    // Generate embedding for the keyword
    const embedding = await generateEmbedding(keyword);
    
    // Get the collection
    const collection = await chromaClient.getCollection({
      name: COLLECTION_NAME
    });
    
    // Query the collection for semantically similar items
    const queryResults = await collection.query({
      queryEmbeddings: [embedding],
      nResults: 10
    });
    
    // Process results
    let results = [];
    if (queryResults.metadatas && queryResults.metadatas[0]) {
      results = queryResults.metadatas[0].map((metadata, index) => ({
        ...metadata,
        score: queryResults.distances[0][index]
      }));
      
      // Sort by relevance and date
      results.sort((a, b) => {
        // First by score (if available)
        if (a.score !== undefined && b.score !== undefined) {
          return a.score - b.score;
        }
        // Then by date (newest first)
        return new Date(b.date) - new Date(a.date);
      });
    }
    
    // If we have fewer than 5 results, use OpenAI to generate related keywords
    // and search for those to expand our discovery path
    if (results.length < 5) {
      try {
        // Get related keywords
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that generates related space exploration keywords."
            },
            {
              role: "user",
              content: `Generate 3 related keywords for space exploration topic: "${keyword}". Return only the keywords as a JSON array.`
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
          response_format: { type: "json_object" }
        });
        
        // Parse the response
        const content = response.choices[0].message.content;
        const relatedKeywords = JSON.parse(content).keywords || [];
        
        // Search for each related keyword
        for (const relatedKeyword of relatedKeywords) {
          if (results.length >= 5) break;
          
          const relatedEmbedding = await generateEmbedding(relatedKeyword);
          const relatedResults = await collection.query({
            queryEmbeddings: [relatedEmbedding],
            nResults: 3
          });
          
          if (relatedResults.metadatas && relatedResults.metadatas[0]) {
            const newResults = relatedResults.metadatas[0].map((metadata, index) => ({
              ...metadata,
              score: relatedResults.distances[0][index]
            }));
            
            // Add new results that aren't already in our results array
            for (const newResult of newResults) {
              if (!results.some(r => r.title === newResult.title)) {
                results.push(newResult);
                if (results.length >= 5) break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error expanding discovery path:', error);
        // Continue with what we have if there's an error
      }
    }
    
    // Take top 5 results or less if fewer are available
    const discoveryPath = results.slice(0, Math.min(5, results.length));
    
    res.json(discoveryPath);
  } catch (error) {
    console.error('Error creating discovery path:', error);
    res.status(500).json({ error: 'An error occurred while creating discovery path' });
  }
});

// Start the server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  try {
    // Initialize the database on server start
    await initializeDatabase();
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}); 