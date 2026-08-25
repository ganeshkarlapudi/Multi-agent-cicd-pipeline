# agents/deploy_agent.py
"""
Deploy Agent.

Assumes the deploy-agent-role via GitLab OIDC (no long-lived AWS keys),
then applies Terraform and the Kubernetes manifests. This role's IAM
policy is deliberately narrow -- see terraform/main.tf -- so this agent
structurally cannot touch IAM or resources outside its own cluster/state.
"""
import json
import os
import subprocess


def assume_role_via_oidc() -> None:
    """
    GitLab injects the OIDC JWT as AWS_OIDC_TOKEN (see id_tokens in
    .gitlab-ci.yml). Exchange it for short-lived AWS credentials and export
    them so the terraform/kubectl calls below pick them up.
    """
    result = subprocess.run(
        [
            "aws", "sts", "assume-role-with-web-identity",
            "--role-arn", os.environ["DEPLOY_ROLE_ARN"],
            "--role-session-name", "gitlab-deploy-agent",
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


def deploy() -> None:
    # Apply Terraform infrastructure changes
    subprocess.run(["terraform", "-chdir=terraform", "init"], check=True)
    subprocess.run(["terraform", "-chdir=terraform", "apply", "-auto-approve"], check=True)

    # Apply K8s manifests
    subprocess.run(["kubectl", "apply", "-f", "k8s/deployment.yaml"], check=True)
    subprocess.run(["kubectl", "apply", "-f", "k8s/service.yaml"], check=True)

    # Set the image to the exact commit SHA that was just built
    account_id = os.environ["AWS_ACCOUNT_ID"]
    region = os.environ.get("AWS_REGION", "ap-south-2")
    commit_sha = os.environ["CI_COMMIT_SHORT_SHA"]
    image = f"{account_id}.dkr.ecr.{region}.amazonaws.com/AgentOps:{commit_sha}"
    subprocess.run(
        ["kubectl", "set", "image", "deployment/AgentOps", f"AgentOps={image}"],
        check=True,
    )
    print(json.dumps({
        "action": "deploy",
        "image": image,
        "status": "success",
    }))


if __name__ == "__main__":
    assume_role_via_oidc()
    configure_kubectl()
    deploy()
