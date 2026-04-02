from langchain.tools import tool
import sys
import os

# Add parent directory to sys path to import the existing scraping script
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))
from SCRAPINGcode import get_leetcode_total, get_skillrack_total, get_codechef_solved, get_hackerrank_solved, get_github_repo_count

@tool
def get_user_coding_stats(platform: str, identifier: str) -> str:
    """
    Fetches the number of problems solved or repositories for a given user on a specified platform.
    Args:
        platform: must be one of 'leetcode', 'skillrack', 'codechef', 'hackerrank', 'github'.
        identifier: the profile URL or username of the user on that platform.
    Returns:
        A string representing the number of problems solved.
    """
    platform = platform.lower()
    try:
        if platform == 'leetcode':
            total = get_leetcode_total(identifier)
        elif platform == 'skillrack':
            total = get_skillrack_total(identifier)
        elif platform == 'codechef':
            total = get_codechef_solved(identifier)
        elif platform == 'hackerrank':
            total = get_hackerrank_solved(identifier)
        elif platform == 'github':
            total = get_github_repo_count(identifier)
        else:
            return f"Platform {platform} is not supported."
        
        return f"{total} problems solved/repos on {platform}."
    except Exception as e:
        return f"Error scraping {platform}: {str(e)}"
