from langchain.tools import tool
import sys
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

@tool
def escalate_to_mentor(student_name: str, issue_description: str, mentor_email: str = "bytebreakers04@gmail.com") -> str:
    """
    Escalates an issue to a human mentor via email if the agent cannot resolve it or lacks confidence.
    Args:
        student_name: Name of the student facing the issue.
        issue_description: Detailed summary of what the student needs help with.
        mentor_email: The email of the mentor to escalate to. Default is bytebreakers04@gmail.com.
    Returns:
        Confirmation that the email was sent, or an error.
    """
    from_email = os.getenv("BREVO_SENDER_EMAIL")
    smtp_login = os.getenv("BREVO_SMTP_LOGIN")
    smtp_key = os.getenv("BREVO_SMTP_KEY")
    
    if not from_email or not smtp_key or not smtp_login:
        return "Escalation failed: BREVO_SENDER_EMAIL or BREVO_SMTP_KEY is not set in environment."
        
    try:
        subject = f"⚠️ Agent Escalation: Assistance required for {student_name}"
        html = f"""
        <html><body style="font-family: sans-serif;">
        <h2 style="color: #4f46e5;">Autonomous Agent Escalation</h2>
        <p>The AI Agent determined this query requires human intervention.</p>
        <p><strong>Student:</strong> {student_name}</p>
        <p><strong>Issue/Query:</strong><br/>{issue_description}</p>
        <hr/>
        <p><em>Please reach out to the student as soon as possible.</em></p>
        </body></html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['From'] = from_email
        msg['To'] = mentor_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html, 'html'))
        
        # Using brevo (sendinblue) SMTP as configured in the existing code
        server = smtplib.SMTP('smtp-relay.brevo.com', 587)
        server.starttls()
        server.login(smtp_login, smtp_key)
        server.sendmail(from_email, mentor_email, msg.as_string())
        server.quit()
        
        return f"Successfully escalated the issue to {mentor_email}."
    except Exception as e:
        return f"Failed to send escalation email: {e}"
