import io
from pathlib import Path

from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

FOREST = HexColor('#0D3B2A')
LEAF = HexColor('#2E7D32')
GOLD = HexColor('#F4C430')
CREAM = HexColor('#FAF7F0')
PALE_GREEN = HexColor('#EDF7EE')
INK = HexColor('#18231D')
MUTED = HexColor('#6F756F')
LINE = HexColor('#DDD7CB')


def _money(value):
    return f'GHS {float(value or 0):,.2f}'


def _brand_mark(styles):
    """Render the real brand artwork when the monorepo asset is available."""
    try:
        import cairosvg

        logo_path = (
            Path(settings.BASE_DIR).parent / 'frontend' / 'public' / 'images' / 'logo-lightmode.svg'
        )
        png = cairosvg.svg2png(bytestring=logo_path.read_bytes(), output_width=710)
        mark = Image(io.BytesIO(png), width=5.1 * cm, height=2.01 * cm)
        mark.hAlign = 'LEFT'
        return mark
    except Exception:
        return Paragraph('LEGIT ORGANIC', styles['brand'])


def _page_frame(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(FOREST)
    canvas.rect(0, height - 0.34 * cm, width, 0.34 * cm, stroke=0, fill=1)
    canvas.setFillColor(GOLD)
    canvas.rect(0, height - 0.42 * cm, width, 0.08 * cm, stroke=0, fill=1)
    canvas.setStrokeColor(LINE)
    canvas.line(doc.leftMargin, 1.42 * cm, width - doc.rightMargin, 1.42 * cm)
    canvas.setFillColor(MUTED)
    canvas.setFont('Helvetica', 7.5)
    canvas.drawString(
        doc.leftMargin, 0.92 * cm, 'legitorganic.com  |  hello@legitorganic.com  |  Accra, Ghana'
    )
    canvas.drawRightString(width - doc.rightMargin, 0.92 * cm, f'Page {doc.page}')
    canvas.restoreState()


def generate_receipt_pdf(order):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.7 * cm,
        leftMargin=1.7 * cm,
        topMargin=1.45 * cm,
        bottomMargin=1.8 * cm,
        title=f'Legit Organic receipt {order.reference}',
        author='Legit Organic Limited',
    )
    base = getSampleStyleSheet()
    styles = {
        'brand': ParagraphStyle(
            'Brand', fontName='Helvetica-Bold', fontSize=18, leading=20, textColor=FOREST
        ),
        'eyebrow': ParagraphStyle(
            'Eyebrow',
            fontName='Helvetica-Bold',
            fontSize=7.5,
            leading=10,
            textColor=LEAF,
            spaceAfter=4,
        ),
        'title': ParagraphStyle(
            'Title', fontName='Helvetica-Bold', fontSize=28, leading=31, textColor=INK
        ),
        'right': ParagraphStyle(
            'Right',
            parent=base['Normal'],
            alignment=TA_RIGHT,
            fontSize=8.5,
            leading=13,
            textColor=MUTED,
        ),
        'body': ParagraphStyle(
            'Body', parent=base['Normal'], fontSize=9, leading=14, textColor=INK
        ),
        'muted': ParagraphStyle(
            'Muted', parent=base['Normal'], fontSize=8, leading=12, textColor=MUTED
        ),
        'label': ParagraphStyle(
            'Label', fontName='Helvetica-Bold', fontSize=7, leading=10, textColor=MUTED
        ),
        'amount': ParagraphStyle(
            'Amount',
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=22,
            alignment=TA_RIGHT,
            textColor=FOREST,
        ),
    }
    story = []

    source_label = 'WEEKLY DELIVERY' if order.order_source == 'subscription' else 'MARKET ORDER'
    header = Table(
        [
            [_brand_mark(styles), Paragraph(source_label, styles['right'])],
            [
                Paragraph('Food with a clear way home.', styles['muted']),
                Paragraph(
                    f'<b>{order.reference}</b><br/>{order.created_at.strftime("%d %B %Y")}',
                    styles['right'],
                ),
            ],
        ],
        colWidths=[10.5 * cm, 6.6 * cm],
    )
    header.setStyle(
        TableStyle(
            [
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ]
        )
    )
    story.extend([header, Spacer(1, 0.75 * cm)])

    paid = order.payment_status == 'success'
    status_display = {
        'pending': 'Awaiting payment',
        'whatsapp_pending': 'Awaiting payment',
        'paid': 'Payment confirmed',
        'processing': 'Being prepared',
        'shipped': 'On the way',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
    }.get(order.status, order.status.replace('_', ' ').title())
    payment_label = 'PAID' if paid else order.payment_status.upper()
    provider_label = (
        'SeevCash'
        if order.payment_provider.lower() == 'seevcash'
        else (order.payment_provider.title() or 'payment provider')
    )
    payment_line = (
        f'Paid securely via {provider_label}'
        if paid
        else f'Payment via {provider_label} is not yet confirmed'
    )
    summary = Table(
        [
            [Paragraph('RECEIPT', styles['eyebrow']), Paragraph(payment_label, styles['eyebrow'])],
            [
                Paragraph('Order summary', styles['title']),
                Paragraph(_money(order.final_amount), styles['amount']),
            ],
            [Paragraph(f'{status_display}  |  {payment_line}', styles['muted']), ''],
        ],
        colWidths=[10.5 * cm, 6.6 * cm],
    )
    summary.setStyle(
        TableStyle(
            [
                ('BACKGROUND', (0, 0), (-1, -1), PALE_GREEN if paid else CREAM),
                ('BOX', (0, 0), (-1, -1), 0.7, HexColor('#BFD2C2') if paid else LINE),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('SPAN', (0, 2), (1, 2)),
                ('LEFTPADDING', (0, 0), (-1, -1), 14),
                ('RIGHTPADDING', (0, 0), (-1, -1), 14),
                ('TOPPADDING', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 1), (-1, 1), 8),
                ('BOTTOMPADDING', (0, 2), (-1, 2), 12),
            ]
        )
    )
    story.extend([summary, Spacer(1, 0.7 * cm)])

    if order.user:
        customer_name = order.user.get_full_name().strip() or order.user.email
        customer_email = order.user.email
        customer_phone = getattr(order.user, 'phone_number', None) or '-'
    else:
        customer_name = order.guest_name or 'Guest customer'
        customer_email = order.guest_email or '-'
        customer_phone = order.guest_phone or '-'

    parties = Table(
        [
            [Paragraph('DELIVER TO', styles['label']), Paragraph('SOLD BY', styles['label'])],
            [
                Paragraph(
                    f'<b>{customer_name}</b><br/>{customer_email}<br/>{customer_phone}<br/>{order.delivery_address or "Delivery address not provided"}',
                    styles['body'],
                ),
                Paragraph(
                    '<b>Legit Organic Limited</b><br/>Accra, Ghana<br/>hello@legitorganic.com<br/>+233 539 569 260',
                    styles['body'],
                ),
            ],
        ],
        colWidths=[8.55 * cm, 8.55 * cm],
    )
    parties.setStyle(
        TableStyle(
            [
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BOX', (0, 0), (-1, -1), 0.6, LINE),
                ('LINEBEFORE', (1, 0), (1, -1), 0.6, LINE),
                ('BACKGROUND', (0, 0), (-1, 0), CREAM),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
            ]
        )
    )
    story.extend([parties, Spacer(1, 0.7 * cm), Paragraph('WHAT YOU ORDERED', styles['eyebrow'])])

    item_rows = [['Item', 'Qty', 'Unit price', 'Amount']]
    for item in order.items.all():
        name = item.product.name if item.product else 'Product no longer listed'
        item_rows.append(
            [
                Paragraph(name, styles['body']),
                str(item.quantity),
                _money(item.unit_price),
                _money(float(item.unit_price) * item.quantity),
            ]
        )
    items = Table(item_rows, colWidths=[8.7 * cm, 1.6 * cm, 3.4 * cm, 3.4 * cm], repeatRows=1)
    items.setStyle(
        TableStyle(
            [
                ('BACKGROUND', (0, 0), (-1, 0), FOREST),
                ('TEXTCOLOR', (0, 0), (-1, 0), white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LINEBELOW', (0, 1), (-1, -1), 0.5, LINE),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, CREAM]),
                ('TOPPADDING', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.extend([items, Spacer(1, 0.45 * cm)])

    subtotal = float(order.total_amount or 0)
    discount = float(order.discount_amount or 0)
    totals_rows = [['Subtotal', _money(subtotal)]]
    if discount:
        promo = f' ({order.promo_code.code})' if order.promo_code else ''
        totals_rows.append([f'Discount{promo}', f'-{_money(discount)}'])
    totals_rows.append(['Total paid' if paid else 'Total', _money(order.final_amount)])
    totals = Table(totals_rows, colWidths=[4.1 * cm, 3.5 * cm], hAlign='RIGHT')
    last = len(totals_rows) - 1
    totals.setStyle(
        TableStyle(
            [
                ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                ('TEXTCOLOR', (0, 0), (-1, -2), MUTED),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LINEABOVE', (0, last), (-1, last), 1, FOREST),
                ('FONTNAME', (0, last), (-1, last), 'Helvetica-Bold'),
                ('FONTSIZE', (0, last), (-1, last), 12),
                ('TEXTCOLOR', (0, last), (-1, last), FOREST),
                ('BACKGROUND', (0, last), (-1, last), PALE_GREEN),
            ]
        )
    )
    story.extend([totals, Spacer(1, 0.75 * cm)])

    note = (
        'This receipt covers a customer-approved weekly delivery. Future renewals are never charged automatically.'
        if order.order_source == 'subscription'
        else 'Keep this receipt for your records. Your order reference is the quickest way for us to help.'
    )
    story.append(
        KeepTogether(
            [
                HRFlowable(width='100%', thickness=0.7, color=LINE, spaceAfter=0.3 * cm),
                Paragraph(note, styles['muted']),
                Spacer(1, 0.16 * cm),
                Paragraph(
                    f'Issued {timezone.localtime().strftime("%d %B %Y at %H:%M")}. Thank you for choosing food grown with care.',
                    styles['muted'],
                ),
            ]
        )
    )

    doc.build(story, onFirstPage=_page_frame, onLaterPages=_page_frame)
    buffer.seek(0)
    response = HttpResponse(buffer, content_type='application/pdf')
    response['Content-Disposition'] = (
        f'attachment; filename="LegitOrganic_Receipt_{order.reference}.pdf"'
    )
    return response
