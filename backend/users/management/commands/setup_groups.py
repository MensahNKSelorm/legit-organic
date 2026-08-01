from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType


class Command(BaseCommand):
    help = 'Create default permission groups for Legit Organic staff'

    def handle(self, *args, **options):

        # Get all permissions we need
        def get_perms(app_label, model, actions):
            ct = ContentType.objects.filter(
                app_label=app_label, model=model
            ).first()
            if not ct:
                return []
            return Permission.objects.filter(
                content_type=ct,
                codename__in=[f'{a}_{model}' for a in actions]
            )

        # ── CONTENT TEAM ──────────────────────────────────────────
        # Can manage products, blog, recipes
        # Cannot manage users or orders
        content_team, _ = Group.objects.get_or_create(name='Content Team')
        content_perms = []

        # Products - full CRUD
        content_perms += list(get_perms('products', 'product',
                                        ['add', 'change', 'view', 'delete']))
        content_perms += list(get_perms('products', 'category',
                                        ['add', 'change', 'view', 'delete']))

        # Blog - full CRUD
        content_perms += list(get_perms('blog', 'blogpost',
                                        ['add', 'change', 'view', 'delete']))
        content_perms += list(get_perms('blog', 'blogcategory',
                                        ['add', 'change', 'view', 'delete']))

        # Recipes - full CRUD
        content_perms += list(get_perms('recipes', 'recipe',
                                        ['add', 'change', 'view', 'delete']))
        content_perms += list(get_perms('recipes', 'recipeingredient',
                                        ['add', 'change', 'view', 'delete']))
        content_perms += list(get_perms('recipes', 'recipestep',
                                        ['add', 'change', 'view', 'delete']))
        content_perms += list(get_perms('recipes', 'recipepairing',
                                        ['add', 'change', 'view', 'delete']))

        content_team.permissions.set(content_perms)
        self.stdout.write(self.style.SUCCESS(
            f'✓ Content Team — {len(content_perms)} permissions'
        ))

        # ── OPERATIONS ────────────────────────────────────────────
        # Can view and manage orders, view users, view products
        # Cannot add/delete users or change products
        operations, _ = Group.objects.get_or_create(name='Operations')
        ops_perms = []

        # Orders - process and view, but preserve the audit trail
        ops_perms += list(get_perms('orders', 'order',
                                    ['change', 'view']))
        ops_perms += list(get_perms('orders', 'orderitem',
                                    ['change', 'view']))
        ops_perms += list(get_perms('orders', 'cart',
                                    ['view']))
        ops_perms += list(get_perms('orders', 'cartitem',
                                    ['view']))

        # Users - view only (no passwords, no deletion)
        ops_perms += list(get_perms('users', 'user', ['view']))
        ops_perms += list(get_perms('users', 'customer', ['view']))

        # Products - view only
        ops_perms += list(get_perms('products', 'product', ['view']))
        ops_perms += list(get_perms('products', 'category', ['view']))

        operations.permissions.set(ops_perms)
        self.stdout.write(self.style.SUCCESS(
            f'✓ Operations — {len(ops_perms)} permissions'
        ))

        # ── FINANCE ───────────────────────────────────────────────
        # Read-only access to orders for reporting
        # Cannot change anything
        finance, _ = Group.objects.get_or_create(name='Finance')
        finance_perms = []

        # Orders - view only
        finance_perms += list(get_perms('orders', 'order', ['view']))
        finance_perms += list(get_perms('orders', 'orderitem', ['view']))

        # Users - view only (for order context)
        finance_perms += list(get_perms('users', 'user', ['view']))
        finance_perms += list(get_perms('users', 'customer', ['view']))

        finance.permissions.set(finance_perms)
        self.stdout.write(self.style.SUCCESS(
            f'✓ Finance — {len(finance_perms)} permissions'
        ))

        # ── SALES & MARKETING ────────────────────────────────────
        sales_marketing, _ = Group.objects.get_or_create(name='Sales & Marketing')
        sales_perms = []
        sales_perms += list(get_perms('orders', 'promocode',
                                      ['add', 'change', 'view', 'delete']))
        sales_perms += list(get_perms('sales', 'salesrep',
                                      ['add', 'change', 'view']))
        sales_perms += list(get_perms('sales', 'referredcustomer',
                                      ['add', 'change', 'view']))
        sales_perms += list(get_perms('sales', 'commission', ['view']))
        sales_perms += list(get_perms('orders', 'order', ['view']))
        sales_perms += list(get_perms('users', 'user', ['view']))
        sales_perms += list(get_perms('users', 'customer', ['view']))
        sales_perms += list(get_perms('products', 'product', ['view']))
        sales_perms += list(get_perms('blog', 'blogpost', ['view']))
        sales_marketing.permissions.set(sales_perms)
        self.stdout.write(self.style.SUCCESS(
            f'✓ Sales & Marketing — {len(sales_perms)} permissions'
        ))

        # ── PRODUCT MANAGER ─────────────────────────────────────
        product_manager, _ = Group.objects.get_or_create(name='Product Manager')
        product_perms = []
        for model in ['product', 'productimage', 'category', 'region', 'badge']:
            product_perms += list(get_perms(
                'products', model, ['add', 'change', 'view', 'delete']
            ))
        product_perms += list(get_perms('orders', 'order', ['view']))
        product_perms += list(get_perms('orders', 'orderitem', ['view']))
        product_manager.permissions.set(product_perms)
        self.stdout.write(self.style.SUCCESS(
            f'✓ Product Manager — {len(product_perms)} permissions'
        ))

        # ── EXECUTIVE ADMIN ─────────────────────────────────────
        # Broad business access without staff-security or commission controls.
        executive, _ = Group.objects.get_or_create(name='Executive Admin')
        executive_perms = []
        business_models = {
            'products': ['product', 'productimage', 'category', 'region', 'badge'],
            'blog': ['blogpost', 'blogcategory'],
            'recipes': ['recipe', 'recipeingredient', 'recipestep', 'recipepairing'],
            'orders': ['order', 'orderitem', 'promocode'],
            'sales': ['salesrep', 'referredcustomer'],
            'users': ['b2bprofile', 'b2bdiscounttier'],
        }
        for app_label, models in business_models.items():
            for model in models:
                executive_perms += list(get_perms(
                    app_label, model, ['add', 'change', 'view', 'delete']
                ))
        executive_perms += list(get_perms('orders', 'cart', ['view']))
        executive_perms += list(get_perms('orders', 'cartitem', ['view']))
        executive_perms += list(get_perms('users', 'user', ['view']))
        executive_perms += list(get_perms('users', 'customer', ['view']))
        executive_perms += list(get_perms('sales', 'commission', ['view']))
        executive.permissions.set(executive_perms)
        self.stdout.write(self.style.SUCCESS(
            f'✓ Executive Admin — {len(executive_perms)} permissions'
        ))

        self.stdout.write(self.style.SUCCESS('''
Groups created successfully:
- Content Team: manage products, blog, recipes
- Operations: manage orders, view users and products
- Finance: read-only access to orders and users
- Sales & Marketing: manage promos, reps and referrals; view reporting
- Product Manager: manage the catalogue; view order demand
- Executive Admin: manage business operations without staff-security controls
        '''))
