# agents/monitor_agent.py
"""
Monitor & Rollback Agent.

Polls CloudWatch for elevated 5xx error rates after a deploy and rolls back
the Kubernetes deployment if the threshold is breached. Every decision --
including "no rollback needed" -- is logged as structured JSON for
auditability. This role can read CloudWatch and run `kubectl rollout undo`
only; it cannot run terraform apply or touch IAM.
"""
import json
import os
import subprocess
import time
from datetime import datetime, timedelta, timezone

import boto3

cloudwatch = boto3.client("cloudwatch", region_name=os.environ.get("AWS_REGION", "ap-south-2"))

ERROR_THRESHOLD = 50
POLL_INTERVAL_SECONDS = 60
POLL_ATTEMPTS = 10
LOOKBACK_MINUTES = 5


def assume_role_via_oidc() -> None:
    """Assume the monitor-agent-role via GitLab OIDC."""
    result = subprocess.run(
        [
            "aws", "sts", "assume-role-with-web-identity",
            "--role-arn", os.environ["MONITOR_ROLE_ARN"],
            "--role-session-name", "gitlab-monitor-agent",
            "--web-identity-token", os.environ["AWS_OIDC_TOKEN"],
            "--output", "json",
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    creds = json.loads(result.stdout)["Credentials"]
    os.environ["AWS_ACCESS_KEY_ID"] = creds["AccessKeyId"]
    os.environ["AWS_SECRET_ACCESS_KEY"] = creds["SecretAccessKey"]
    os.environ["AWS_SESSION_TOKEN"] = creds["SessionToken"]


def configure_kubectl() -> None:
    """Configure kubectl to talk to the EKS cluster."""
    cluster_name = os.environ.get("EKS_CLUSTER_NAME", "AgentOps-cluster")
    region = os.environ.get("AWS_REGION", "ap-south-2")
    subprocess.run(
        ["aws", "eks", "update-kubeconfig",
         "--name", cluster_name,
         "--region", region],
        check=True,
    )


def get_error_rate() -> float:
    now = datetime.now(timezone.utc)
    resp = cloudwatch.get_metric_statistics(
        Namespace="AWS/ApplicationELB",
        MetricName="HTTPCode_Target_5XX_Count",
        StartTime=now - timedelta(minutes=LOOKBACK_MINUTES),
        EndTime=now,
        Period=60,
        Statistics=["Sum"],
    )
    datapoints = resp.get("Datapoints", [])
    return sum(d["Sum"] for d in datapoints)


def rollback(reason: str) -> None:
    log_entry = {
        "action": "rollback",
        "reason": reason,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    print(json.dumps(log_entry))  # captured in the job log for audit
    subprocess.run(["kubectl", "rollout", "undo", "deployment/AgentOps"], check=True)


def main() -> None:
    for attempt in range(1, POLL_ATTEMPTS + 1):
        error_count = get_error_rate()
        print(json.dumps({"attempt": attempt, "error_count": error_count}))
        if error_count > ERROR_THRESHOLD:
            rollback(f"error_count={error_count} exceeded threshold={ERROR_THRESHOLD}")
            return
        time.sleep(POLL_INTERVAL_SECONDS)
    print(json.dumps({"action": "no_rollback", "reason": "metrics stayed within threshold"}))


if __name__ == "__main__":
    assume_role_via_oidc()
    configure_kubectl()
    main()
