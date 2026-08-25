# agents/pr_review_agent.py
"""
PR Review Agent.

Reads the merge request diff, asks Gemini for a code review, and posts the
result as a note on the MR. Runs with an api-scoped GitLab project access
token -- it cannot trigger a deploy even if the model output tried to
instruct it to. That's enforced structurally (token scope), not by prompt.
"""
import argparse
import os

import google.generativeai as genai
import requests

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel("gemini-3.1-pro")


def review_diff(diff_text: str) -> str:
    prompt = (
        "Review this diff for bugs, security issues, and style. "
        f"Return concise, actionable comments:\n\n{diff_text}"
    )
    response = model.generate_content(prompt)
    return response.text


def post_comment(mr_iid: str, body: str) -> None:
    project_id = os.environ["CI_PROJECT_ID"]
    token = os.environ["GITLAB_BOT_TOKEN"]  # project access token, scope: api
    api_url = os.environ["CI_API_V4_URL"]
    url = f"{api_url}/projects/{project_id}/merge_requests/{mr_iid}/notes"
    resp = requests.post(url, headers={"PRIVATE-TOKEN": token}, json={"body": body})
    resp.raise_for_status()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--diff", required=True, help="Path to the diff file")
    parser.add_argument("--mr", required=True, help="Merge request IID")
    args = parser.parse_args()

    with open(args.diff, encoding="utf-8") as f:
        diff_text = f.read()

    review = review_diff(diff_text)
    post_comment(args.mr, review)


if __name__ == "__main__":
    main()
