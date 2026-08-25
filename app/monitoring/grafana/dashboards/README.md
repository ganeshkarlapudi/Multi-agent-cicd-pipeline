# AI Hub Monitoring Dashboards

This directory contains Grafana dashboard configurations for the AI Hub application.

## Quick Start with Pre-built Dashboards

Instead of complex custom JSON, we recommend using Grafana's official Node.js dashboard and customizing it:

### Option 1: Import Official Dashboards (Recommended)

1. **Node.js Application Dashboard**
   - Dashboard ID: `11159` (Node.js Application Dashboard)
   - URL: https://grafana.com/grafana/dashboards/11159
   - Import in Grafana UI: Configuration → Dashboards → Import → Enter ID `11159`

2. **Node Exporter Full Dashboard**
   - Dashboard ID: `1860` (Node Exporter Full)
   - URL: https://grafana.com/grafana/dashboards/1860
   - Import in Grafana UI: Configuration → Dashboards → Import → Enter ID `1860`

3. **Prometheus Stats Dashboard**
   - Dashboard ID: `2` (Prometheus Stats)
   - URL: https://grafana.com/grafana/dashboards/2
   - Import in Grafana UI: Configuration → Dashboards → Import → Enter ID `2`

### Option 2: Create Custom Dashboards

Use the Grafana UI to create custom dashboards with these key metrics:

#### Application Overview Dashboard

**HTTP Metrics:**
- Request Rate: `rate(http_requests_total[5m])`
- Error Rate: `sum(rate(http_requests_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`
- P95 Response Time: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`
- P99 Response Time: `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`

**Business Metrics:**
- Total Registrations: `sum(user_registrations_total)`
- Registration Rate: `rate(user_registrations_total[5m])`
- Login Success Rate: `sum(rate(user_logins_total{status="success"}[5m])) / sum(rate(user_logins_total[5m]))`
- Active Sessions: `active_sessions`

**Database Metrics:**
- Query Rate: `rate(db_queries_total[5m])`
- Query Duration P95: `histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket[5m])) by (le))`

#### System Metrics Dashboard

**CPU:**
- CPU Usage: `100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`

**Memory:**
- Memory Usage: `(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`
- Memory Available: `node_memory_MemAvailable_bytes / 1024 / 1024 / 1024`

**Disk:**
- Disk Usage: `(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100`
- Disk I/O: `rate(node_disk_io_time_seconds_total[5m])`

**Network:**
- Network In: `rate(node_network_receive_bytes_total[5m])`
- Network Out: `rate(node_network_transmit_bytes_total[5m])`

## Dashboard Access

After starting the monitoring stack with `docker-compose up -d`:

1. Access Grafana at: http://localhost:3001
2. Login with:
   - Username: `admin`
   - Password: `admin` (change on first login)
3. Navigate to Dashboards → Browse
4. Import dashboards using IDs above or create custom ones

## Customization

To customize dashboards:
1. Import a base dashboard
2. Click "Dashboard settings" (gear icon)
3. Click "Save As" to create a copy
4. Edit panels to match your specific metrics
5. Save the dashboard

## Exporting Dashboards

To export your custom dashboards for version control:
1. Open the dashboard
2. Click "Dashboard settings" (gear icon)
3. Click "JSON Model"
4. Copy the JSON
5. Save to `dashboards/custom-dashboard-name.json`
6. Update `provisioning/dashboards.yml` to include it

## Key Panels to Add

### Application Health
- **Uptime**: `time() - process_start_time_seconds`
- **Active Connections**: `active_connections`
- **Request Rate by Endpoint**: `sum(rate(http_requests_total[5m])) by (route)`

### Error Tracking
- **Error Count**: `sum(increase(http_requests_total{status_code=~"5.."}[1h]))`
- **Error Rate by Endpoint**: `sum(rate(http_requests_total{status_code=~"5.."}[5m])) by (route)`

### Performance
- **Response Time Heatmap**: Use `http_request_duration_seconds_bucket`
- **Slowest Endpoints**: `topk(5, histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)))`

## Alerts in Grafana

Grafana can also send alerts. To configure:
1. Go to Alerting → Notification channels
2. Add email, Slack, or other notification channels
3. Create alert rules in dashboard panels
4. Set thresholds and notification channels

Note: Prometheus alerts (in `prometheus/alerts.yml`) are recommended for production as they're more reliable.
