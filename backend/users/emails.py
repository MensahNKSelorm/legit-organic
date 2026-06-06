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
