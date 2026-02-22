#!/usr/bin/env python3
"""
Duplicate Issue Detector for GitHub

Detects potential duplicate issues using semantic similarity.
Uses sentence embeddings to find similar existing issues and posts a comment
with suggestions (no auto-closing, just flagging for maintainers).

Configuration:
- SIMILARITY_THRESHOLD: Similarity score (0-1) above which issues are flagged (default: 0.75)
- LIMIT_RESULTS: Maximum number of similar issues to suggest (default: 5)
"""

import os
import sys
import json
from typing import List, Tuple
import requests
from datetime import datetime

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    print("Installing sentence-transformers...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "sentence-transformers"])
    from sentence_transformers import SentenceTransformer

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity


# Configuration
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.75"))
LIMIT_RESULTS = int(os.getenv("LIMIT_RESULTS", "5"))
EXCLUDE_CLOSED = os.getenv("EXCLUDE_CLOSED", "false").lower() == "true"

# GitHub API setup
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
REPO = os.getenv("REPO")
ISSUE_NUMBER = int(os.getenv("ISSUE_NUMBER", "0"))
ISSUE_TITLE = os.getenv("ISSUE_TITLE", "")
ISSUE_BODY = os.getenv("ISSUE_BODY", "")

GITHUB_API_URL = "https://api.github.com"
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}


def get_all_issues() -> List[dict]:
    """Fetch all issues (open and closed) from the repository."""
    issues = []
    per_page = 100
    page = 1
    
    while True:
        url = f"{GITHUB_API_URL}/repos/{REPO}/issues"
        params = {
            "state": "all" if not EXCLUDE_CLOSED else "open",
            "per_page": per_page,
            "page": page,
            "sort": "updated",
            "direction": "desc"
        }
        
        try:
            response = requests.get(url, headers=HEADERS, params=params, timeout=30)
            response.raise_for_status()
            page_issues = response.json()
            
            if not page_issues:
                break
                
            issues.extend(page_issues)
            page += 1
            
            # Limit to recent 500 issues for performance
            if len(issues) > 500:
                issues = issues[:500]
                break
                
        except requests.exceptions.RequestException as e:
            print(f"Error fetching issues: {e}")
            break
    
    return issues


def prepare_text(title: str, body: str = "") -> str:
    """Prepare issue text for embedding."""
    text = title
    if body:
        # Use first 500 chars of body to keep embeddings meaningful
        text += " " + body[:500]
    return text.strip()


def calculate_similarity(current_text: str, existing_texts: List[str]) -> Tuple[np.ndarray, SentenceTransformer]:
    """Calculate cosine similarity between current issue and existing issues."""
    # Use a lightweight model for faster inference
    model = SentenceTransformer("all-MiniLM-L6-v2")
    
    # Encode the current issue
    current_embedding = model.encode(current_text, convert_to_tensor=False)
    
    # Encode all existing issues
    existing_embeddings = model.encode(existing_texts, convert_to_tensor=False)
    
    # Calculate cosine similarity
    similarity_scores = cosine_similarity([current_embedding], existing_embeddings)[0]
    
    return similarity_scores, model


def find_similar_issues(current_issue_number: int, issues: List[dict]) -> List[Tuple[dict, float]]:
    """Find similar issues using semantic matching."""
    if not issues:
        return []
    
    # Current issue text
    current_text = prepare_text(ISSUE_TITLE, ISSUE_BODY)
    
    # Filter out the current issue
    other_issues = [
        issue for issue in issues 
        if issue.get("number") != current_issue_number and not issue.get("pull_request")
    ]
    
    if not other_issues:
        return []
    
    # Prepare texts for comparison
    existing_texts = [
        prepare_text(issue.get("title", ""), issue.get("body", ""))
        for issue in other_issues
    ]
    
    # Calculate similarities
    try:
        similarity_scores, _ = calculate_similarity(current_text, existing_texts)
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        return []
    
    # Find issues above threshold
    similar_issues = []
    for i, score in enumerate(similarity_scores):
        if score >= SIMILARITY_THRESHOLD:
            similar_issues.append((other_issues[i], float(score)))
    
    # Sort by similarity and limit results
    similar_issues.sort(key=lambda x: x[1], reverse=True)
    return similar_issues[:LIMIT_RESULTS]


def format_comment(similar_issues: List[Tuple[dict, float]]) -> str:
    """Format a clean warning-style comment without similarity percentages."""
    if not similar_issues:
        return ""

    comment = "## ⚠️ Potential Duplicate Issue Detected\n\n"
    comment += (
        "Thanks for opening this issue! Our automated checks suggest that this "
        "issue may be related to one or more existing issues:\n\n"
    )

    for issue, _ in similar_issues:
        state_emoji = "🟢" if issue.get("state") == "open" else "🔴"
        comment += (
            f"- {state_emoji} "
            f"[#{issue['number']} – {issue['title']}]({issue['html_url']})\n"
        )

    comment += (
        "\n---\n"
        "🔍 **What this means:**\n"
        "- This is only a suggestion based on semantic similarity\n"
        "- No action has been taken automatically\n"
        "- Maintainers will decide whether this is a duplicate\n\n"
        "If this issue is different, feel free to ignore this message and "
        "add more details to clarify the distinction."
    )

    return comment


def post_comment(comment: str) -> bool:
    """Post a comment on the issue."""
    url = f"{GITHUB_API_URL}/repos/{REPO}/issues/{ISSUE_NUMBER}/comments"
    
    try:
        response = requests.post(
            url,
            headers=HEADERS,
            json={"body": comment},
            timeout=30
        )
        response.raise_for_status()
        print(f"✅ Comment posted successfully")
        return True
    except requests.exceptions.RequestException as e:
        print(f"❌ Error posting comment: {e}")
        return False


def main():
    """Main function."""
    print(f"🔍 Checking for duplicate issues...")
    print(f"Issue: #{ISSUE_NUMBER}")
    print(f"Repository: {REPO}")
    print(f"Similarity Threshold: {SIMILARITY_THRESHOLD * 100}%")
    print()
    
    # Validate inputs
    if not GITHUB_TOKEN or not REPO or ISSUE_NUMBER == 0:
        print("❌ Missing required environment variables")
        sys.exit(1)
    
    if not ISSUE_TITLE:
        print("❌ Issue title is empty")
        sys.exit(1)
    
    # Fetch all issues
    print("📥 Fetching existing issues...")
    issues = get_all_issues()
    print(f"Found {len(issues)} total issues")
    
    if len(issues) <= 1:
        print("⚠️ Not enough existing issues to check for duplicates")
        return
    
    # Find similar issues
    print("🧠 Analyzing semantic similarity...")
    similar_issues = find_similar_issues(ISSUE_NUMBER, issues)
    
    if not similar_issues:
        print("✅ No similar issues found")
        return
    
    # Format and post comment
    print(f"Found {len(similar_issues)} similar issue(es)")
    comment = format_comment(similar_issues)
    
    if comment:
        print("\n📝 Posting comment with suggestions...")
        post_comment(comment)
    else:
        print("✅ No comment needed")


if __name__ == "__main__":
    main()
