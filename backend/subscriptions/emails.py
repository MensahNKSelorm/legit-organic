import resend
from django.conf import settings

from users.email_design import payload


def _name(subscription):
    return subscription.user.first_name or subscription.user.email.split('@')[0]


def _send(subscription, *, subject, title, paragraphs, details=None, action=None, note=None):
    return resend.Emails.send(payload(
        to=subscription.user.email, subject=subject, stream='updates',
        eyebrow='Plan the week', title=title, greeting=_name(subscription),
        paragraphs=paragraphs, details=details, action=action, note=note,
    ))


def send_subscription_created_email(subscription):
    return _send(
        subscription, subject='Your weekly delivery plan is ready', title='Your week is set',
        paragraphs=[
            'Your weekly delivery plan has been created. Each delivery will have its own order and payment window.',
            'You stay in control. Nothing is charged automatically.',
        ],
        details=[('Plan', subscription.name or 'Weekly basket'),
                 ('Next delivery', subscription.next_delivery_date.strftime('%d %B %Y')),
                 ('Weekly total', f'GHS {subscription.weekly_total:.2f}')],
        action=('Manage weekly deliveries', f'{settings.FRONTEND_URL}/subscriptions/manage'),
        note='You can skip, pause or cancel before the relevant cutoff.',
    )


def send_subscription_action_email(subscription, action):
    copy = {
        'paused': ('Weekly deliveries paused', 'Your plan is paused', 'No new weekly order will be prepared while your plan is paused.'),
        'resumed': ('Weekly deliveries resumed', 'Your plan is active again', 'We have scheduled your next weekly delivery.'),
        'cancelled': ('Weekly deliveries cancelled', 'Your plan is cancelled', 'No further weekly orders will be created for this plan.'),
        'skipped': ('This week has been skipped', 'Your next delivery has moved', 'We skipped the current delivery and scheduled the following week.'),
    }
    subject, title, message = copy[action]
    return _send(
        subscription, subject=subject, title=title, paragraphs=[message],
        details=[('Plan', subscription.name or 'Weekly basket'),
                 ('Next delivery', subscription.next_delivery_date.strftime('%d %B %Y'))],
        action=('Manage weekly deliveries', f'{settings.FRONTEND_URL}/subscriptions/manage'),
    )


def send_renewal_ready_email(week):
    return _send(
        week.subscription, subject=f'Approve your delivery for {week.delivery_date:%d %B}',
        title='This week is ready for your approval',
        paragraphs=['Review the renewal order and pay when you are ready. We will not prepare it until payment is confirmed.'],
        details=[('Delivery date', week.delivery_date.strftime('%d %B %Y')),
                 ('Amount due', f'GHS {week.total:.2f}'),
                 ('Payment closes', week.cutoff_at.strftime('%d %B %Y, %H:%M'))],
        action=('Review and pay', f'{settings.FRONTEND_URL}/subscriptions/manage'),
        note='If the payment window closes, this delivery will expire without a charge.',
    )


def send_week_expired_email(week):
    return _send(
        week.subscription, subject=f'Delivery window closed for {week.delivery_date:%d %B}',
        title='This delivery has expired',
        paragraphs=['The payment window closed before payment was completed, so this delivery will not be prepared.'],
        details=[('Delivery date', week.delivery_date.strftime('%d %B %Y'))],
        action=('View weekly deliveries', f'{settings.FRONTEND_URL}/subscriptions/manage'),
        note='Your plan remains active unless you pause or cancel it.',
    )


def send_business_cycle_email(cycle, event):
    agreement = cycle.agreement
    profile = agreement.business
    copy = {
        'payment_due': ('Business order ready for approval', 'Your next supply order is ready',
                        'Review the order and complete payment before the payment window closes.'),
        'expired': ('Business payment window closed', 'This supply order has expired',
                    'The payment window closed before payment was completed, so this order will not be prepared.'),
        'skipped': ('Business delivery skipped', 'This delivery has been skipped',
                    'The current delivery was skipped. Your supply agreement remains available for its next cycle.'),
    }
    subject, title, message = copy[event]
    return resend.Emails.send(payload(
        to=profile.business_email, subject=f'{subject} | LO-SUPPLY-{agreement.pk}',
        stream='business', eyebrow='Business supply', title=title,
        greeting=profile.contact_person, paragraphs=[message],
        details=[('Delivery date', cycle.delivery_date.strftime('%d %B %Y')),
                 ('Amount', f'GHS {cycle.total:.2f}')],
        action=('Open business dashboard', f'{settings.FRONTEND_URL}/b2b/dashboard'),
        note='Reply to this email if the quantity, delivery date or address needs attention.',
    ))


def send_weekly_payment_link(subscription, week, authorization_url):
    return _send(
        subscription, subject=f'Complete payment for {week.delivery_date:%d %B}',
        title='Approve this week',
        paragraphs=['Your renewal order is ready. Complete payment to confirm this delivery.'],
        details=[('Delivery date', week.delivery_date.strftime('%d %B %Y')),
                 ('Amount due', f'GHS {week.total:.2f}')],
        action=('Pay securely', authorization_url),
        note='No automatic charge will be made. If you do not approve it, this week will be skipped.',
    )


def send_price_change_notice(notice):
    change = notice.price_change
    subscription = notice.subscription
    result = _send(
        subscription, subject=f'An update to your {change.plan.name} weekly price',
        title='Your weekly price is changing',
        paragraphs=[
            f'From {change.effective_at:%d %B %Y}, your {change.plan.name} plan will change from GHS {change.old_price:.2f} to GHS {change.new_price:.2f} per week.',
            change.reason,
            'You can keep your plan, pause it or cancel before the new price begins.',
        ],
        action=('Manage my plan', f'{settings.FRONTEND_URL}/subscriptions/manage'),
        note='No automatic charge will be made. Each weekly delivery still requires your approval.',
    )
    if isinstance(result, dict):
        return str(result.get('id', ''))
    return str(getattr(result, 'id', '') or '')
