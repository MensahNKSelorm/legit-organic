"""Shared, email-client-safe presentation for Legit Organic messages."""

from html import escape

from django.conf import settings


EMAIL_LOGO_URL = 'https://legitorganic.com/images/email-logo-dark.png'


def sender_for(stream):
    addresses = {
        'orders': getattr(settings, 'ORDERS_FROM_EMAIL', settings.DEFAULT_FROM_EMAIL),
        'updates': getattr(settings, 'UPDATES_FROM_EMAIL', settings.DEFAULT_FROM_EMAIL),
        'business': getattr(settings, 'BUSINESS_FROM_EMAIL', settings.DEFAULT_FROM_EMAIL),
    }
    return f'Legit Organic <{addresses.get(stream, settings.DEFAULT_FROM_EMAIL)}>'


def reply_to_for(stream):
    if stream == 'business':
        return getattr(settings, 'BUSINESS_REPLY_TO_EMAIL', 'operations@legitorganic.com')
    return getattr(settings, 'SUPPORT_REPLY_TO_EMAIL', 'support@legitorganic.com')


def _details_table(details):
    if not details:
        return ''
    rows = ''.join(
        '<tr>'
        f'<td style="padding:7px 0;color:#6b746e;font-size:13px;vertical-align:top">{escape(str(label))}</td>'
        f'<td style="padding:7px 0;color:#173c2a;font-size:13px;font-weight:700;text-align:right;vertical-align:top">{escape(str(value))}</td>'
        '</tr>'
        for label, value in details
        if value not in (None, '')
    )
    return f'<table role="presentation" style="width:100%;border-collapse:collapse;margin:22px 0">{rows}</table>'


def _items_table(items, total=None):
    if not items:
        return ''
    rows = ''.join(
        '<tr>'
        f'<td style="padding:10px 0;border-bottom:1px solid #e5e9e5;color:#263a2e">{escape(str(item[0]))}</td>'
        f'<td style="padding:10px 8px;border-bottom:1px solid #e5e9e5;text-align:center;color:#263a2e">{escape(str(item[1]))}</td>'
        f'<td style="padding:10px 0;border-bottom:1px solid #e5e9e5;text-align:right;color:#263a2e">GH&#8373;{escape(str(item[2]))}</td>'
        '</tr>'
        for item in items
    )
    total_row = ''
    if total is not None:
        total_row = (
            '<tr><td colspan="2" style="padding-top:14px;font-weight:700;color:#173c2a">Total</td>'
            f'<td style="padding-top:14px;text-align:right;font-size:17px;font-weight:800;color:#173c2a">GH&#8373;{escape(str(total))}</td></tr>'
        )
    return (
        '<h2 style="margin:26px 0 8px;font-size:16px;color:#173c2a">Order summary</h2>'
        '<table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px">'
        '<tr><th style="padding-bottom:6px;text-align:left;color:#6b746e;font-size:11px;text-transform:uppercase">Produce</th>'
        '<th style="padding-bottom:6px;text-align:center;color:#6b746e;font-size:11px;text-transform:uppercase">Qty</th>'
        '<th style="padding-bottom:6px;text-align:right;color:#6b746e;font-size:11px;text-transform:uppercase">Amount</th></tr>'
        f'{rows}{total_row}</table>'
    )


def render_email(*, eyebrow, title, greeting, paragraphs, details=None, items=None,
                 total=None, action=None, note=None):
    paragraph_html = ''.join(
        f'<p style="margin:0 0 16px;color:#34483c;font-size:15px;line-height:1.65">{escape(str(p))}</p>'
        for p in paragraphs if p
    )
    action_html = ''
    if action:
        label, url = action
        action_html = (
            '<table role="presentation" style="margin:26px 0 6px"><tr><td bgcolor="#f4c430">'
            f'<a href="{escape(str(url), quote=True)}" style="display:inline-block;padding:13px 21px;color:#173c2a;text-decoration:none;font-weight:800;font-size:14px">{escape(str(label))}</a>'
            '</td></tr></table>'
        )
    note_html = ''
    if note:
        note_html = f'<div style="margin-top:24px;padding:15px 17px;background:#eef5ee;border-left:4px solid #f4c430;color:#43584a;font-size:13px;line-height:1.55">{escape(str(note))}</div>'
    return f'''<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"></head>
<body style="margin:0;background:#f3efe6;font-family:Arial,Helvetica,sans-serif;color:#173c2a">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3efe6"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border-collapse:collapse">
<tr><td style="padding:25px 30px;background:#173c2a;border-top:6px solid #f4c430">
<img src="{EMAIL_LOGO_URL}" width="150" alt="Legit Organic" style="display:block;width:150px;max-width:100%;height:auto;margin-bottom:24px">
<div style="color:#f4c430;font-size:11px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase">{escape(str(eyebrow))}</div>
<h1 style="margin:8px 0 0;color:#ffffff;font-size:28px;line-height:1.2">{escape(str(title))}</h1>
</td></tr>
<tr><td style="padding:30px">
<p style="margin:0 0 18px;color:#173c2a;font-size:15px">Hello {escape(str(greeting))},</p>
{paragraph_html}{_details_table(details)}{_items_table(items, total)}{action_html}{note_html}
</td></tr>
<tr><td style="padding:20px 30px;background:#f8f6f0;color:#6b746e;font-size:11px;line-height:1.6">
Legit Organic Limited &middot; Accra, Ghana<br>
Fresh produce supplied with care.<br>
<a href="{escape(settings.FRONTEND_URL, quote=True)}/privacy-policy" style="color:#45614f">Privacy</a> &middot;
<a href="{escape(settings.FRONTEND_URL, quote=True)}/terms-of-service" style="color:#45614f">Terms</a>
</td></tr></table></td></tr></table></body></html>'''


def plain_text(*, title, greeting, paragraphs, details=None, items=None, total=None,
               action=None, note=None):
    lines = [title, '', f'Hello {greeting},', '']
    lines.extend(str(p) for p in paragraphs if p)
    if details:
        lines.extend(['', *(f'{label}: {value}' for label, value in details if value not in (None, ''))])
    if items:
        lines.extend(['', 'Order summary'])
        lines.extend(f'{name} x {qty}: GHS {amount}' for name, qty, amount in items)
    if total is not None:
        lines.append(f'Total: GHS {total}')
    if action:
        lines.extend(['', f'{action[0]}: {action[1]}'])
    if note:
        lines.extend(['', str(note)])
    lines.extend(['', 'Legit Organic Limited', 'Accra, Ghana'])
    return '\n'.join(lines)


def payload(*, to, subject, stream, eyebrow, title, greeting, paragraphs,
            details=None, items=None, total=None, action=None, note=None,
            reply_to=None):
    content = dict(
        title=title, greeting=greeting, paragraphs=paragraphs, details=details,
        items=items, total=total, action=action, note=note,
    )
    return {
        'from': sender_for(stream),
        'to': [to],
        'reply_to': reply_to or reply_to_for(stream),
        'subject': subject,
        'html': render_email(eyebrow=eyebrow, **content),
        'text': plain_text(**content),
    }
