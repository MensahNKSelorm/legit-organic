import resend
from django.conf import settings


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
                src="https://api.legitorganic.com/static/images/logo-lightmode.svg"
                alt="Legit Organic"
                style="height:50px;width:auto;"
              />
            </div>

            <div style="background: white; border-radius: 12px;
                        padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color: #0D3B2A; font-size: 24px; margin-top: 0;">
                Welcome, {user.first_name}! 🌿
              </h2>
              <p style="color: #333333; line-height: 1.6;">
                Thank you for joining Legit Organic. You're now part of a
                community that believes in clean, honest food — straight from
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
        "subject": f"Order Confirmed — {order.reference}",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: 'Inter', Arial, sans-serif;
                     background-color: #FAF7F0; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">

            <div style="text-align:center;margin-bottom:32px;">
              <img
                src="https://api.legitorganic.com/static/images/logo-lightmode.svg"
                alt="Legit Organic"
                style="height:50px;width:auto;"
              />
            </div>

            <div style="background: white; border-radius: 12px;
                        padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">

              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 60px; height: 60px; background: #F0FFF4;
                            border-radius: 50%; display: inline-flex;
                            align-items: center; justify-content: center;
                            font-size: 28px; margin-bottom: 12px;">
                  ✅
                </div>
                <h2 style="color: #0D3B2A; font-size: 24px; margin: 0;">
                  Order Confirmed!
                </h2>
                <p style="color: #666; margin: 8px 0 0;">
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
            'subject': f'Payment Confirmed — {order.reference}',
            'emoji': '✅',
            'title': 'Payment Confirmed!',
            'color': '#2196F3',
            'message': f'Great news! We have received your payment for order {order.reference}. We are now preparing your organic produce for delivery.',
            'next_step': 'Your order is being carefully prepared by our team.',
        },
        'processing': {
            'subject': f'Order Being Prepared — {order.reference}',
            'emoji': '\U0001f33f',
            'title': 'Your Order is Being Prepared',
            'color': '#FF9800',
            'message': f'Your order {order.reference} is currently being processed. Our team is carefully selecting and packaging your fresh organic produce.',
            'next_step': 'We will notify you once your order is on its way.',
        },
        'shipped': {
            'subject': f'Order On Its Way — {order.reference}',
            'emoji': '\U0001f69a',
            'title': 'Your Order is On Its Way!',
            'color': '#9C27B0',
            'message': f'Your order {order.reference} has been dispatched and is on its way to you. Please ensure someone is available to receive the delivery.',
            'next_step': 'Expected delivery within 1–3 business days.',
        },
        'delivered': {
            'subject': f'Order Delivered — {order.reference}',
            'emoji': '\U0001f389',
            'title': 'Order Delivered!',
            'color': '#2E7D32',
            'message': f'Your order {order.reference} has been successfully delivered. We hope you enjoy your fresh organic produce from Legit Organic!',
            'next_step': 'Thank you for choosing Legit Organic. We look forward to serving you again!',
        },
        'cancelled': {
            'subject': f'Order Cancelled — {order.reference}',
            'emoji': '❌',
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
                src="https://api.legitorganic.com/static/images/logo-lightmode.svg"
                alt="Legit Organic"
                style="height:50px;width:auto;"
              />
            </div>

            <div style="background:white;border-radius:12px;
                        padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

              <div style="text-align:center;margin-bottom:24px;">
                <div style="font-size:48px;margin-bottom:12px;">
                  {config['emoji']}
                </div>
                <h2 style="color:{config['color']};font-size:24px;margin:0;">
                  {config['title']}
                </h2>
                <p style="color:#666;margin:8px 0 0;font-size:14px;">
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
                  <strong>\U0001f4cd Delivery Address:</strong><br/>
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


def send_b2b_approval_email(profile):
    tier_info = ''
    if profile.tier:
        tier_info = f"""
        <div style="background:#F0FFF4;border-left:4px solid #2E7D32;
                    padding:16px;border-radius:0 8px 8px 0;margin:24px 0;">
          <p style="margin:0;color:#0D3B2A;font-size:15px;font-weight:600;">
            Your Discount Tier: {profile.tier.name}
          </p>
          <p style="margin:8px 0 0;color:#333;font-size:14px;">
            {profile.tier.discount_percent}% off on qualifying orders &mdash; {profile.tier.description}
          </p>
        </div>
        """

    resend.Emails.send({
        "from": f"Legit Organic <{settings.DEFAULT_FROM_EMAIL}>",
        "to": [profile.user.email],
        "subject": "Your B2B Account Has Been Approved — Legit Organic",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:'Inter',Arial,sans-serif;
                     background-color:#FAF7F0;margin:0;padding:0;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

            <div style="text-align:center;margin-bottom:32px;">
              <img src="https://api.legitorganic.com/static/images/logo-lightmode.svg"
                   alt="Legit Organic" style="height:50px;width:auto;" />
            </div>

            <div style="background:white;border-radius:12px;
                        padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="font-size:48px;margin-bottom:12px;">✅</div>
                <h2 style="color:#2E7D32;font-size:24px;margin:0;">
                  B2B Account Approved!
                </h2>
              </div>

              <p style="color:#333;line-height:1.6;">
                Dear {profile.contact_name},
              </p>
              <p style="color:#333;line-height:1.6;">
                We're delighted to inform you that your B2B account for
                <strong>{profile.business_name}</strong> has been approved.
                You can now enjoy exclusive wholesale pricing when you place orders
                through Legit Organic.
              </p>

              {tier_info}

              <div style="text-align:center;margin-top:32px;">
                <a href="{settings.FRONTEND_URL}/profile"
                   style="background-color:#F4C430;color:#0D3B2A;
                          padding:14px 32px;border-radius:8px;
                          text-decoration:none;font-weight:600;font-size:16px;">
                  View My B2B Account
                </a>
              </div>

              <p style="color:#888;font-size:14px;margin-top:24px;line-height:1.6;">
                To place wholesale orders or for any enquiries, contact us at
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
        "to": [profile.user.email],
        "subject": "B2B Application Update — Legit Organic",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family:'Inter',Arial,sans-serif;
                     background-color:#FAF7F0;margin:0;padding:0;">
          <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

            <div style="text-align:center;margin-bottom:32px;">
              <img src="https://api.legitorganic.com/static/images/logo-lightmode.svg"
                   alt="Legit Organic" style="height:50px;width:auto;" />
            </div>

            <div style="background:white;border-radius:12px;
                        padding:40px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
              <h2 style="color:#0D3B2A;font-size:24px;margin-top:0;">
                B2B Application Update
              </h2>

              <p style="color:#333;line-height:1.6;">
                Dear {profile.contact_name},
              </p>
              <p style="color:#333;line-height:1.6;">
                Thank you for applying for a B2B account at Legit Organic for
                <strong>{profile.business_name}</strong>.
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
                src="https://api.legitorganic.com/static/images/logo-lightmode.svg"
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
