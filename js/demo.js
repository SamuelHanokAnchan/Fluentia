/**
 * Fluentia - Software Planning Tool
 * AI Service Module - Handles AI-based recommendations and code generation
 */

// Store for all code templates and recommendations
const AI_KNOWLEDGE_BASE = {
    // Tool recommendation database - what tools work well together
    recommendations: {
        'Python': [
            { id: 2, name: 'NumPy', reason: 'Essential for numerical computing' },
            { id: 3, name: 'Pandas', reason: 'Powerful data manipulation library' },
            { id: 4, name: 'Matplotlib', reason: 'Standard visualization library' },
            { id: 5, name: 'TensorFlow', reason: 'Leading machine learning framework' }
        ],
        'DataBase': [
            { id: 9, name: 'MongoDB', reason: 'Flexible NoSQL database' },
            { id: 19, name: 'Flask', reason: 'Lightweight framework for API development' }
        ],
        'API': [
            { id: 1, name: 'Yahoo Finance', reason: 'Real-time market data' },
            { id: 19, name: 'Flask', reason: 'Framework for API development' }
        ],
        'Kafka': [
            { id: 6, name: 'Producer', reason: 'Required for data production' },
            { id: 7, name: 'Broker', reason: 'Core message broker component' },
            { id: 8, name: 'Consumer', reason: 'Required for data consumption' }
        ],
        'Front End': [
            { id: 13, name: 'HTML, CSS, JS', reason: 'Core web technologies' },
            { id: 14, name: 'React', reason: 'Popular component-based UI library' },
            { id: 15, name: 'Vue.js', reason: 'Progressive JavaScript framework' }
        ],
        'Visualization': [
            { id: 21, name: 'Grafana', reason: 'Interactive visualization tool' },
            { id: 4, name: 'Matplotlib', reason: 'Python visualization library' }
        ],
        'Web Application': [
            { id: 19, name: 'Flask', reason: 'Lightweight Python web framework' },
            { id: 13, name: 'HTML, CSS, JS', reason: 'Core web technologies' }
        ],
        'Machine Learning Model': [
            { id: 10, name: 'Random Forest', reason: 'Versatile ensemble learning method' },
            { id: 11, name: 'ARIMA', reason: 'Time series forecasting model' },
            { id: 12, name: 'Logistic Regression', reason: 'Classification algorithm' }
        ]
    },
    
    // More templates can be added here for other tool combinations
    
    // Special case connections for the Yahoo Finance to Kafka pipeline
    'Yahoo Finance_Kafka': {
        code: `
# Integration of Yahoo Finance data with Kafka
import yfinance as yf
import pandas as pd
import json
from kafka import KafkaProducer
import time
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class YahooFinanceKafkaConnector:
    """Connector for streaming Yahoo Finance data to Kafka"""
    
    def __init__(self, bootstrap_servers=['localhost:9092'], topic='stock_data'):
        """
        Initialize the connector
        
        Parameters:
        bootstrap_servers (list): Kafka bootstrap servers
        topic (str): Kafka topic name
        """
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.producer = None
        
    def connect(self):
        """Create and configure the Kafka producer"""
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.bootstrap_servers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8'),
                acks='all'
            )
            logger.info(f"Connected to Kafka broker(s): {self.bootstrap_servers}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            return False
            
    def get_stock_data(self, ticker_symbol, period="1d", interval="1m"):
        """
        Get stock data from Yahoo Finance
        
        Parameters:
        ticker_symbol (str): Stock ticker symbol
        period (str): Time period to fetch data for (1d, 5d, 1mo, 3mo, etc.)
        interval (str): Data interval (1m, 2m, 5m, 15m, 30m, 1h, 1d, etc.)
        
        Returns:
        pandas.DataFrame: Stock data
        """
        try:
            ticker = yf.Ticker(ticker_symbol)
            data = ticker.history(period=period, interval=interval)
            
            # Reset index to make Date a column
            data = data.reset_index()
            
            # Convert datetime to string
            data['Date'] = data['Date'].astype(str)
            
            logger.info(f"Retrieved {len(data)} records for {ticker_symbol}")
            return data
        except Exception as e:
            logger.error(f"Error retrieving stock data: {e}")
            return pd.DataFrame()
    
    def send_to_kafka(self, data, ticker_symbol):
        """
        Send data to Kafka topic
        
        Parameters:
        data (pandas.DataFrame): Data to send
        ticker_symbol (str): Stock ticker symbol
        
        Returns:
        int: Number of records sent
        """
        if self.producer is None:
            logger.error("Kafka producer not initialized. Call connect() first.")
            return 0
            
        if data.empty:
            logger.warning("No data to send to Kafka.")
            return 0
            
        records_sent = 0
        
        for _, row in data.iterrows():
            # Convert row to dictionary
            record = row.to_dict()
            
            # Add metadata
            record['ticker'] = ticker_symbol
            record['timestamp'] = datetime.now().timestamp()
            
            try:
                future = self.producer.send(self.topic, record)
                future.get(timeout=5)  # Wait for confirmation
                records_sent += 1
            except Exception as e:
                logger.error(f"Error sending record to Kafka: {e}")
                
        logger.info(f"Sent {records_sent} records to Kafka topic: {self.topic}")
        return records_sent
        
    def stream_stock_data(self, ticker_symbols, period="1d", interval="1m", frequency=60):
        """
        Stream stock data continuously to Kafka
        
        Parameters:
        ticker_symbols (list): List of stock ticker symbols
        period (str): Time period to fetch data for
        interval (str): Data interval
        frequency (int): Seconds between updates
        """
        if not self.connect():
            logger.error("Failed to connect to Kafka. Aborting stream.")
            return
            
        logger.info(f"Starting stock data stream for {ticker_symbols}")
        
        try:
            while True:
                for ticker in ticker_symbols:
                    data = self.get_stock_data(ticker, period, interval)
                    self.send_to_kafka(data, ticker)
                    
                logger.info(f"Waiting {frequency} seconds until next update...")
                time.sleep(frequency)
        except KeyboardInterrupt:
            logger.info("Stream interrupted.")
        finally:
            if self.producer is not None:
                self.producer.flush()
                self.producer.close()
                logger.info("Kafka producer closed.")
    
    def close(self):
        """Close the Kafka producer connection"""
        if self.producer is not None:
            self.producer.flush()
            self.producer.close()
            logger.info("Kafka producer closed.")

# Example usage
if __name__ == "__main__":
    # Define settings
    connector = YahooFinanceKafkaConnector(
        bootstrap_servers=['localhost:9092'],
        topic='stock_data'
    )
    
    # Stream stock data for multiple symbols
    ticker_symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN']
    
    # Non-blocking single-shot data retrieval
    if connector.connect():
        for ticker in ticker_symbols:
            data = connector.get_stock_data(ticker, period="1d", interval="15m")
            connector.send_to_kafka(data, ticker)
        
        connector.close()
    
    # For continuous streaming (uncomment to use)
    # connector.stream_stock_data(
    #     ticker_symbols=ticker_symbols,
    #     period="1d",
    #     interval="5m",
    #     frequency=300  # Update every 5 minutes
    # )
`,
        explanation: "This code implements a connector for streaming stock data from Yahoo Finance to Kafka. It includes a YahooFinanceKafkaConnector class with methods for retrieving data, sending it to Kafka, and streaming updates at specified intervals."
    }
};

/**
 * Get AI tool recommendations based on a selected tool
 * @param {Object} toolData - Data about the selected tool
 * @return {Array} Array of tool recommendations with reasons
 */
function getToolRecommendations(toolData) {
    if (!toolData || !toolData.name) return [];
    
    // Look up recommendations in our knowledge base
    const toolName = toolData.name;
    
    // First try direct match by tool name
    if (AI_KNOWLEDGE_BASE.recommendations[toolName]) {
        return AI_KNOWLEDGE_BASE.recommendations[toolName];
    }
    
    // Then try by category if no direct match
    if (toolData.category && AI_KNOWLEDGE_BASE.recommendations[toolData.category]) {
        return AI_KNOWLEDGE_BASE.recommendations[toolData.category];
    }
    
    // No recommendations found
    return [];
}

/**
 * Generate boilerplate code for connecting two tools
 * @param {Object} sourceToolData - Data about the source tool
 * @param {Object} targetToolData - Data about the target tool
 * @return {Object|null} Object with code and explanation, or null if no template exists
 */
function generateConnectionCode(sourceToolData, targetToolData) {
    if (!sourceToolData || !targetToolData) return null;
    
    // Create connection key in format "SourceTool_TargetTool"
    const connectionKey = `${sourceToolData.name}_${targetToolData.name}`;
    
    // Look for exact match first
    if (AI_KNOWLEDGE_BASE.connectionTemplates[connectionKey]) {
        return AI_KNOWLEDGE_BASE.connectionTemplates[connectionKey];
    }
    
    // Try checking for category-based templates
    const categoryKey = `${sourceToolData.category}_${targetToolData.category}`;
    if (AI_KNOWLEDGE_BASE.connectionTemplates[categoryKey]) {
        return AI_KNOWLEDGE_BASE.connectionTemplates[categoryKey];
    }
    
    // If still not found, check if there's a template for each tool individually
    const sourceKey = `${sourceToolData.name}_${targetToolData.category}`;
    if (AI_KNOWLEDGE_BASE.connectionTemplates[sourceKey]) {
        return AI_KNOWLEDGE_BASE.connectionTemplates[sourceKey];
    }
    
    const targetKey = `${sourceToolData.category}_${targetToolData.name}`;
    if (AI_KNOWLEDGE_BASE.connectionTemplates[targetKey]) {
        return AI_KNOWLEDGE_BASE.connectionTemplates[targetKey];
    }
    
    // No matching template found
    return null;
}

/**
 * Check if two tools can be connected
 * @param {Object} sourceToolData - Data about the source tool
 * @param {Object} targetToolData - Data about the target tool
 * @return {Boolean} True if the tools can be connected
 */
function canToolsConnect(sourceToolData, targetToolData) {
    // Don't connect the same tool to itself
    if (sourceToolData.id === targetToolData.id) return false;
    
    // Check if we have a code template for this connection
    return generateConnectionCode(sourceToolData, targetToolData) !== null;
}

/**
 * Get all possible connections for a tool
 * @param {Object} toolData - Data about the tool
 * @param {Array} allTools - Array of all available tools
 * @return {Array} Array of tools that can connect with the given tool
 */
function getPossibleConnections(toolData, allTools) {
    if (!toolData || !allTools || !Array.isArray(allTools)) return [];
    
    return allTools.filter(otherTool => 
        otherTool.id !== toolData.id && 
        (canToolsConnect(toolData, otherTool) || canToolsConnect(otherTool, toolData))
    );
}
    
    // Connection-based code templates - what code to generate when tools are connected
    connectionTemplates: {
        // Format: 'sourceToolName_targetToolName': { code, explanation }
        'Yahoo Finance_Python': {
            code: `
import yfinance as yf
import pandas as pd

# Fetch historical data for a stock
def get_stock_data(ticker_symbol, period="1mo"):
    """
    Fetch stock data from Yahoo Finance
    
    Parameters:
    ticker_symbol (str): Stock ticker symbol (e.g., 'AAPL', 'MSFT')
    period (str): Time period to fetch ('1d', '5d', '1mo', '3mo', '1y', '5y', 'max')
    
    Returns:
    pandas.DataFrame: Historical stock data
    """
    ticker = yf.Ticker(ticker_symbol)
    hist = ticker.history(period=period)
    return hist

# Example usage
if __name__ == "__main__":
    # Get Apple stock data for the last month
    aapl_data = get_stock_data('AAPL')
    
    # Display the first few rows
    print(aapl_data.head())
    
    # Basic statistics
    print("\\nSummary Statistics:")
    print(aapl_data['Close'].describe())
            `,
            explanation: "This code uses the yfinance library to fetch historical stock data from Yahoo Finance. It includes a reusable function to get data for any ticker symbol and time period, then processes it with pandas."
        },
        
        'Python_Pandas': {
            code: `
import pandas as pd
import numpy as np

# Sample data processing function
def process_data(df):
    """
    Process a pandas DataFrame with common operations
    
    Parameters:
    df (pandas.DataFrame): Input DataFrame
    
    Returns:
    pandas.DataFrame: Processed DataFrame
    """
    # Make a copy to avoid modifying the original
    processed_df = df.copy()
    
    # Handle missing values
    processed_df.fillna(method='ffill', inplace=True)  # Forward fill
    
    # Create some derived features
    if 'Date' in processed_df.columns:
        processed_df['Date'] = pd.to_datetime(processed_df['Date'])
        processed_df['Day'] = processed_df['Date'].dt.day_name()
        processed_df['Month'] = processed_df['Date'].dt.month_name()
    
    # Example of numeric processing (for columns that are numeric)
    numeric_cols = processed_df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        # Calculate z-score for each numeric column
        processed_df[f'{col}_zscore'] = (processed_df[col] - processed_df[col].mean()) / processed_df[col].std()
    
    return processed_df

# Example usage
if __name__ == "__main__":
    # Create or load your DataFrame
    # df = pd.read_csv('your_data.csv')
    
    # For demonstration, we'll create a sample DataFrame
    data = {
        'Date': pd.date_range(start='2023-01-01', periods=10),
        'Value': np.random.normal(100, 10, 10)
    }
    df = pd.DataFrame(data)
    
    # Process the data
    processed_df = process_data(df)
    
    # Display the results
    print("Original DataFrame:")
    print(df.head())
    print("\\nProcessed DataFrame:")
    print(processed_df.head())
            `,
            explanation: "This code demonstrates common pandas operations for data processing. It includes handling missing values, creating derived features from dates, and calculating statistical measures like z-scores."
        },
        
        'Python_Matplotlib': {
            code: `
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

def create_basic_plots(data, title="Data Visualization"):
    """
    Create basic matplotlib visualizations for data exploration
    
    Parameters:
    data (pandas.DataFrame or dict): Data to visualize
    title (str): Main title for the figure
    """
    # Convert dict to DataFrame if needed
    if isinstance(data, dict):
        df = pd.DataFrame(data)
    else:
        df = data.copy()
    
    # Create a figure with subplots
    fig = plt.figure(figsize=(15, 10))
    fig.suptitle(title, fontsize=16)
    
    # Plot 1: Line plot for time series or sequential data
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    
    if len(numeric_cols) > 0:
        ax1 = fig.add_subplot(2, 2, 1)
        df[numeric_cols].plot(ax=ax1)
        ax1.set_title('Line Plot')
        ax1.set_xlabel('Index')
        ax1.set_ylabel('Value')
        ax1.grid(True)
        
        # Plot 2: Histogram
        ax2 = fig.add_subplot(2, 2, 2)
        df[numeric_cols[0]].plot.hist(ax=ax2, bins=20, alpha=0.7)
        ax2.set_title(f'Histogram of {numeric_cols[0]}')
        ax2.set_xlabel('Value')
        ax2.set_ylabel('Frequency')
        
        # Plot 3: Box plot
        ax3 = fig.add_subplot(2, 2, 3)
        df[numeric_cols].plot.box(ax=ax3)
        ax3.set_title('Box Plot')
        ax3.set_ylabel('Value')
        
        # Plot 4: Scatter plot (if at least 2 numeric columns)
        if len(numeric_cols) >= 2:
            ax4 = fig.add_subplot(2, 2, 4)
            df.plot.scatter(x=numeric_cols[0], y=numeric_cols[1], ax=ax4, alpha=0.7)
            ax4.set_title(f'Scatter Plot: {numeric_cols[0]} vs {numeric_cols[1]}')
    
    plt.tight_layout(rect=[0, 0, 1, 0.95])  # Adjust layout to make room for main title
    plt.show()

# Example usage
if __name__ == "__main__":
    # Generate sample data
    dates = pd.date_range('2023-01-01', periods=100)
    data = {
        'Value1': np.random.normal(100, 15, 100),
        'Value2': np.random.normal(50, 10, 100) + np.linspace(0, 30, 100),  # Trending upward
        'Date': dates
    }
    df = pd.DataFrame(data)
    
    # Create visualizations
    create_basic_plots(df, "Sample Data Exploration")
            `,
            explanation: "This code creates a comprehensive set of visualizations using matplotlib for data exploration. It generates line plots, histograms, box plots, and scatter plots to help understand the data's distribution and relationships."
        },
        
        'Python_Kafka': {
            code: `
# Kafka Producer
from kafka import KafkaProducer
import json
import time
import random

def json_serializer(data):
    """Serialize data to JSON format"""
    return json.dumps(data).encode('utf-8')

def create_kafka_producer(bootstrap_servers=['localhost:9092']):
    """Create and return a Kafka producer instance"""
    producer = KafkaProducer(
        bootstrap_servers=bootstrap_servers,
        value_serializer=json_serializer,
        # Additional configuration options:
        # acks='all',  # Wait for all replicas to acknowledge
        # retries=3,   # Number of retries if the broker is unavailable
    )
    return producer

def send_data_to_kafka(producer, topic, data):
    """Send data to Kafka topic and handle success/error callbacks"""
    future = producer.send(topic, data)
    
    # Add callbacks to handle success and failure
    future.add_callback(on_send_success)
    future.add_errback(on_send_error)
    
    # Flush to make sure the message is sent
    producer.flush()

def on_send_success(record_metadata):
    """Callback for successful send"""
    print(f"Message delivered to {record_metadata.topic} [{record_metadata.partition}] at offset {record_metadata.offset}")

def on_send_error(exc):
    """Callback for failed send"""
    print(f"Failed to deliver message: {exc}")

# Example usage
if __name__ == "__main__":
    # Create a producer
    producer = create_kafka_producer()
    
    # Sample data - simulate stock price updates
    for i in range(10):
        data = {
            'stock': 'AAPL',
            'price': round(150 + random.uniform(-5, 5), 2),
            'timestamp': time.time()
        }
        
        # Send to Kafka
        print(f"Sending: {data}")
        send_data_to_kafka(producer, 'stock_updates', data)
        
        # Wait a bit between messages
        time.sleep(1)
    
    # Close the producer
    producer.close()
`,
            explanation: "This code demonstrates how to create a Kafka producer in Python. It includes functions for serializing data to JSON, creating a producer with proper configuration, and sending messages with callbacks for success and error handling."
        },
        
        'Kafka_Consumer': {
            code: `
# Kafka Consumer
from kafka import KafkaConsumer
import json

def json_deserializer(data):
    """Deserialize JSON data"""
    return json.loads(data.decode('utf-8'))

def create_kafka_consumer(topics, group_id='my-consumer-group', bootstrap_servers=['localhost:9092']):
    """Create and return a Kafka consumer instance"""
    consumer = KafkaConsumer(
        *topics,
        bootstrap_servers=bootstrap_servers,
        value_deserializer=json_deserializer,
        group_id=group_id,
        # Additional configuration options:
        # auto_offset_reset='earliest',  # Start from the beginning of the topic
        # enable_auto_commit=True,      # Automatically commit offsets
        # max_poll_records=500,         # Maximum records returned in a single call to poll()
    )
    return consumer

def process_messages(consumer):
    """Process messages from the consumer"""
    try:
        for message in consumer:
            # Print message details
            print(f"Topic: {message.topic}, Partition: {message.partition}, Offset: {message.offset}")
            print(f"Key: {message.key}, Value: {message.value}")
            
            # Process the message (replace with your business logic)
            process_data(message.value)
            
    except KeyboardInterrupt:
        print("Stopping consumer...")
    finally:
        consumer.close()

def process_data(data):
    """Process the data from Kafka message (example function)"""
    # Add your business logic here
    if 'stock' in data and 'price' in data:
        print(f"Stock: {data['stock']}, Price: ${data['price']}")
        
        # Example: Alert on price threshold
        if data['price'] > 152:
            print(f"ALERT: {data['stock']} price is above threshold!")

# Example usage
if __name__ == "__main__":
    # Create a consumer
    topics = ['stock_updates']
    consumer = create_kafka_consumer(topics)
    
    print(f"Starting consumer, listening to: {topics}")
    process_messages(consumer)
`,
            explanation: "This code shows how to create a Kafka consumer in Python. It includes functions for deserializing JSON data, creating a consumer with proper configuration, and processing messages with custom business logic."
        },
        
        'Producer_Broker': {
            code: `
# Kafka Producer to Broker connection
from kafka.admin import KafkaAdminClient, NewTopic
from kafka import KafkaProducer
import json
import time
import random

def json_serializer(data):
    """Serialize data to JSON format"""
    return json.dumps(data).encode('utf-8')

def create_topic(admin_client, topic_name, num_partitions=1, replication_factor=1):
    """Create a new Kafka topic if it doesn't exist"""
    try:
        topic = NewTopic(
            name=topic_name,
            num_partitions=num_partitions,
            replication_factor=replication_factor
        )
        admin_client.create_topics([topic])
        print(f"Topic '{topic_name}' created successfully")
    except Exception as e:
        print(f"Topic creation error: {e}")

def setup_kafka_infrastructure(bootstrap_servers=['localhost:9092']):
    """Set up Kafka infrastructure: admin client, topic creation, and producer"""
    # Create admin client
    admin_client = KafkaAdminClient(
        bootstrap_servers=bootstrap_servers,
        client_id='admin-client'
    )
    
    # Create topic
    topic_name = 'data_pipeline'
    create_topic(admin_client, topic_name)
    
    # Close admin client
    admin_client.close()
    
    # Create producer
    producer = KafkaProducer(
        bootstrap_servers=bootstrap_servers,
        value_serializer=json_serializer,
        acks='all'  # Wait for all replicas
    )
    
    return producer, topic_name

def generate_sample_data():
    """Generate sample data record"""
    return {
        'id': random.randint(1000, 9999),
        'timestamp': time.time(),
        'value': random.uniform(0, 100),
        'status': random.choice(['SUCCESS', 'PENDING', 'FAILED']),
        'metadata': {
            'source': 'system-' + str(random.randint(1, 5)),
            'priority': random.randint(1, 5)
        }
    }

# Example usage
if __name__ == "__main__":
    # Setup Kafka
    try:
        producer, topic_name = setup_kafka_infrastructure()
        
        # Send sample data
        print(f"Sending messages to topic: {topic_name}")
        for i in range(10):
            data = generate_sample_data()
            
            # Send to Kafka broker
            future = producer.send(topic_name, value=data)
            
            # Get metadata about the record
            metadata = future.get(timeout=10)
            print(f"Message {i+1} sent to partition {metadata.partition} at offset {metadata.offset}")
            
            # Wait a bit between messages
            time.sleep(0.5)
        
    except Exception as e:
        print(f"Error: {e}")
    
    finally:
        # Clean up
        if 'producer' in locals():
            producer.flush()
            producer.close()
            print("Producer closed")
`,
            explanation: "This code demonstrates the setup of a Kafka producer connecting to a broker. It includes topic creation using the admin client, configuring the producer with proper settings, and sending messages with metadata."
        },
        
        'Broker_Consumer': {
            code: `
# Kafka Broker to Consumer connection
from kafka import KafkaConsumer, TopicPartition
import json
from datetime import datetime
import threading
import time

def json_deserializer(data):
    """Deserialize JSON data"""
    return json.loads(data.decode('utf-8'))

def format_timestamp(timestamp):
    """Convert Unix timestamp to readable format"""
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

def create_consumer(topic, bootstrap_servers=['localhost:9092'], group_id=None):
    """Create Kafka consumer with configuration"""
    if group_id:
        # Use consumer group
        consumer = KafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
            value_deserializer=json_deserializer,
            group_id=group_id,
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            consumer_timeout_ms=10000  # 10 seconds timeout for testing
        )
    else:
        # Direct assignment without consumer group
        consumer = KafkaConsumer(
            bootstrap_servers=bootstrap_servers,
            value_deserializer=json_deserializer,
            auto_offset_reset='earliest',
            consumer_timeout_ms=10000  # 10 seconds timeout for testing
        )
        # Manually assign partitions
        partitions = [TopicPartition(topic, 0)]  # Assuming partition 0
        consumer.assign(partitions)
    
    return consumer

def process_message(msg):
    """Process a Kafka message"""
    data = msg.value
    print(f"Received message from partition {msg.partition}, offset {msg.offset}")
    
    if isinstance(data, dict):
        if 'timestamp' in data:
            # Format timestamp if present
            data['formatted_time'] = format_timestamp(data['timestamp'])
        
        # Process based on message content
        if 'status' in data:
            if data['status'] == 'FAILED':
                print(f"⚠️ ALERT: Failed record detected: {data}")
            elif data['status'] == 'SUCCESS':
                print(f"✓ Success: {data}")
            else:
                print(f"ℹ️ Info: {data}")
    else:
        print(f"Raw message: {data}")

def consumer_thread(topic, group_id=None):
    """Run consumer in a separate thread"""
    consumer = create_consumer(topic, group_id=group_id)
    
    try:
        print(f"Consumer started: topic={topic}, group_id={group_id}")
        for message in consumer:
            process_message(message)
    except Exception as e:
        print(f"Consumer error: {e}")
    finally:
        consumer.close()
        print(f"Consumer closed: topic={topic}, group_id={group_id}")

# Example usage
if __name__ == "__main__":
    topic_name = 'data_pipeline'
    
    # Start multiple consumers with different group IDs
    threads = []
    
    # Consumer with group ID for load balancing
    t1 = threading.Thread(target=consumer_thread, args=(topic_name, 'analysis-group'))
    threads.append(t1)
    
    # Direct consumer without group ID
    t2 = threading.Thread(target=consumer_thread, args=(topic_name, None))
    threads.append(t2)
    
    # Start all threads
    for t in threads:
        t.start()
    
    # Wait for threads to finish
    for t in threads:
        t.join()
    
    print("All consumers finished")
`,
            explanation: "This code shows how a Kafka consumer connects to a broker to receive messages. It includes consumer configuration options, partition assignment, message processing logic, and multiple consumer patterns using threading."
        },
        
        'Python_MongoDB': {
            code: `
# MongoDB with Python using PyMongo
import pymongo
from pymongo import MongoClient
import datetime
import pprint

def connect_to_mongodb(host='localhost', port=27017, db_name='fluentia_db'):
    """
    Connect to MongoDB and return database instance
    
    Parameters:
    host (str): MongoDB host
    port (int): MongoDB port
    db_name (str): Database name
    
    Returns:
    pymongo.database.Database: MongoDB database instance
    """
    try:
        # Create a connection to MongoDB
        client = MongoClient(host, port)
        
        # Access the database
        db = client[db_name]
        
        # Test connection
        client.admin.command('ping')
        print(f"Connected to MongoDB: {db_name}")
        
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return None

def insert_document(db, collection_name, document):
    """
    Insert a document into a collection
    
    Parameters:
    db (pymongo.database.Database): MongoDB database instance
    collection_name (str): Collection name
    document (dict): Document to insert
    
    Returns:
    str: Inserted document ID
    """
    try:
        # Get the collection
        collection = db[collection_name]
        
        # Add timestamp if not present
        if 'created_at' not in document:
            document['created_at'] = datetime.datetime.now()
        
        # Insert the document
        result = collection.insert_one(document)
        
        print(f"Document inserted with ID: {result.inserted_id}")
        return result.inserted_id
    except Exception as e:
        print(f"Error inserting document: {e}")
        return None

def find_documents(db, collection_name, query=None, sort_by=None, limit=None):
    """
    Find documents in a collection
    
    Parameters:
    db (pymongo.database.Database): MongoDB database instance
    collection_name (str): Collection name
    query (dict): Query filter
    sort_by (list): List of (key, direction) pairs for sort
    limit (int): Maximum number of documents to return
    
    Returns:
    list: Documents matching the query
    """
    try:
        # Get the collection
        collection = db[collection_name]
        
        # Set default query if None
        if query is None:
            query = {}
        
        # Find documents
        cursor = collection.find(query)
        
        # Apply sort if specified
        if sort_by:
            cursor = cursor.sort(sort_by)
        
        # Apply limit if specified
        if limit:
            cursor = cursor.limit(limit)
        
        # Convert cursor to list
        documents = list(cursor)
        
        print(f"Found {len(documents)} documents")
        return documents
    except Exception as e:
        print(f"Error finding documents: {e}")
        return []

def update_document(db, collection_name, query, update_data):
    """
    Update a document in a collection
    
    Parameters:
    db (pymongo.database.Database): MongoDB database instance
    collection_name (str): Collection name
    query (dict): Query to identify document
    update_data (dict): Data to update
    
    Returns:
    int: Number of documents modified
    """
    try:
        # Get the collection
        collection = db[collection_name]
        
        # Add update timestamp
        update_data['updated_at'] = datetime.datetime.now()
        
        # Update the document
        result = collection.update_one(
            query,
            {'$set': update_data}
        )
        
        print(f"Modified {result.modified_count} document(s)")
        return result.modified_count
    except Exception as e:
        print(f"Error updating document: {e}")
        return 0

def delete_document(db, collection_name, query):
    """
    Delete a document from a collection
    
    Parameters:
    db (pymongo.database.Database): MongoDB database instance
    collection_name (str): Collection name
    query (dict): Query to identify document
    
    Returns:
    int: Number of documents deleted
    """
    try:
        # Get the collection
        collection = db[collection_name]
        
        # Delete the document
        result = collection.delete_one(query)
        
        print(f"Deleted {result.deleted_count} document(s)")
        return result.deleted_count
    except Exception as e:
        print(f"Error deleting document: {e}")
        return 0

# Example usage
if __name__ == "__main__":
    # Connect to MongoDB
    db = connect_to_mongodb()
    
    if db:
        # Define a collection
        collection_name = 'users'
        
        # Insert a document
        user = {
            'name': 'John Doe',
            'email': 'john.doe@example.com',
            'roles': ['developer', 'architect'],
            'active': True,
            'created_at': datetime.datetime.now()
        }
        user_id = insert_document(db, collection_name, user)
        
        # Find documents
        users = find_documents(db, collection_name)
        for user in users:
            pprint.pprint(user)
        
        # Update a document
        if user_id:
            update_document(
                db, 
                collection_name,
                {'_id': user_id},
                {'active': False, 'last_login': datetime.datetime.now()}
            )
        
        # Find the updated document
        print("\\nAfter update:")
        updated_user = find_documents(db, collection_name, {'_id': user_id})
        if updated_user:
            pprint.pprint(updated_user[0])
        
        # Delete the document
        if user_id:
            delete_document(db, collection_name, {'_id': user_id})
`,
            explanation: "This comprehensive example demonstrates how to use PyMongo to interact with MongoDB. It includes functions for connecting to the database, inserting documents, querying with filters, updating documents, and deleting data with proper error handling."
        },
        
        'Python_Flask': {
            code: `
# Flask RESTful API Application
from flask import Flask, request, jsonify
import os
from datetime import datetime
import json

# Initialize Flask app
app = Flask(__name__)

# Sample in-memory database (replace with a real database in production)
tasks = [
    {
        'id': 1,
        'title': 'Implement API endpoints',
        'description': 'Create RESTful API endpoints for the application',
        'due_date': '2023-06-30',
        'status': 'completed'
    },
    {
        'id': 2,
        'title': 'Set up database',
        'description': 'Configure and connect to the database',
        'due_date': '2023-07-15',
        'status': 'in_progress'
    }
]

# Helper functions
def get_next_id():
    """Get the next available ID for a new task"""
    return max([task['id'] for task in tasks], default=0) + 1

def find_task(task_id):
    """Find a task by ID"""
    for task in tasks:
        if task['id'] == task_id:
            return task
    return None

# Routes
@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        'message': 'Welcome to the Task Management API',
        'version': '1.0',
        'endpoints': {
            'GET /tasks': 'Get all tasks',
            'GET /tasks/<id>': 'Get a specific task',
            'POST /tasks': 'Create a new task',
            'PUT /tasks/<id>': 'Update a task',
            'DELETE /tasks/<id>': 'Delete a task'
        }
    })

@app.route('/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks, with optional status filter"""
    status = request.args.get('status')
    
    if status:
        filtered_tasks = [task for task in tasks if task['status'] == status]
        return jsonify({'tasks': filtered_tasks})
    
    return jsonify({'tasks': tasks})

@app.route('/tasks/<int:task_id>', methods=['GET'])
def get_task(task_id):
    """Get a specific task by ID"""
    task = find_task(task_id)
    
    if task:
        return jsonify({'task': task})
    
    return jsonify({'error': 'Task not found'}), 404

@app.route('/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    # Check if request contains JSON data
    if not request.json:
        return jsonify({'error': 'Request must contain JSON data'}), 400
    
    # Extract data from request
    data = request.json
    
    # Validate required fields
    if 'title' not in data:
        return jsonify({'error': 'Title is required'}), 400
    
    # Create a new task
    task = {
        'id': get_next_id(),
        'title': data['title'],
        'description': data.get('description', ''),
        'due_date': data.get('due_date', ''),
        'status': data.get('status', 'pending'),
        'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # Add to the list
    tasks.append(task)
    
    return jsonify({'task': task}), 201

@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update an existing task"""
    # Find the task
    task = find_task(task_id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Check if request contains JSON data
    if not request.json:
        return jsonify({'error': 'Request must contain JSON data'}), 400
    
    # Extract data from request
    data = request.json
    
    # Update fields if present in the request
    if 'title' in data:
        task['title'] = data['title']
    if 'description' in data:
        task['description'] = data['description']
    if 'due_date' in data:
        task['due_date'] = data['due_date']
    if 'status' in data:
        task['status'] = data['status']
    
    # Add updated timestamp
    task['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return jsonify({'task': task})

@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    # Find the task
    task = find_task(task_id)
    
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Remove task from list
    tasks.remove(task)
    
    return jsonify({'result': True})

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(400)
def bad_request(error):
    return jsonify({'error': 'Bad request'}), 400

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500

# Run the application
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
            `,
            explanation: "This Flask application implements a RESTful API for task management. It includes endpoints for creating, reading, updating, and deleting tasks (CRUD operations). The code includes input validation, error handling, and proper HTTP status codes."
        },