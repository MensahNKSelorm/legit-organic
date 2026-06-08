from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, white
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_CENTER
from django.http import HttpResponse
from django.utils import timezone
import io

FOREST_GREEN = HexColor('#0D3B2A')
GHANA_GOLD   = HexColor('#F4C430')
LIGHT_GREEN  = HexColor('#E8F5E9')
CREAM        = HexColor('#FAF7F0')
CHARCOAL     = HexColor('#333333')
GREY         = HexColor('#9CA3AF')


def generate_receipt_pdf(order):
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header ───────────────────────────────────────────────────────────────
    company_style = ParagraphStyle(
        'Company',
        parent=styles['Title'],
        fontSize=24,
        textColor=FOREST_GREEN,
        spaceAfter=4,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )
    story.append(Paragraph('LEGIT ORGANIC LIMITED', company_style))

    tagline_style = ParagraphStyle(
        'Tagline',
        parent=styles['Normal'],
        fontSize=10,
        textColor=GREY,
        spaceAfter=4,
        alignment=TA_CENTER,
    )
    story.append(Paragraph('Farm to Table, With Trust', tagline_style))
    story.append(Paragraph(
        'Accra, Ghana · hello@legitorganic.com · +233 539 569 260',
        tagline_style,
    ))
    story.append(Spacer(1, 0.3 * cm))

    story.append(HRFlowable(
        width='100%', thickness=3, color=GHANA_GOLD, spaceAfter=0.5 * cm,
    ))

    receipt_style = ParagraphStyle(
        'Receipt',
        parent=styles['Title'],
        fontSize=18,
        textColor=FOREST_GREEN,
        spaceAfter=0.3 * cm,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
    )
    story.append(Paragraph('RECEIPT', receipt_style))

    # ── Order info table ──────────────────────────────────────────────────────
    if order.user:
        customer_name  = f'{order.user.first_name} {order.user.last_name}'.strip()
        customer_email = order.user.email
        customer_phone = getattr(order.user, 'phone_number', None) or '-'
    else:
        customer_name  = order.guest_name  or 'Guest Customer'
        customer_email = order.guest_email or '-'
        customer_phone = order.guest_phone or '-'

    status_display = {
        'whatsapp_pending': 'Awaiting Payment',
        'paid':             'Paid',
        'processing':       'Processing',
        'shipped':          'Shipped',
        'delivered':        'Delivered',
        'cancelled':        'Cancelled',
    }.get(order.status, order.status.title())

    info_data = [
        ['Reference:', order.reference,        'Date:',   order.created_at.strftime('%d %B %Y')],
        ['Customer:', customer_name,           'Status:', status_display],
        ['Email:',    customer_email,          'Phone:',  customer_phone],
        ['Delivery:', order.delivery_address or '-', '',  ''],
    ]

    info_table = Table(info_data, colWidths=[3 * cm, 7 * cm, 2.5 * cm, 5 * cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME',       (0, 0), (0, -1),  'Helvetica-Bold'),
        ('FONTNAME',       (2, 0), (2, -1),  'Helvetica-Bold'),
        ('FONTSIZE',       (0, 0), (-1, -1), 9),
        ('TEXTCOLOR',      (0, 0), (0, -1),  FOREST_GREEN),
        ('TEXTCOLOR',      (2, 0), (2, -1),  FOREST_GREEN),
        ('TEXTCOLOR',      (1, 0), (1, -1),  CHARCOAL),
        ('TEXTCOLOR',      (3, 0), (3, -1),  CHARCOAL),
        ('VALIGN',         (0, 0), (-1, -1), 'TOP'),
        ('ROWBACKGROUNDS', (0, 0), (-1, -1), [CREAM, white]),
        ('TOPPADDING',     (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING',  (0, 0), (-1, -1), 6),
        ('LEFTPADDING',    (0, 0), (-1, -1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Items table ───────────────────────────────────────────────────────────
    story.append(HRFlowable(width='100%', thickness=1, color=FOREST_GREEN))
    story.append(Spacer(1, 0.2 * cm))

    items_header = [['Product', 'Qty', 'Unit Price', 'Subtotal']]
    items_data = []

    for item in order.items.all():
        product_name = item.product.name if item.product else 'Product (Deleted)'
        unit_price   = float(item.unit_price)
        subtotal     = unit_price * item.quantity
        items_data.append([
            product_name,
            str(item.quantity),
            f'GH₵ {unit_price:.2f}',
            f'GH₵ {subtotal:.2f}',
        ])

    items_table = Table(
        items_header + items_data,
        colWidths=[9 * cm, 2 * cm, 3.5 * cm, 3 * cm],
    )
    items_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND',     (0, 0),  (-1, 0),  FOREST_GREEN),
        ('TEXTCOLOR',      (0, 0),  (-1, 0),  white),
        ('FONTNAME',       (0, 0),  (-1, 0),  'Helvetica-Bold'),
        ('FONTSIZE',       (0, 0),  (-1, 0),  10),
        ('ALIGN',          (1, 0),  (-1, -1), 'RIGHT'),
        ('ALIGN',          (0, 0),  (0, -1),  'LEFT'),
        # Data rows
        ('FONTSIZE',       (0, 1),  (-1, -1), 9),
        ('ROWBACKGROUNDS', (0, 1),  (-1, -1), [white, LIGHT_GREEN]),
        ('TOPPADDING',     (0, 0),  (-1, -1), 8),
        ('BOTTOMPADDING',  (0, 0),  (-1, -1), 8),
        ('LEFTPADDING',    (0, 0),  (-1, -1), 8),
        ('RIGHTPADDING',   (0, 0),  (-1, -1), 8),
        ('GRID',           (0, 0),  (-1, -1), 0.5, HexColor('#E5E7EB')),
    ]))
    story.append(items_table)
    story.append(Spacer(1, 0.3 * cm))

    # ── Totals ────────────────────────────────────────────────────────────────
    discount = float(order.discount_amount or 0)
    total    = float(order.total_amount or 0)
    final    = total - discount

    totals_data = []
    if order.promo_code:
        totals_data.append(['Subtotal:', f'GH₵ {total:.2f}'])
        totals_data.append([f'Discount ({order.promo_code.code}):', f'-GH₵ {discount:.2f}'])
    totals_data.append(['TOTAL PAID:', f'GH₵ {final:.2f}'])

    totals_table = Table(totals_data, colWidths=[13.5 * cm, 4 * cm])

    style_cmds = [
        ('ALIGN',         (0, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE',      (0, 0), (-1, -1), 10),
        ('TOPPADDING',    (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    last_row = len(totals_data) - 1
    style_cmds += [
        ('FONTNAME',      (0, last_row), (-1, last_row), 'Helvetica-Bold'),
        ('FONTSIZE',      (0, last_row), (-1, last_row), 12),
        ('BACKGROUND',    (0, last_row), (-1, last_row), GHANA_GOLD),
        ('TEXTCOLOR',     (0, last_row), (-1, last_row), FOREST_GREEN),
        ('TOPPADDING',    (0, last_row), (-1, last_row), 8),
        ('BOTTOMPADDING', (0, last_row), (-1, last_row), 8),
    ]
    totals_table.setStyle(TableStyle(style_cmds))
    story.append(totals_table)
    story.append(Spacer(1, 0.5 * cm))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(
        width='100%', thickness=2, color=GHANA_GOLD, spaceAfter=0.3 * cm,
    ))

    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        textColor=GREY,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    story.append(Paragraph(
        'Thank you for choosing Legit Organic! '
        'We are committed to delivering clean, genuine organic food.',
        footer_style,
    ))
    story.append(Paragraph(
        f'Generated on {timezone.now().strftime("%d %B %Y at %H:%M")} · legitorganic.com',
        footer_style,
    ))

    doc.build(story)
    buffer.seek(0)

    filename = f'LegitOrganic_Receipt_{order.reference}.pdf'
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response
