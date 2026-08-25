const { metrics } = require('../config/monitoring');

/**
 * Middleware to track custom business metrics
 */
function metricsMiddleware(req, res, next) {
    const start = Date.now();

    // Track active connections
    metrics.activeConnections.inc();

    // Cleanup on response finish
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;

        // Record HTTP metrics
        metrics.httpRequestCounter.inc({
            method: req.method,
            route: req.route ? req.route.path : req.path,
            status_code: res.statusCode
        });

        metrics.httpRequestDuration.observe(
            {
                method: req.method,
                route: req.route ? req.route.path : req.path,
                status_code: res.statusCode
            },
            duration
        );

        // Decrement active connections
        metrics.activeConnections.dec();
    });

    next();
}

/**
 * Track database operations
 */
function trackDbOperation(operation, table, duration) {
    metrics.dbQueryCounter.inc({ operation, table });
    metrics.dbQueryDuration.observe({ operation, table }, duration);
}

/**
 * Track user registration
 */
function trackRegistration(success) {
    metrics.userRegistrations.inc({ status: success ? 'success' : 'failure' });
}

/**
 * Track user login
 */
function trackLogin(success) {
    metrics.userLogins.inc({ status: success ? 'success' : 'failure' });
}

/**
 * Update active sessions count
 */
function updateActiveSessions(count) {
    metrics.activeSessions.set(count);
}

module.exports = {
    metricsMiddleware,
    trackDbOperation,
    trackRegistration,
    trackLogin,
    updateActiveSessions
};
