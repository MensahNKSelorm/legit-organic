from django.db.models import Sum, Count, Avg
from django.db.models.functions import TruncDay, TruncMonth
from django.utils import timezone
from datetime import timedelta
from collections import Counter
import json


def dashboard_callback(request, context):
    now   = timezone.now()
    today = now.date()

    last_30_days      = today - timedelta(days=30)
    this_month_start  = today.replace(day=1)
    last_month_start  = (this_month_start - timedelta(days=1)).replace(day=1)
    last_month_end    = this_month_start - timedelta(days=1)
    six_months_ago    = today - timedelta(days=180)

    from orders.models import Order, OrderItem
    from products.models import Product
    from users.models import User
    from blog.models import BlogPost
    from recipes.models import Recipe

    all_orders  = Order.objects.all()
    paid_orders = all_orders.exclude(status__in=['whatsapp_pending', 'cancelled'])

    # ── Revenue KPIs ─────────────────────────────────────────────────────────
    total_revenue = paid_orders.aggregate(t=Sum('total_amount'))['t'] or 0

    this_month_revenue = paid_orders.filter(
        created_at__date__gte=this_month_start
    ).aggregate(t=Sum('total_amount'))['t'] or 0

    last_month_revenue = paid_orders.filter(
        created_at__date__gte=last_month_start,
        created_at__date__lte=last_month_end,
    ).aggregate(t=Sum('total_amount'))['t'] or 0

    revenue_change = 0
    if last_month_revenue:
        revenue_change = round(
            (float(this_month_revenue) - float(last_month_revenue))
            / float(last_month_revenue) * 100, 1
        )

    # ── Order KPIs ───────────────────────────────────────────────────────────
    total_orders = all_orders.count()

    orders_this_month = all_orders.filter(
        created_at__date__gte=this_month_start
    ).count()

    orders_last_month = all_orders.filter(
        created_at__date__gte=last_month_start,
        created_at__date__lte=last_month_end,
    ).count()

    orders_change = 0
    if orders_last_month:
        orders_change = round(
            (orders_this_month - orders_last_month) / orders_last_month * 100, 1
        )

    pending_orders   = all_orders.filter(status='whatsapp_pending').count()
    delivered_orders = all_orders.filter(status='delivered').count()
    avg_order_value  = paid_orders.aggregate(a=Avg('total_amount'))['a'] or 0

    # ── Customer KPIs ────────────────────────────────────────────────────────
    total_customers = User.objects.filter(is_staff=False).count()

    new_customers_this_month = User.objects.filter(
        is_staff=False,
        date_joined__date__gte=this_month_start,
    ).count()

    # ── Content KPIs ─────────────────────────────────────────────────────────
    total_products   = Product.objects.filter(is_available=True).count()
    total_blog_posts = BlogPost.objects.filter(is_published=True).count()
    total_recipes    = Recipe.objects.filter(is_default=True).count()

    # ── Order source split ───────────────────────────────────────────────────
    source_counts   = all_orders.values('order_source').annotate(count=Count('id'))
    whatsapp_orders = next(
        (s['count'] for s in source_counts if s['order_source'] == 'whatsapp'), 0
    )
    paystack_orders = next(
        (s['count'] for s in source_counts if s['order_source'] == 'paystack'), 0
    )

    # ── Revenue chart — last 30 days ─────────────────────────────────────────
    revenue_by_day = paid_orders.filter(
        created_at__date__gte=last_30_days
    ).annotate(
        day=TruncDay('created_at')
    ).values('day').annotate(
        revenue=Sum('total_amount'),
        orders=Count('id'),
    ).order_by('day')

    revenue_map = {
        item['day'].date(): (float(item['revenue']), item['orders'])
        for item in revenue_by_day
    }

    revenue_labels = []
    revenue_data   = []
    orders_data    = []
    for i in range(30):
        day = last_30_days + timedelta(days=i)
        revenue_labels.append(day.strftime('%d %b'))
        rev, ord_count = revenue_map.get(day, (0, 0))
        revenue_data.append(rev)
        orders_data.append(ord_count)

    # ── Orders by status — donut ─────────────────────────────────────────────
    STATUS_LABELS = {
        'whatsapp_pending': 'Awaiting Payment',
        'paid':             'Paid',
        'processing':       'Processing',
        'shipped':          'Shipped',
        'delivered':        'Delivered',
        'cancelled':        'Cancelled',
        'pending':          'Pending',
    }
    STATUS_COLORS = {
        'whatsapp_pending': '#F4C430',
        'paid':             '#2196F3',
        'processing':       '#FF9800',
        'shipped':          '#9C27B0',
        'delivered':        '#2E7D32',
        'cancelled':        '#F44336',
        'pending':          '#9E9E9E',
    }

    status_rows = all_orders.values('status').annotate(count=Count('id')).order_by('-count')
    donut_labels = []
    donut_data   = []
    donut_colors = []
    for item in status_rows:
        if item['count'] > 0:
            donut_labels.append(STATUS_LABELS.get(item['status'], item['status']))
            donut_data.append(item['count'])
            donut_colors.append(STATUS_COLORS.get(item['status'], '#9E9E9E'))

    # ── Top products ─────────────────────────────────────────────────────────
    top_products = OrderItem.objects.filter(
        product__isnull=False
    ).values('product__name').annotate(
        total_qty=Sum('quantity'),
        total_revenue=Sum('unit_price'),
    ).order_by('-total_qty')[:7]

    top_product_labels = [p['product__name'] for p in top_products]
    top_product_data   = [p['total_qty']      for p in top_products]

    # ── New customers — last 6 months ────────────────────────────────────────
    customers_by_month = User.objects.filter(
        is_staff=False,
        date_joined__date__gte=six_months_ago,
    ).annotate(
        month=TruncMonth('date_joined')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')

    customer_labels = [item['month'].strftime('%b %Y') for item in customers_by_month]
    customer_data   = [item['count']                   for item in customers_by_month]

    # ── Populate context ─────────────────────────────────────────────────────
    context.update({
        'kpi': {
            'total_revenue':           f'GH₵ {float(total_revenue):,.2f}',
            'this_month_revenue':      f'GH₵ {float(this_month_revenue):,.2f}',
            'revenue_change':          revenue_change,
            'total_orders':            total_orders,
            'orders_this_month':       orders_this_month,
            'orders_change':           orders_change,
            'total_customers':         total_customers,
            'new_customers_this_month': new_customers_this_month,
            'avg_order_value':         f'GH₵ {float(avg_order_value):,.2f}',
            'pending_orders':          pending_orders,
            'delivered_orders':        delivered_orders,
            'total_products':          total_products,
            'total_blog_posts':        total_blog_posts,
            'total_recipes':           total_recipes,
            'whatsapp_orders':         whatsapp_orders,
            'paystack_orders':         paystack_orders,
        },
        'chart_revenue_labels':      json.dumps(revenue_labels),
        'chart_revenue_data':        json.dumps(revenue_data),
        'chart_orders_data':         json.dumps(orders_data),
        'chart_donut_labels':        json.dumps(donut_labels),
        'chart_donut_data':          json.dumps(donut_data),
        'chart_donut_colors':        json.dumps(donut_colors),
        'chart_top_product_labels':  json.dumps(top_product_labels),
        'chart_top_product_data':    json.dumps(top_product_data),
        'chart_customer_labels':     json.dumps(customer_labels),
        'chart_customer_data':       json.dumps(customer_data),
    })
    return context
