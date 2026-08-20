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


def send_price_change_notice(notice):
    change = notice.price_change
    subscription = notice.subscription
    manage_url = f'{settings.FRONTEND_URL}/subscriptions/manage'
    result = resend.Emails.send({
        'from': f'Legit Organic <{settings.DEFAULT_FROM_EMAIL}>',
        'to': [notice.recipient_email],
        'subject': f'An update to your {change.plan.name} weekly price',
        'html': f'''
        <!doctype html><html><body style="margin:0;background:#f4efe4;font-family:Arial,sans-serif;color:#173c2a">
          <div style="max-width:600px;margin:auto;padding:36px 18px">
            <div style="background:#173c2a;color:white;padding:30px;border-top:6px solid #f4c430">
              <p style="margin:0 0 10px;color:#f4c430;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">Plan the Week</p>
              <h1 style="margin:0;font-size:30px">Your weekly price is changing.</h1>
            </div>
            <div style="background:white;padding:30px">
              <p>Hello {escape(subscription.user.first_name or 'there')},</p>
              <p style="line-height:1.65">From <strong>{change.effective_at:%d %B %Y}</strong>, your {escape(change.plan.name)} plan will change from <strong>GH&#8373;{change.old_price:.2f}</strong> to <strong>GH&#8373;{change.new_price:.2f}</strong> per week.</p>
              <p style="line-height:1.65">{escape(change.reason)}</p>
              <p style="line-height:1.65">You can keep your plan, pause it, or cancel before the new price begins.</p>
              <a href="{escape(manage_url)}" style="display:inline-block;margin-top:16px;background:#f4c430;color:#173c2a;padding:13px 20px;text-decoration:none;font-weight:700">Manage my plan</a>
              <p style="margin-top:28px;font-size:12px;color:#66756c">No automatic charge will be made. Each weekly delivery still requires your approval.</p>
            </div>
          </div>
        </body></html>''',
    })
    if isinstance(result, dict):
        return str(result.get('id', ''))
    return str(getattr(result, 'id', '') or '')
