from langchain.tools import tool
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from .firebase_tool import _find_member_by_name

@tool
def send_performance_report_email(member_name: str, custom_message: str = "") -> str:
    """
    Sends a personalized performance report email to a student using their registered email.
    Args:
        member_name: The full name of the student.
        custom_message: An optional encouraging message or specific feedback to include.
    """
    from_email = os.getenv("BREVO_SENDER_EMAIL")
    smtp_login = os.getenv("BREVO_SMTP_LOGIN")
    smtp_key = os.getenv("BREVO_SMTP_KEY")
    
    if not from_email or not smtp_key or not smtp_login:
        return "Email configuration is missing in environment variables."
        
    member_doc = _find_member_by_name(member_name)
    if not member_doc:
        return f"Could not find member '{member_name}' to send email."
        
    data = member_doc.to_dict()
    to_email = data.get('email')
    if not to_email:
        return f"Member '{member_name}' does not have a registered email address."
        
    try:
        subject = f"Performance Report: {member_name} - MVIT Coding Team"
        
        # Fetch stats for the email
        import firebase_admin
        from firebase_admin import firestore
        db = firestore.client()
        daily_docs = list(member_doc.reference.collection('daily_totals').order_by('date', direction=firestore.Query.DESCENDING).limit(1).stream())
        stats = daily_docs[0].to_dict() if daily_docs else {}
        
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-top: 5px solid #2563eb;">
                <h2 style="color: #2563eb;">MVIT Coding Team - Performance Update</h2>
                <p>Hello <strong>{member_name}</strong>,</p>
                <p>Here is your current standing in the coding team:</p>
                <ul>
                    <li><strong>ELO Rating:</strong> {data.get('elo_rating', 1200)}</li>
                    <li><strong>LeetCode Solved:</strong> {stats.get('leetcode_total', 0)}</li>
                    <li><strong>SkillRack Points:</strong> {stats.get('skillrack_total', 0)}</li>
                </ul>
                <p>{custom_message}</p>
                <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 5px;">
                    <p style="font-size: 0.9em; margin: 0;">Keep pushing your limits! Consistency is the key to mastering code.</p>
                </div>
                <p style="font-size: 0.8em; color: #777; margin-top: 20px;">This is an automated report from your Autonomous Campus AI Agent.</p>
            </div>
        </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html, 'html'))
        
        server = smtplib.SMTP('smtp-relay.brevo.com', 587, timeout=15)
        server.starttls()
        server.login(smtp_login, smtp_key)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        
        return f"Successfully sent performance report email to {member_name} ({to_email})."
    except Exception as e:
        return f"Failed to send email: {str(e)}"
