import logging
import smtplib
from email.mime.text import MIMEText
from django.conf import settings
gmail_user = 'magi815@gmail.com'
gmail_password = 'kbyovhajjcohecvy'

class IPNotificationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging.INFO)
        formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
        handler = logging.FileHandler('logfile.log')
        handler.setLevel(logging.INFO)
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logged_ips = set()
        self.email_user = gmail_user
        self.email_password = gmail_password
        self.email_recipient = gmail_user

    def __call__(self, request):
        ip_address = request.META.get('REMOTE_ADDR')
        user_agent = request.META.get('HTTP_USER_AGENT')
        referer = request.META.get('HTTP_REFERER')
        log_message = f'{ip_address} - {user_agent} - {referer}'
        if ip_address not in self.logged_ips:
            self.logged_ips.add(ip_address)
            self.logger.info(log_message)
            self.send_email(ip_address, log_message)
        response = self.get_response(request)
        return response

    def send_email(self, subject, body):
        email_text = f"Subject: {subject}\n\n{body}"

        try:
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.ehlo()
            server.login(self.email_user, self.email_password)
            server.sendmail(self.email_user, self.email_recipient, email_text)
            server.close()

            print('Email sent!')
        except Exception as e:
            print('Something went wrong...', e)