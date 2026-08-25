const promClient = require('prom-client');
const winston = require('winston');
const WintonCloudWatch = require('winston-cloudwatch');

// ===================================
// PROMETHEUS SETUP
// ===================================

// Create a Registry for Prometheus metrics
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom Metrics
const httpRequestCounter = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register]
});

const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    registers: [register]
});

const activeConnections = new promClient.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    registers: [register]
});

const dbQueryCounter = new promClient.Counter({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table'],
    registers: [register]
});

const dbQueryDuration = new promClient.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
    registers: [register]
});

// Business Metrics
const userRegistrations = new promClient.Counter({
    name: 'user_registrations_total',
    help: 'Total number of user registrations',
    labelNames: ['status'],
    registers: [register]
});

const userLogins = new promClient.Counter({
    name: 'user_logins_total',
    help: 'Total number of login attempts',
    labelNames: ['status'],
    registers: [register]
});

const activeSessions = new promClient.Gauge({
    name: 'active_sessions',
    help: 'Number of active user sessions',
    registers: [register]
});

// ===================================
// WINSTON LOGGER SETUP
// ===================================

const logLevel = process.env.LOG_LEVEL || 'info';
const environment = process.env.NODE_ENV || 'development';

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create transports array
const transports = [
    // Console transport
    new winston.transports.Console({
        format: environment === 'production' ? logFormat : consoleFormat
    }),
    
    // File transport for errors
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }),
    
    // File transport for all logs
    new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    })
];

// Add CloudWatch transport if in production and AWS credentials are available
if (environment === 'production' && process.env.AWS_REGION) {
    transports.push(
        new WintonCloudWatch({
            logGroupName: process.env.CLOUDWATCH_LOG_GROUP || '/aws/ai-hub/application',
            logStreamName: `${process.env.CLOUDWATCH_LOG_STREAM || 'app'}-${new Date().toISOString().split('T')[0]}`,
            awsRegion: process.env.AWS_REGION,
            messageFormatter: ({ level, message, ...meta }) => {
                return JSON.stringify({ level, message, ...meta });
            }
        })
    );
}

// Create logger instance
const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    exitOnError: false
});

// ===================================
// EXPORTS
// ===================================

module.exports = {
    // Prometheus
    register,
    metrics: {
        httpRequestCounter,
        httpRequestDuration,
        activeConnections,
        dbQueryCounter,
        dbQueryDuration,
        userRegistrations,
        userLogins,
        activeSessions
    },
    
    // Winston
    logger
};
