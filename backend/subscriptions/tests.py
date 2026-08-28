from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from products.models import Product
from users.models import B2BProfile, User

from .models import (
    BusinessSupplyAgreement, BusinessSupplyCycle, DeliveryZone,
    Subscription, SubscriptionPlan, SubscriptionPlanPriceChange,
    SubscriptionPriceNotice, SubscriptionWeek,
)
from .services import apply_price_change, deliver_price_notice, prepare_price_change


class SubscriptionAPITests(APITestCase):
    def setUp(self):
        self.email_patcher = patch(
            'subscriptions.emails.resend.Emails.send', return_value={'id': 'email_test'}
        )
        self.mock_email_send = self.email_patcher.start()
        self.addCleanup(self.email_patcher.stop)
        self.user = User.objects.create_user(
            email='family@example.com', password='test-pass', email_verified=True
        )
        self.other = User.objects.create_user(
            email='other@example.com', password='test-pass', email_verified=True
        )
        self.product = Product.objects.create(
            name='Local rice', price=Decimal('40.00'), unit='2kg'
        )
        self.zone = DeliveryZone.objects.create(
            name='Test Accra', delivery_weekday=(timezone.localdate().weekday() + 3) % 7,
            delivery_fee=Decimal('15.00'), cutoff_hours=48,
        )
        self.client.force_authenticate(self.user)

    def create_subscription(self, audience='household'):
        return self.client.post('/api/subscriptions/', {
            'audience': audience,
            'delivery_zone': self.zone.pk,
            'delivery_address': '1 Market Road, Accra',
            'contact_phone': '0244000000',
            'payment_method': 'card',
            'items': [{'product_id': self.product.pk, 'quantity': 2}],
        }, format='json')

    def test_custom_subscription_prices_products_on_server(self):
        response = self.create_subscription()
        self.assertEqual(response.status_code, 201)
        subscription = Subscription.objects.get(pk=response.data['id'])
        self.assertEqual(subscription.weekly_subtotal, Decimal('80.00'))
        self.assertEqual(subscription.weekly_delivery_fee, Decimal('15.00'))
        self.assertEqual(subscription.weeks.get().status, 'payment_due')
        self.assertIsNotNone(subscription.weeks.get().order_id)

    def test_duplicate_products_are_rejected(self):
        response = self.client.post('/api/subscriptions/', {
            'audience': 'household', 'delivery_zone': self.zone.pk,
            'delivery_address': 'Accra', 'contact_phone': '0244000000',
            'payment_method': 'card',
            'items': [
                {'product_id': self.product.pk, 'quantity': 1},
                {'product_id': self.product.pk, 'quantity': 2},
            ],
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_business_deliveries_cannot_be_created_as_household_subscriptions(self):
        response = self.create_subscription(audience='business')
        self.assertEqual(response.status_code, 400)
        B2BProfile.objects.create(
            user=self.user, company_name='Kitchen Ltd', business_type='restaurant',
            contact_person='Ama', business_phone='0244000000',
            business_email=self.user.email, business_address='Accra', status='approved',
        )
        response = self.create_subscription(audience='business')
        self.assertEqual(response.status_code, 403)
        self.assertIn('business supply workspace', str(response.data).lower())

    def test_users_only_see_their_own_subscriptions(self):
        own = self.create_subscription().data['id']
        Subscription.objects.create(
            user=self.other, delivery_zone=self.zone, delivery_address='Elsewhere',
            contact_phone='0200000000', payment_method='card',
        )
        response = self.client.get('/api/subscriptions/')
        self.assertEqual([row['id'] for row in response.data], [own])

    @override_settings(SEEVCASH_SECRET_KEY='')
    def test_payment_initialization_fails_closed_without_key(self):
        subscription_id = self.create_subscription().data['id']
        response = self.client.post(f'/api/subscriptions/{subscription_id}/payment/')
        self.assertEqual(response.status_code, 503)

    def test_skip_creates_next_week(self):
        subscription_id = self.create_subscription().data['id']
        subscription = Subscription.objects.get(pk=subscription_id)
        subscription.status = 'active'
        subscription.save(update_fields=['status'])
        old_date = subscription.next_delivery_date
        response = self.client.post(f'/api/subscriptions/{subscription_id}/skip/')
        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.next_delivery_date, old_date + timedelta(days=7))
        self.assertTrue(subscription.weeks.filter(delivery_date=old_date, status='skipped').exists())

    def test_pause_cancels_unpaid_renewal_and_resume_schedules_next(self):
        subscription_id = self.create_subscription().data['id']
        subscription = Subscription.objects.get(pk=subscription_id)
        subscription.status = 'active'
        subscription.save(update_fields=['status'])
        current = subscription.weeks.get()
        response = self.client.post(f'/api/subscriptions/{subscription_id}/pause/')
        self.assertEqual(response.status_code, 200)
        current.refresh_from_db()
        current.order.refresh_from_db()
        self.assertEqual(current.status, 'cancelled')
        self.assertEqual(current.order.status, 'cancelled')

        response = self.client.post(f'/api/subscriptions/{subscription_id}/resume/')
        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, 'active')
        self.assertTrue(subscription.weeks.filter(status='scheduled').exists())

    def test_cancel_stops_pending_renewal(self):
        subscription_id = self.create_subscription().data['id']
        subscription = Subscription.objects.get(pk=subscription_id)
        subscription.status = 'active'
        subscription.save(update_fields=['status'])
        response = self.client.post(f'/api/subscriptions/{subscription_id}/cancel/')
        self.assertEqual(response.status_code, 200)
        week = SubscriptionWeek.objects.get(subscription=subscription)
        self.assertEqual(week.status, 'cancelled')
        self.assertEqual(week.order.status, 'cancelled')

    def test_scheduler_expires_unpaid_window_without_activating_subscription(self):
        subscription_id = self.create_subscription().data['id']
        week = SubscriptionWeek.objects.get(subscription_id=subscription_id)
        week.cutoff_at = timezone.now() - timedelta(minutes=1)
        week.save(update_fields=['cutoff_at'])
        call_command('process_subscription_payments')
        week.refresh_from_db()
        week.order.refresh_from_db()
        self.assertEqual(week.status, 'expired')
        self.assertEqual(week.order.payment_status, 'expired')
        self.assertEqual(week.subscription.status, 'draft')

    @override_settings(SEEVCASH_SECRET_KEY='secret', SEEVCASH_CURRENCY='GHS')
    @patch('subscriptions.views.verify_checkout')
    def test_verification_rejects_underpayment(self, mock_verify):
        subscription_id = self.create_subscription().data['id']
        week = SubscriptionWeek.objects.get(subscription_id=subscription_id)
        week.payment_reference = 'LO-SUB-TEST'
        week.save(update_fields=['payment_reference'])
        mock_verify.return_value = {
            'status': 'completed', 'reference': 'LO-SUB-TEST',
            'currency': 'GHS', 'amount': 100, 'final_amount': 100,
        }
        response = self.client.post('/api/subscriptions/payment/verify/', {
            'reference': 'LO-SUB-TEST'
        }, format='json')
        self.assertEqual(response.status_code, 402)
        week.refresh_from_db()
        self.assertEqual(week.status, 'payment_due')


class BusinessSupplyAPITests(APITestCase):
    def setUp(self):
        self.email_patcher = patch('users.emails.resend.Emails.send', return_value={'id': 'email_test'})
        self.mock_email_send = self.email_patcher.start()
        self.addCleanup(self.email_patcher.stop)
        self.user = User.objects.create_user(
            email='buyer@example.com', password='test-pass', email_verified=True
        )
        self.other = User.objects.create_user(
            email='other-buyer@example.com', password='test-pass', email_verified=True
        )
        self.profile = B2BProfile.objects.create(
            user=self.user, company_name='Buyer Kitchen Ltd', business_type='restaurant',
            contact_person='Ama Buyer', business_phone='0244000000',
            business_email=self.user.email, business_address='Accra', status='approved',
        )
        self.product = Product.objects.create(
            name='Business tomatoes', price=Decimal('25.00'), unit='crate',
            business_supply_category='tomato',
        )
        self.zone = DeliveryZone.objects.create(
            name='Business Accra', delivery_weekday=(timezone.localdate().weekday() + 3) % 7,
            delivery_fee=Decimal('20.00'), cutoff_hours=48,
        )
        self.client.force_authenticate(self.user)

    def payload(self):
        return {
            'name': 'Kitchen essentials', 'frequency': 'fortnightly',
            'delivery_zone': self.zone.pk, 'delivery_address': '1 Trade Road, Accra',
            'receiving_contact_name': 'Ama Buyer',
            'receiving_contact_phone': '0244000000',
            'receiving_hours': 'Monday to Friday, 8am to 4pm',
            'items': [{'product_id': self.product.pk, 'quantity': 5}],
        }

    def test_approved_business_submits_separate_supply_agreement(self):
        response = self.client.post(
            '/api/subscriptions/business/supply/', self.payload(), format='json'
        )
        self.assertEqual(response.status_code, 201)
        agreement = BusinessSupplyAgreement.objects.get(pk=response.data['id'])
        self.assertEqual(agreement.status, 'under_review')
        self.assertEqual(agreement.subtotal, Decimal('125.00'))
        self.assertEqual(agreement.items.count(), 1)
        self.assertFalse(Subscription.objects.filter(user=self.user).exists())
        email = self.mock_email_send.call_args.args[0]
        self.assertEqual(email['to'], [self.user.email])
        self.assertEqual(email['reply_to'], 'operations@legitorganic.com')
        self.assertEqual(email['from'], 'Legit Organic <operations@legitorganic.com>')
        self.assertIn('text', email)
        self.assertIn(f'LO-SUPPLY-{agreement.pk}', email['subject'])
        self.assertIn('/b2b/dashboard', email['html'])

    def test_business_quote_sends_review_confirmation(self):
        response = self.client.post('/api/subscriptions/business/quotes/', {
            'requested_delivery_date': str(timezone.localdate() + timedelta(days=5)),
            'is_recurring': False,
            'customer_note': 'Please confirm crate availability.',
            'items': [{
                'product_id': self.product.pk, 'quantity': 8,
                'requested_unit': 'crate',
            }],
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        email = self.mock_email_send.call_args.args[0]
        self.assertEqual(email['to'], [self.user.email])
        self.assertIn(f"LO-QUOTE-{response.data['id']}", email['subject'])

    def test_business_supply_rejects_regular_market_product(self):
        regular_product = Product.objects.create(
            name='Market yam', price=Decimal('30.00'), unit='tuber'
        )
        payload = self.payload()
        payload['items'] = [{'product_id': regular_product.pk, 'quantity': 5}]
        response = self.client.post(
            '/api/subscriptions/business/supply/', payload, format='json'
        )
        self.assertEqual(response.status_code, 400)

    def test_business_only_sees_its_own_agreements(self):
        own = self.client.post(
            '/api/subscriptions/business/supply/', self.payload(), format='json'
        ).data['id']
        other_profile = B2BProfile.objects.create(
            user=self.other, company_name='Other Ltd', business_type='hotel',
            contact_person='Kojo', business_phone='0200000000',
            business_email=self.other.email, business_address='Tema', status='approved',
        )
        BusinessSupplyAgreement.objects.create(
            business=other_profile, name='Other supply', frequency='monthly',
            delivery_zone=self.zone, delivery_address='Tema',
            receiving_contact_name='Kojo', receiving_contact_phone='0200000000',
        )
        response = self.client.get('/api/subscriptions/business/supply/')
        self.assertEqual([row['id'] for row in response.data], [own])

    def test_unapproved_business_cannot_create_supply(self):
        self.profile.status = 'under_review'
        self.profile.save(update_fields=['status'])
        response = self.client.post(
            '/api/subscriptions/business/supply/', self.payload(), format='json'
        )
        self.assertEqual(response.status_code, 403)

    def test_approved_business_is_isolated_from_household_commerce(self):
        self.assertEqual(self.client.get('/api/orders/cart/').status_code, 403)
        self.assertEqual(self.client.get('/api/subscriptions/').status_code, 403)
        self.assertEqual(
            self.client.post('/api/orders/create/', {}, format='json').status_code,
            403,
        )

    def test_cycle_actions_are_scoped_to_business_owner(self):
        agreement = BusinessSupplyAgreement.objects.create(
            business=self.profile, name='Active supply', status='active',
            frequency='weekly', delivery_zone=self.zone, delivery_address='Accra',
            receiving_contact_name='Ama', receiving_contact_phone='0244000000',
            subtotal=Decimal('125.00'), delivery_fee=Decimal('20.00'),
            next_delivery_date=timezone.localdate() + timedelta(days=3),
        )
        BusinessSupplyCycle.objects.create(
            agreement=agreement, delivery_date=agreement.next_delivery_date,
            payment_due_at=timezone.now() + timedelta(days=1),
            subtotal=agreement.subtotal, delivery_fee=agreement.delivery_fee,
        )
        response = self.client.post(
            f'/api/subscriptions/business/supply/{agreement.pk}/skip/'
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(agreement.cycles.order_by('delivery_date').first().status, 'skipped')


class SubscriptionPriceChangeTests(APITestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            email='operations@legitorganic.com', password='x', is_staff=True,
        )
        self.customer = User.objects.create_user(
            email='weekly@example.com', password='x', email_verified=True,
        )
        self.plan = SubscriptionPlan.objects.create(
            name='Family Week', weekly_price=Decimal('100.00')
        )
        self.zone = DeliveryZone.objects.create(
            name='Price Test Zone', delivery_weekday=3, delivery_fee=Decimal('10.00')
        )
        self.subscription = Subscription.objects.create(
            user=self.customer, plan=self.plan, delivery_zone=self.zone,
            delivery_address='Accra', contact_phone='0244000000',
            payment_method='mobile_money', status='active',
            weekly_subtotal=Decimal('100.00'), weekly_delivery_fee=Decimal('10.00'),
        )
        self.change = SubscriptionPlanPriceChange.objects.create(
            plan=self.plan, new_price=Decimal('120.00'),
            effective_at=timezone.now() + timedelta(days=15), status='scheduled',
            reason='Seasonal sourcing costs have changed.', created_by=self.staff,
        )

    def test_notice_ledger_is_created_once(self):
        prepare_price_change(self.change.pk)
        prepare_price_change(self.change.pk)
        notice = SubscriptionPriceNotice.objects.get(price_change=self.change)
        self.assertEqual(notice.recipient_email, self.customer.email)
        self.assertEqual(self.change.notices.count(), 1)

    @patch('subscriptions.emails.send_price_change_notice', side_effect=RuntimeError('mail down'))
    def test_failed_notice_blocks_customer_price_change(self, _mock_send):
        prepare_price_change(self.change.pk)
        notice = self.change.notices.get()
        deliver_price_notice(notice.pk)
        self.change.effective_at = timezone.now() - timedelta(minutes=1)
        self.change.save(update_fields=['effective_at'])
        apply_price_change(self.change.pk)
        self.subscription.refresh_from_db()
        notice.refresh_from_db()
        self.assertEqual(self.subscription.weekly_subtotal, Decimal('100.00'))
        self.assertEqual(notice.status, 'failed')

    @patch('subscriptions.emails.send_price_change_notice', return_value='email_123')
    def test_successful_notice_allows_price_change(self, _mock_send):
        prepare_price_change(self.change.pk)
        notice = self.change.notices.get()
        deliver_price_notice(notice.pk)
        self.change.effective_at = timezone.now() - timedelta(minutes=1)
        self.change.save(update_fields=['effective_at'])
        apply_price_change(self.change.pk)
        self.subscription.refresh_from_db()
        self.plan.refresh_from_db()
        notice.refresh_from_db()
        self.assertEqual(self.subscription.weekly_subtotal, Decimal('120.00'))
        self.assertEqual(self.plan.weekly_price, Decimal('120.00'))
        self.assertEqual(notice.status, 'applied')
