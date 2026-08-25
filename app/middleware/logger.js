const { logger } = require('../config/monitoring');
const { v4: uuidv4 } = require('crypto');

/**
 * Request logging middleware
 * Logs all incoming requests and responses with correlation IDs
 */
function requestLogger(req, res, next) {
    // Generate correlation ID for request tracing
    const correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
    req.correlationId = correlationId;

    // Add correlation ID to response headers
    res.setHeader('X-Correlation-ID', correlationId);

    const start = Date.now();

    // Log incoming request
    logger.info('Incoming request', {
        correlationId,
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent']
    });

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - start;

        const logData = {
            correlationId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip || req.connection.remoteAddress
        };

        if (res.statusCode >= 500) {
            logger.error('Request completed with server error', logData);
        } else if (res.statusCode >= 400) {
            logger.warn('Request completed with client error', logData);
        } else {
            logger.info('Request completed', logData);
        }
    });

    next();
}

/**
 * Error logging middleware
 * Logs errors with full stack traces
 */
function errorLogger(err, req, res, next) {
    logger.error('Unhandled error', {
        correlationId: req.correlationId,
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress
    });

    next(err);
}

/**
 * Generate a simple correlation ID
 */
function generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
    requestLogger,
    errorLogger
};
