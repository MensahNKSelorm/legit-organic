import { expect, test, type Page, type Route } from '@playwright/test'

const apiPattern = 'http://localhost:8000/**'

const customer = {
  id: 901,
  email: 'qa.customer@legitorganic.test',
  first_name: 'Ama',
  last_name: 'Mensah',
  phone_number: '0244123456',
  house_number: '12',
  street_address: 'Market Street',
  city: 'Accra',
  delivery_region: 'Greater Accra',
  is_email_verified: true,
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function mockGuestSession(page: Page) {
  await page.route(apiPattern, async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/token/refresh/') return json(route, { detail: 'No session' }, 401)
    return route.fallback()
  })
}

async function mockAuthenticatedSession(page: Page, subscriptions: unknown[] = []) {
  await page.route(apiPattern, async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/token/refresh/') return json(route, { access: 'qa-access' })
    if (path === '/api/users/me/') return json(route, customer)
    if (path === '/api/users/b2b/status/' || path === '/api/sales/me/') return json(route, { status: null })
    if (path === '/api/orders/cart/') return json(route, { id: 1, items: [], created_at: '', updated_at: '' })
    if (path === '/api/subscriptions/') return json(route, subscriptions)
    return route.fallback()
  })
}

test.describe('critical customer journeys', () => {
  test('signup validates fields and reaches email verification', async ({ page }) => {
    await mockGuestSession(page)
    await page.route('http://localhost:8000/api/users/register/', (route) =>
      json(route, { user: customer, email_verification_required: true }, 201),
    )

    await page.goto('/signup')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page.getByText('First name is required.')).toBeVisible()

    await page.getByLabel('First Name').fill('Ama')
    await page.getByLabel('Last Name').fill('Mensah')
    await page.getByLabel('Email Address').fill('ama.qa@example.com')
    await page.getByLabel('Password', { exact: true }).fill('SafePass123!')
    await page.getByLabel('Confirm Password').fill('SafePass123!')
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page).toHaveURL(/\/check-email\?email=ama\.qa%40example\.com/)
  })

  test('login restores the customer and opens the profile', async ({ page }) => {
    let loggedIn = false
    await page.route(apiPattern, async (route) => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/auth/token/' && route.request().method() === 'POST') {
        loggedIn = true
        return json(route, { access: 'qa-access' })
      }
      if (path === '/api/auth/token/refresh/') return json(route, { detail: 'No session' }, 401)
      if (path === '/api/users/me/' && loggedIn) return json(route, customer)
      if (path === '/api/users/b2b/status/' || path === '/api/sales/me/') return json(route, { status: null })
      if (path === '/api/orders/cart/') return json(route, { id: 1, items: [], created_at: '', updated_at: '' })
      return route.fallback()
    })

    await page.goto('/login')
    await page.getByLabel('Email Address').fill(customer.email)
    await page.getByLabel('Password', { exact: true }).fill('SafePass123!')
    await page.getByRole('button', { name: 'Sign In' }).click()
    await expect(page).toHaveURL(/\/profile$/)
    await expect(page.getByText(customer.email)).toBeVisible()
  })

  test('customer browses, searches, adds to cart, and sees safe checkout failure retry', async ({ page }) => {
    await mockGuestSession(page)
    let orderCreates = 0
    let checkoutAttempts = 0
    await page.route('http://localhost:8000/api/orders/create/', (route) => {
      orderCreates += 1
      return json(route, { reference: 'LO-QA-001', guest_access_token: 'guest-token' }, 201)
    })
    await page.route('http://localhost:8000/api/orders/LO-QA-001/checkout/', (route) => {
      checkoutAttempts += 1
      if (checkoutAttempts === 1) return json(route, { detail: 'Payment service is temporarily unavailable.' }, 503)
      return json(route, { checkout_url: 'http://localhost:3000/payment?reference=LO-QA-001', reference: 'PAY-QA-001' })
    })

    await page.goto('/products')
    await page.getByRole('searchbox', { name: 'Search this market' }).fill('rice')
    await expect(page.getByText('2 items found')).toBeVisible()
    await page.getByRole('button', { name: /add elez rice to cart/i }).click()
    await page.getByRole('button', { name: /open cart/i }).click()
    await expect(page.getByRole('dialog', { name: 'Shopping cart' })).toContainText('Elez Rice')
    await page.getByRole('button', { name: 'Pay securely with SeevCash' }).click()

    const guest = page.getByRole('dialog', { name: 'Quick order details' })
    await guest.getByLabel('First Name').fill('Kojo')
    await guest.getByLabel('Last Name').fill('Boateng')
    await guest.getByLabel('Email').fill('kojo@example.com')
    await guest.getByLabel('Phone Number').fill('0244123456')
    await guest.getByLabel('Street Address').fill('12 Market Street')
    await guest.getByLabel('City').fill('Accra')
    await guest.getByLabel('Region').selectOption('Greater Accra')
    await guest.getByRole('button', { name: /continue to payment/i }).click()

    await expect(
      page.getByRole('alert').filter({ hasText: 'Payment service is temporarily unavailable.' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Pay securely with SeevCash' }).click()
    await expect(page).toHaveURL(/\/payment\?reference=LO-QA-001/)
    expect(orderCreates).toBe(1)
    expect(checkoutAttempts).toBe(2)
  })

  test('renewal payment failure remains retryable without changing subscription state', async ({ page }) => {
    const renewal = {
      id: 77,
      name: 'Family market basket',
      audience: 'household',
      status: 'active',
      weekly_total: '120.00',
      next_delivery_date: '2026-08-29',
      items: [{ id: 1 }],
      weeks: [{ id: 501, status: 'payment_due' }],
    }
    await mockAuthenticatedSession(page, [renewal])
    let renewalCheckoutAttempts = 0
    await page.route('http://localhost:8000/api/subscriptions/77/payment/', (route) => {
      renewalCheckoutAttempts += 1
      if (renewalCheckoutAttempts === 1) {
        return json(route, { detail: 'Could not create renewal checkout.' }, 503)
      }
      return json(route, {
        checkout_url: 'http://localhost:3000/subscriptions/payment?reference=PAY-RENEWAL-QA',
        reference: 'PAY-RENEWAL-QA',
      })
    })

    await page.goto('/subscriptions/manage')
    await expect(page.getByText('Family market basket')).toBeVisible()
    await page.getByRole('button', { name: 'Pay renewal' }).click()
    await expect(page.getByText('Could not create renewal checkout.')).toBeVisible()
    await expect(page.getByText('Active', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pay renewal' })).toBeEnabled()
    await page.getByRole('button', { name: 'Pay renewal' }).click()
    await expect(page).toHaveURL(/\/subscriptions\/payment\?reference=PAY-RENEWAL-QA/)
    expect(renewalCheckoutAttempts).toBe(2)
  })

  test('B2B application submits required organisation and delivery evidence', async ({ page }) => {
    await mockGuestSession(page)
    await page.route('http://localhost:8000/api/users/b2b/apply/', (route) => json(route, { id: 42 }, 201))
    await page.goto('/b2b/apply')

    await page.getByLabel('Registered name').fill('QA Foods Limited')
    await page.getByLabel('Sector').fill('Hospitality')
    await page.getByLabel('Organisation TIN').fill('C0000000000')
    await page.getByLabel('ORC registration number').fill('CS000000000')
    await page.getByLabel('Supporting document').setInputFiles({ name: 'registration.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 QA') })
    await page.getByLabel('Full name').fill('Akosua Owusu')
    await page.getByLabel('Position').fill('Procurement Manager')
    await page.getByLabel('Work email').fill('procurement@example.com')
    await page.getByLabel('Primary phone').fill('0244123456')
    await page.getByLabel('Region').selectOption('Greater Accra')
    await page.getByLabel('City or town').fill('Accra')
    await page.getByLabel('Locality / neighbourhood').fill('Osu')
    await page.getByLabel('Receiving contact').fill('Akosua Owusu')
    await page.getByLabel('Receiving phone').fill('0244123456')
    await page.getByLabel('Receiving hours').fill('Mon-Fri, 8:00-16:00')
    await page.getByLabel('Fresh vegetables').check()
    await page.getByLabel('I am authorised to apply for this organisation.').check()
    await page.getByLabel('The information and document are accurate.').check()
    await page.getByLabel(/I understand how this information will be reviewed/).check()
    await page.getByRole('button', { name: 'Submit trade application' }).click()

    await expect(page.getByRole('heading', { name: 'Now we review.' })).toBeVisible()
    await expect(page.getByText('LO-B2B-42')).toBeVisible()
  })
})
