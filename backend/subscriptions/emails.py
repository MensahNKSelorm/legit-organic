import resend
from django.conf import settings
from django.utils.html import escape


def send_weekly_payment_link(subscription, week, authorization_url):
    resend.Emails.send({
        'from': f'Legit Organic <{settings.DEFAULT_FROM_EMAIL}>',
        'to': [subscription.user.email],
        'subject': f'Approve your delivery for {week.delivery_date:%d %B}',
        'html': f'''
        <div style="background:#f4efe4;padding:32px 18px;font-family:Arial,sans-serif;color:#173c2a">
          <div style="max-width:560px;margin:auto;background:#fff;padding:32px;border-top:6px solid #f4c430">
            <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px">Weekly delivery</p>
            <h1 style="font-size:28px">Approve this week</h1>
            <p>{escape(subscription.name or 'Your basket')} · GH&#8373;{week.total:.2f}</p>
            <a href="{escape(authorization_url)}" style="display:inline-block;margin-top:20px;background:#173c2a;color:#fff;padding:13px 20px;text-decoration:none;font-weight:700">Pay with mobile money</a>
            <p style="margin-top:24px;font-size:12px;color:#66756c">If you do not approve it, this week will be skipped.</p>
          </div>
        </div>''',
    })
