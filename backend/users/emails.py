import resend
from django.conf import settings
from django.utils.html import escape

EMAIL_LOGO_URL = 'https://legitorganic.com/images/email-logo.png'


def send_owner_order_report(order, event):
    """Send a concise internal report for an important order milestone."""
    recipient = settings.ORDER_REPORT_EMAIL
    if not recipient:
        return

    customer_name = (
        f'{order.user.first_name} {order.user.last_name}'.strip()
        if order.user else order.guest_name
    ) or 'Guest customer'
    customer_email = order.user.email if order.user else order.guest_email
    customer_phone = order.guest_phone or (
        getattr(order.user, 'phone_number', '') if order.user else ''
    )
    rows = ''.join(
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #dce7df;">'
        f'{escape(item.product.name if item.product else "Deleted product")}</td>'
        f'<td style="padding:8px 0;border-bottom:1px solid #dce7df;text-align:center;">'
        f'{item.quantity}</td>'
        f'<td style="padding:8px 0;border-bottom:1px solid #dce7df;text-align:right;">'
        f'GH&#8373;{item.subtotal:.2f}</td></tr>'
        for item in order.items.all()
    )
    event_copy = {
        'whatsapp_submitted': (
            'New WhatsApp order',
            'Awaiting manual payment confirmation',
            'Contact the customer if needed. Confirm payment before processing this order.',
            '#fff4cf',
        ),
        'payment_success': (
            'Payment received',
            'Paid',
            'Payment has been verified. This order is ready for processing.',
            '#eff6ef',
        ),
        'delivered': (
            'Order delivered',
            'Delivered',
            'Delivery has been recorded as complete.',
            '#eff6ef',
        ),
    }
    heading, payment_label, next_action, notice_colour = event_copy[event]
    subject = f'{heading}: {order.reference}'

    resend.Emails.send({
        'from': f'Legit Organic <{settings.DEFAULT_FROM_EMAIL}>',
        'to': [recipient],
        'subject': subject,
        'html': f"""
        <!doctype html><html><body style="margin:0;background:#f5f1e8;font-family:Arial,sans-serif;color:#173b2b;">
          <div style="max-width:680px;margin:0 auto;padding:32px 18px;">
            <div style="background:#0d3b2a;color:#fff;padding:30px;border-top:6px solid #f4c430;">
              <p style="margin:0 0 10px;color:#f4c430;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Order report</p>
              <h1 style="margin:0;font-size:30px;">{heading}</h1>
              <p style="margin:10px 0 0;color:#d7e5d9;">{escape(order.reference)}</p>
            </div>
            <div style="background:#fff;padding:30px;">
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <tr><td style="padding:6px 0;color:#66756c;">Customer</td><td style="text-align:right;font-weight:700;">{escape(customer_name)}</td></tr>
                <tr><td style="padding:6px 0;color:#66756c;">Email</td><td style="text-align:right;">{escape(customer_email or 'Not supplied')}</td></tr>
                <tr><td style="padding:6px 0;color:#66756c;">Phone</td><td style="text-align:right;">{escape(customer_phone or 'Not supplied')}</td></tr>
                <tr><td style="padding:6px 0;color:#66756c;">Channel</td><td style="text-align:right;">{escape(order.get_order_source_display())}</td></tr>
                <tr><td style="padding:6px 0;color:#66756c;">Payment</td><td style="text-align:right;font-weight:700;">{escape(payment_label)}</td></tr>
                <tr><td style="padding:6px 0;color:#66756c;">Delivery</td><td style="text-align:right;max-width:360px;">{escape(order.delivery_address or 'Not supplied')}</td></tr>
              </table>
              <div style="margin-top:22px;padding:16px;background:{notice_colour};font-size:14px;line-height:1.5;">
                <strong>Next step:</strong> {escape(next_action)}
              </div>
              <h2 style="font-size:17px;margin:26px 0 8px;">Order contents</h2>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">{rows}</table>
              <div style="margin-top:22px;padding:16px;background:#eff6ef;font-size:18px;font-weight:700;">
                Total: GH&#8373;{order.final_amount:.2f}
              </div>
              <a href="{settings.DASHBOARD_URL}/admin/orders/order/{order.pk}/change/" style="display:inline-block;margin-top:24px;background:#f4c430;color:#0d3b2a;padding:13px 20px;text-decoration:none;font-weight:700;">Open order</a>
            </div>
          </div>
        </body></html>
        """,
    })


def send_welcome_email(user):
    resend.Emails.send({
        "from": f"Legit Organic <{settings.DEFAULT_FROM_EMAIL}>",
        "to": [user.email],
        "subject": "Welcome to Legit Organic!",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Inter', Arial, sans-serif;
                     background-color: #FAF7F0; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <div style="text-align:center;margin-bottom:32px;">
              <img
                src="{EMAIL_LOGO_URL}"
                alt="Legit Organic"
                style="height:50px;width:auto;"
              />
            </div>

            <div style="background: white; border-radius: 12px;
                        padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color: #0D3B2A; font-size: 24px; margin-top: 0;">
                Welcome, {escape(user.first_name or 'there')}
              </h2>
              <p style="color: #333333; line-height: 1.6;">
                Thank you for joining Legit Organic. You're now part of a
                community that believes in clean, honest food, supplied by
                verified Ghanaian farmers to your table.
              </p>
              <p style="color: #333333; line-height: 1.6;">
                Here's what you can do on your account:
              </p>
              <ul style="color: #333333; line-height: 2;">
                <li>Browse and order fresh organic produce</li>
                <li>Build and save your own custom recipes</li>
                <li>Track your orders and delivery</li>
              </ul>

              <div style="text-align: center; margin: 32px 0;">
                <a href="{settings.FRONTEND_URL}/products"
                   style="background-color: #F4C430; color: #0D3B2A;
                          padding: 14px 32px; border-radius: 8px;
                          text-decoration: none; font-weight: 600;
                          font-size: 16px;">
                  Shop Fresh Produce
                </a>
              </div>

              <p style="color: #333333; line-height: 1.6;">
                If you have any questions, reply to this email or contact us at
                <a href="mailto:hello@legitorganic.com"
                   style="color: #2E7D32;">hello@legitorganic.com</a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 32px;
                        color: #888; font-size: 12px;">
              <p>Legit Organic Limited · Accra, Ghana</p>
              <p>
                <a href="{settings.FRONTEND_URL}/privacy-policy"
                   style="color: #888;">Privacy Policy</a> ·
                <a href="{settings.FRONTEND_URL}/terms-of-service"
                   style="color: #888;">Terms of Service</a>
              </p>
            </div>

          </div>
        </body>
        </html>
        """,
    })


def send_order_confirmation_email(user, order):
    items_html = ''.join([
        f"""
        <tr>
          <td style="padding: 8px 0; color: #333333; border-bottom: 1px solid #F5F0E6;">
            {item.product.name if item.product else item.product_name}
          </td>
          <td style="padding: 8px 0; color: #333333; border-bottom: 1px solid #F5F0E6; text-align: center;">
            {item.quantity}
          </td>
          <td style="padding: 8px 0; color: #333333; border-bottom: 1px solid #F5F0E6; text-align: right;">
            GH₵{item.unit_price}
          </td>
        </tr>
        """
        for item in order.items.all()
    ])

    discount_row = ''
    if order.discount_amount and float(order.discount_amount) > 0:
        discount_row = f"""
        <tr>
          <td colspan="2" style="padding: 8px 0; color: #2E7D32; font-weight: 600;">
            Discount {f'({order.promo_code.code})' if order.promo_code else ''}
          </td>
          <td style="padding: 8px 0; color: #2E7D32; font-weight: 600; text-align: right;">
            -GH₵{order.discount_amount}
          </td>
        </tr>
        """

    final_amount = float(order.total_amount) - float(order.discount_amount or 0)

    resend.Emails.send({
        "from": f"Legit Organic <{settings.DEFAULT_FROM_EMAIL}>",
        "to": [user.email],
        "subject": f"Order confirmed: {order.reference}",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Inter', Arial, sans-serif;
                     background-color: #FAF7F0; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <div style="text-align:center;margin-bottom:32px;">
              <img
                src="{EMAIL_LOGO_URL}"
                alt="Legit Organic"
                style="height:50px;width:auto;"
              />
            </div>

            <div style="background: white; border-radius: 12px;
                        padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

              <div style="text-align:left;margin-bottom:28px;border-left:5px solid #F4C430;padding-left:18px;">
                <p style="margin:0 0 8px;color:#2E7D32;font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">
                  Order received
                </p>
                <h2 style="color: #0D3B2A; font-size: 24px; margin: 0;">
                  Your order is confirmed
                </h2>
                <p style="color:#68766E;margin:8px 0 0;font-size:13px;">
                  Reference: <strong>{order.reference}</strong>
                </p>
              </div>

              <p style="color: #333333; line-height: 1.6;">
                Hi {user.first_name or user.email}, thank you for your order!
                We're preparing your fresh organic produce and will deliver it
                to you within 1-3 business days.
              </p>

              <h3 style="color: #0D3B2A; border-bottom: 2px solid #F4C430;
                          padding-bottom: 8px;">
                Order Summary
              </h3>

              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="text-align: left; color: #666; font-size: 12px;
                               padding-bottom: 8px; text-transform: uppercase;">
                      Product
                    </th>
                    <th style="text-align: center; color: #666; font-size: 12px;
                               padding-bottom: 8px; text-transform: uppercase;">
                      Qty
                    </th>
                    <th style="text-align: right; color: #666; font-size: 12px;
                               padding-bottom: 8px; text-transform: uppercase;">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items_html}
                  {discount_row}
                  <tr>
                    <td colspan="2" style="padding: 12px 0 0; font-weight: 700;
                                           color: #0D3B2A; font-size: 16px;">
                      Total Paid
                    </td>
                    <td style="padding: 12px 0 0; font-weight: 700;
                               color: #0D3B2A; font-size: 16px; text-align: right;">
                      GH₵{final_amount:.2f}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style="margin-top: 24px; padding: 16px;
                          background: #F0FFF4; border-radius: 8px;
                          border-left: 4px solid #2E7D32;">
                <p style="margin: 0; color: #0D3B2A; font-size: 14px;">
                  <strong>Delivery Address:</strong><br/>
                  {order.delivery_address}
                </p>
              </div>

              <div style="text-align: center; margin-top: 32px;">
                <a href="{settings.FRONTEND_URL}/profile"
                   style="background-color: #F4C430; color: #0D3B2A;
                          padding: 14px 32px; border-radius: 8px;
                          text-decoration: none; font-weight: 600;
                          font-size: 16px;">
                  View Order History
                </a>
              </div>

              <p style="color: #888; font-size: 14px; margin-top: 24px;
                        line-height: 1.6;">
                Questions? Contact us at
                <a href="mailto:hello@legitorganic.com"
                   style="color: #2E7D32;">hello@legitorganic.com</a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 32px;
                        color: #888; font-size: 12px;">
              <p>Legit Organic Limited · Accra, Ghana</p>
            </div>

          </div>
        </body>
        </html>
        """,
    })


def send_order_status_email(order):
    """Send email when order status changes. Works for both
    registered users and guests (if they have an email)."""

    if order.user:
        recipient_email = order.user.email
        customer_name = order.user.first_name or order.user.email
    elif order.guest_email:
        recipient_email = order.guest_email
        customer_name = order.guest_name or 'Valued Customer'
    else:
        return  # No email to send to

    STATUS_CONFIG = {
        'paid': {
            'subject': f'Payment confirmed: {order.reference}',
            'label': 'Payment received',
            'title': 'Payment Confirmed!',
            'color': '#2196F3',
            'message': f'Great news! We have received your payment for order {order.reference}. We are now preparing your organic produce for delivery.',
            'next_step': 'Your order is being carefully prepared by our team.',
        },
        'processing': {
            'subject': f'We are preparing order {order.reference}',
            'label': 'In preparation',
            'title': 'Your Order is Being Prepared',
            'color': '#FF9800',
            'message': f'Your order {order.reference} is currently being processed. Our team is carefully selecting and packaging your fresh organic produce.',
            'next_step': 'We will notify you once your order is on its way.',
        },
        'ready_for_dispatch': {
            'subject': f'Order packed: {order.reference}',
            'label': 'Packed',
            'title': 'Your Order is Packed',
            'color': '#D4A800',
            'message': f'Your order {order.reference} has been packed and is waiting for dispatch.',
            'next_step': 'We will send your delivery PIN when the order leaves with the driver.',
        },
        'out_for_delivery': {
            'subject': f'Out for delivery: {order.reference}',
            'label': 'With your driver',
            'title': 'Your Order is On Its Way',
            'color': '#315A80',
            'message': (
                f'Your order {order.reference} is out for delivery. Your delivery PIN is '
                f'<strong>{escape(getattr(order, "_delivery_pin_plaintext", ""))}</strong>. '
                'Share it with the driver only after you receive your order.'
            ),
            'next_step': 'Please ensure someone is available to receive the delivery.',
        },
        'shipped': {
            'subject': f'Order {order.reference} is on its way',
            'label': 'Dispatched',
            'title': 'Your Order is On Its Way!',
            'color': '#9C27B0',
            'message': f'Your order {order.reference} has been dispatched and is on its way to you. Please ensure someone is available to receive the delivery.',
            'next_step': 'Expected delivery within 1–3 business days.',
        },
        'delivered': {
            'subject': f'Order delivered: {order.reference}',
            'label': 'Completed',
            'title': 'Order Delivered!',
            'color': '#2E7D32',
            'message': f'Your order {order.reference} has been successfully delivered. We hope you enjoy your fresh organic produce from Legit Organic!',
            'next_step': 'Thank you for choosing Legit Organic. We look forward to serving you again!',
        },
        'cancelled': {
            'subject': f'Order cancelled: {order.reference}',
            'label': 'Cancelled',
            'title': 'Order Cancelled',
            'color': '#F44336',
            'message': f'Your order {order.reference} has been cancelled. If you did not request this cancellation or have any questions, please contact us immediately.',
            'next_step': 'Contact us at hello@legitorganic.com if you need assistance.',
        },
    }

    config = STATUS_CONFIG.get(order.status)
    if not config:
        return  # No email for this status

    items_html = ''.join([
        f"""
        <tr>
          <td style="padding:8px 0;color:#333;border-bottom:1px solid #f5f0e6;">
            {item.product.name if item.product else 'Product'}
          </td>
          <td style="padding:8px 0;color:#333;border-bottom:1px solid #f5f0e6;text-align:center;">
            {item.quantity}
          </td>
          <td style="padding:8px 0;color:#333;border-bottom:1px solid #f5f0e6;text-align:right;">
            GH₵{item.unit_price}
          </td>
        </tr>
        """
        for item in order.items.all()
    ])

    final_amount = float(order.total_amount) - float(order.discount_amount or 0)

    resend.Emails.send({
        "from": f"Legit Organic <{settings.DEFAULT_FROM_EMAIL}>",
        "to": [recipient_email],
        "subject": config['subject'],
        "html": f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:'Inter',Arial,sans-serif;
                     background-color:#FAF7F0;margin:0;padding:0;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

            <div style="text-align:center;margin-bottom:32px;">
              <img
                src="{EMAIL_LOGO_URL}"
                alt="Legit Organic"
                style="height:50px;width:auto;"
              />
            </div>

            <div style="background:white;border-radius:12px;
                        padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <div style="text-align:left;margin-bottom:28px;border-left:5px solid {config['color']};padding-left:18px;">
                <p style="margin:0 0 8px;color:{config['color']};font-size:11px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;">
                  {config['label']}
                </p>
                <h2 style="color:#0D3B2A;font-size:26px;line-height:1.2;margin:0;">
                  {config['title']}
                </h2>
                <p style="color:#68766E;margin:8px 0 0;font-size:13px;">
                  Order: <strong style="color:#0D3B2A;">{order.reference}</strong>
                </p>
              </div>

              <p style="color:#333;line-height:1.6;margin-bottom:16px;">
                Hi {customer_name},
              </p>
              <p style="color:#333;line-height:1.6;margin-bottom:24px;">
                {config['message']}
              </p>

              <div style="background:#F0FFF4;border-left:4px solid {config['color']};
                          padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
                <p style="margin:0;color:#0D3B2A;font-size:14px;">
                  <strong>What's next:</strong> {config['next_step']}
                </p>
              </div>

              <h3 style="color:#0D3B2A;border-bottom:2px solid #F4C430;
                          padding-bottom:8px;font-size:16px;">
                Order Summary
              </h3>

              <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                <thead>
                  <tr>
                    <th style="text-align:left;color:#666;font-size:11px;
                               padding-bottom:8px;text-transform:uppercase;">Product</th>
                    <th style="text-align:center;color:#666;font-size:11px;
                               padding-bottom:8px;text-transform:uppercase;">Qty</th>
                    <th style="text-align:right;color:#666;font-size:11px;
                               padding-bottom:8px;text-transform:uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>{items_html}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding:12px 0 0;font-weight:700;
                                           color:#0D3B2A;font-size:16px;">
                      Total
                    </td>
                    <td style="padding:12px 0 0;font-weight:700;
                               color:#0D3B2A;font-size:16px;text-align:right;">
                      GH₵{final_amount:.2f}
                    </td>
                  </tr>
                </tfoot>
              </table>

              <div style="margin-top:16px;padding:16px;background:#FAF7F0;
                          border-radius:8px;">
                <p style="margin:0;color:#0D3B2A;font-size:13px;">
                  <strong>Delivery address</strong><br/>
                  {order.delivery_address}
                </p>
              </div>

              <div style="text-align:center;margin-top:32px;">
                <a href="{settings.FRONTEND_URL}/profile"
                   style="background-color:#F4C430;color:#0D3B2A;
                          padding:14px 32px;border-radius:8px;
                          text-decoration:none;font-weight:600;
                          font-size:16px;">
                  View Order Status
                </a>
              </div>

              <p style="color:#888;font-size:13px;margin-top:24px;
                        line-height:1.6;text-align:center;">
                Questions? Contact us at
                <a href="mailto:hello@legitorganic.com"
                   style="color:#2E7D32;">hello@legitorganic.com</a>
                or WhatsApp us at +233 539 569 260
              </p>
            </div>

            <div style="text-align:center;margin-top:32px;
                        color:#888;font-size:12px;">
              <p>Legit Organic Limited · Accra, Ghana</p>
              <p>
                <a href="{settings.FRONTEND_URL}/privacy-policy"
                   style="color:#888;">Privacy Policy</a> ·
                <a href="{settings.FRONTEND_URL}/terms-of-service"
                   style="color:#888;">Terms of Service</a>
              </p>
            </div>

          </div>
        </body>
        </html>
        """,
    })


def send_b2b_approval_email(profile, uid=None, token=None):
    setup_link = ''
    if uid and token:
        setup_link = f'{settings.FRONTEND_URL}/b2b/setup-password?uid={uid}&token={token}'

    setup_button = ''
    if setup_link:
        setup_button = f"""
        <div style="text-align:center;margin:32px 0;">
          <a href="{setup_link}"
             style="background-color:#F4C430;color:#0D3B2A;padding:14px 32px;
                    border-radius:8px;text-decoration:none;font-weight:600;
                    font-size:16px;display:inline-block;">
            Set Up Your Password &rarr;
          </a>
          <p style="color:#888;font-size:12px;margin-top:12px;">This link expires in 48 hours</p>
        </div>
        """
    else:
        setup_button = f"""
        <div style="text-align:center;margin:32px 0;">
          <a href="{settings.FRONTEND_URL}/b2b/dashboard"
             style="background-color:#F4C430;color:#0D3B2A;padding:14px 32px;
                    border-radius:8px;text-decoration:none;font-weight:600;
                    font-size:16px;display:inline-block;">
            View My B2B Dashboard &rarr;
          </a>
        </div>
        """

    resend.Emails.send({
        "from": f"Legit Organic <{settings.DEFAULT_FROM_EMAIL}>",
        "to": [profile.business_email],
        "subject": f"Welcome to Legit Organic B2B, {profile.company_name}",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:'Inter',Arial,sans-serif;
                     background-color:#FAF7F0;margin:0;padding:0;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

            <div style="text-align:center;margin-bottom:32px;">
              <img src="{EMAIL_LOGO_URL}"
                   alt="Legit Organic" style="height:50px;width:auto;" />
            </div>

            <div style="background:white;border-radius:12px;
                        padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <div style="text-align:center;margin-bottom:24px;">
                <div style="font-size:48px;margin-bottom:12px;">&#127881;</div>
                <h2 style="color:#2E7D32;font-size:24px;margin:0;">
                  You&rsquo;re Approved!
                </h2>
                <p style="color:#666;margin:8px 0 0;font-size:14px;">
                  Welcome to the Legit Organic B2B Program
                </p>
              </div>

              <p style="color:#333;line-height:1.6;">
                Dear {profile.contact_person},
              </p>
              <p style="color:#333;line-height:1.6;">
                Congratulations! Your B2B application for
                <strong>{profile.company_name}</strong> has been approved.
                You now have access to bulk pricing and institutional ordering
                on Legit Organic.
              </p>

              <div style="background:#F0FFF4;border-left:4px solid #2E7D32;
                          padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
                <p style="margin:0;color:#0D3B2A;font-weight:600;">Your Benefits:</p>
                <ul style="color:#333;margin:8px 0 0;padding-left:20px;">
                  <li>Automatic bulk discounts on all orders</li>
                  <li>The more you order, the more you save</li>
                  <li>Dedicated support via WhatsApp</li>
                  <li>Invoice generation for all orders</li>
                </ul>
              </div>

              {setup_button}

              <p style="color:#888;font-size:13px;margin-top:24px;
                        line-height:1.6;text-align:center;">
                Questions? Contact us at
                <a href="mailto:hello@legitorganic.com"
                   style="color:#2E7D32;">hello@legitorganic.com</a>
                or WhatsApp us at +233 539 569 260
              </p>
            </div>

            <div style="text-align:center;margin-top:32px;color:#888;font-size:12px;">
              <p>Legit Organic Limited &middot; Accra, Ghana</p>
            </div>

          </div>
        </body>
        </html>
        """,
    })


def send_b2b_rejection_email(profile):
    reason_block = ''
    if profile.rejection_reason:
        reason_block = f"""
        <div style="background:#FFF5F5;border-left:4px solid #F44336;
                    padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
          <p style="margin:0;color:#C62828;font-size:14px;font-weight:600;">
            Reason:
          </p>
          <p style="margin:8px 0 0;color:#333;font-size:14px;">
            {profile.rejection_reason}
          </p>
        </div>
        """

    resend.Emails.send({
        "from": f"Legit Organic <{settings.DEFAULT_FROM_EMAIL}>",
        "to": [profile.business_email],
        "subject": "An update on your Legit Organic B2B application",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:'Inter',Arial,sans-serif;
                     background-color:#FAF7F0;margin:0;padding:0;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

            <div style="text-align:center;margin-bottom:32px;">
              <img src="{EMAIL_LOGO_URL}"
                   alt="Legit Organic" style="height:50px;width:auto;" />
            </div>

            <div style="background:white;border-radius:12px;
                        padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color:#0D3B2A;font-size:24px;margin-top:0;">
                B2B Application Update
              </h2>

              <p style="color:#333;line-height:1.6;">
                Dear {profile.contact_person},
              </p>
              <p style="color:#333;line-height:1.6;">
                Thank you for applying for a B2B account at Legit Organic for
                <strong>{profile.company_name}</strong>.
                Unfortunately, we are unable to approve your application at this time.
              </p>

              {reason_block}

              <p style="color:#333;line-height:1.6;">
                You are welcome to reapply once you have addressed the points above,
                or contact us directly to discuss your application.
              </p>

              <p style="color:#888;font-size:14px;margin-top:24px;line-height:1.6;">
                Questions? Reach us at
                <a href="mailto:hello@legitorganic.com"
                   style="color:#2E7D32;">hello@legitorganic.com</a>
                or WhatsApp +233 539 569 260.
              </p>
            </div>

            <div style="text-align:center;margin-top:32px;color:#888;font-size:12px;">
              <p>Legit Organic Limited &middot; Accra, Ghana</p>
            </div>

          </div>
        </body>
        </html>
        """,
    })


def send_b2b_review_update_email(profile, status, note):
    copy = {
        'changes_requested': (
            'We need a little more information',
            'Please review the note below and reply to this email with the requested information.',
        ),
        'suspended': (
            'Your business account has been suspended',
            'Ordering access is temporarily unavailable. Contact our team if you need clarification.',
        ),
    }
    if status not in copy:
        return None
    heading, message = copy[status]
    return resend.Emails.send({
        'from': f'Legit Organic <{settings.DEFAULT_FROM_EMAIL}>',
        'to': [profile.business_email],
        'subject': f'{heading} | Legit Organic',
        'html': f'''
        <!doctype html><html><body style="margin:0;background:#f4efe4;font-family:Arial,sans-serif;color:#173c2a">
          <div style="max-width:600px;margin:auto;padding:36px 18px">
            <div style="background:#173c2a;color:white;padding:30px;border-top:6px solid #f4c430">
              <p style="margin:0 0 10px;color:#f4c430;font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">Business account</p>
              <h1 style="margin:0;font-size:30px">{escape(heading)}.</h1>
            </div>
            <div style="background:white;padding:30px">
              <p>Dear {escape(profile.contact_person)},</p>
              <p style="line-height:1.65">{escape(message)}</p>
              <div style="margin:22px 0;padding:18px;background:#f7f2e8;border-left:4px solid #f4c430;line-height:1.6">{escape(note)}</div>
              <p style="font-size:13px;color:#66756c">Reference: {escape(profile.company_name)}</p>
            </div>
          </div>
        </body></html>''',
    })


def send_verification_email(user, token):
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    resend.Emails.send({
        "from": f"Legit Organic <{settings.DEFAULT_FROM_EMAIL}>",
        "to": [user.email],
        "subject": "Verify your Legit Organic email address",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Inter', Arial, sans-serif;
                     background-color: #FAF7F0; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <div style="text-align:center;margin-bottom:32px;">
              <img
                src="{EMAIL_LOGO_URL}"
                alt="Legit Organic"
                style="height:50px;width:auto;"
              />
            </div>

            <div style="background: white; border-radius: 12px;
                        padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color: #0D3B2A; font-size: 24px; margin-top: 0;">
                Verify your email address
              </h2>
              <p style="color: #333333; line-height: 1.6;">
                Hi {user.first_name}, please verify your email address
                by clicking the button below. This link expires in 24 hours.
              </p>

              <div style="text-align: center; margin: 32px 0;">
                <a href="{verification_url}"
                   style="background-color: #0D3B2A; color: white;
                          padding: 14px 32px; border-radius: 8px;
                          text-decoration: none; font-weight: 600;
                          font-size: 16px;">
                  Verify Email Address
                </a>
              </div>

              <p style="color: #888; font-size: 14px; line-height: 1.6;">
                If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="color: #888; font-size: 14px;">
                Or copy this link:
                <a href="{verification_url}" style="color: #2E7D32;">
                  {verification_url}
                </a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 32px;
                        color: #888; font-size: 12px;">
              <p>Legit Organic Limited · Accra, Ghana</p>
            </div>

          </div>
        </body>
        </html>
        """,
    })


def send_staff_invitation_email(invitation, token):
    setup_url = f'{settings.DASHBOARD_URL}/staff/setup/{token}/'
    first_name = escape(invitation.first_name)
    company_email = escape(invitation.company_email)
    role = escape(invitation.role)
    safe_url = escape(setup_url)
    resend.Emails.send({
        'from': f'Legit Organic <{settings.DEFAULT_FROM_EMAIL}>',
        'to': [invitation.delivery_email],
        'subject': 'Set up your Legit Organic staff account',
        'html': f"""
        <!DOCTYPE html>
        <html>
        <body style="margin:0;background:#111827;color:#F8F4E9;font-family:Arial,sans-serif;">
          <div style="max-width:620px;margin:0 auto;padding:40px 20px;">
            <div style="border-top:6px solid #F4C430;background:#0D3B2A;padding:42px;">
              <p style="margin:0 0 22px;color:#F4C430;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
                Staff invitation
              </p>
              <h1 style="margin:0 0 22px;font-size:38px;line-height:1.05;font-weight:500;">
                Welcome to the control room, {first_name}.
              </h1>
              <p style="margin:0 0 10px;color:#D7E5D9;line-height:1.6;">
                Your company login is <strong style="color:#fff;">{company_email}</strong>.
              </p>
              <p style="margin:0 0 28px;color:#D7E5D9;line-height:1.6;">
                Role: <strong style="color:#fff;">{role}</strong>
              </p>
              <a href="{safe_url}" style="display:inline-block;background:#F4C430;color:#0D3B2A;padding:15px 24px;text-decoration:none;font-weight:700;">
                Create your password
              </a>
              <p style="margin:26px 0 0;color:#AEBCAF;font-size:13px;line-height:1.6;">
                This private link expires in 48 hours and works once. If you were not expecting it, ignore this email.
              </p>
            </div>
            <p style="margin:18px 0 0;color:#7F8D82;font-size:12px;text-align:center;">
              Legit Organic Limited · Accra, Ghana
            </p>
          </div>
        </body>
        </html>
        """,
    })
