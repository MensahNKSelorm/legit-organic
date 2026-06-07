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

            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #0D3B2A; font-size: 28px; margin: 0;">
                Legit Organic
              </h1>
              <p style="color: #2E7D32; margin: 4px 0 0;">
                Farm to Table, With Trust
              </p>
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

            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #0D3B2A; font-size: 28px; margin: 0;">
                Legit Organic
              </h1>
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

            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #0D3B2A; font-size: 28px; margin: 0;">
                Legit Organic
              </h1>
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
