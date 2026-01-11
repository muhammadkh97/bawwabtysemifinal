import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const orderId = params.id;

    // Get order details with relationships
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customer:users!orders_customer_id_fkey(id, full_name, email, phone),
        vendor:stores!orders_vendor_id_fkey(id, name, name_ar, phone, email, address),
        driver:users!orders_driver_id_fkey(id, full_name, phone)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Generate simple HTML invoice
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>فاتورة رقم ${order.order_number}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      direction: rtl;
      padding: 40px;
      color: #333;
    }
    .invoice-header {
      text-align: center;
      border-bottom: 3px solid #4CAF50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .invoice-header h1 {
      margin: 0;
      color: #4CAF50;
    }
    .info-section {
      margin: 20px 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .info-box {
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 5px;
    }
    .info-box h3 {
      margin-top: 0;
      color: #4CAF50;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .items-table th {
      background: #4CAF50;
      color: white;
      padding: 12px;
      text-align: right;
    }
    .items-table td {
      padding: 10px;
      border-bottom: 1px solid #ddd;
      text-align: right;
    }
    .items-table tr:hover {
      background: #f5f5f5;
    }
    .totals {
      margin-top: 20px;
      text-align: left;
      width: 40%;
      margin-left: auto;
    }
    .totals table {
      width: 100%;
    }
    .totals td {
      padding: 8px;
      text-align: right;
    }
    .totals .total-row {
      font-size: 18px;
      font-weight: bold;
      border-top: 2px solid #4CAF50;
      color: #4CAF50;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #777;
      font-size: 12px;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
    }
    .status-delivered {
      background: #4CAF50;
      color: white;
    }
    .status-pending {
      background: #FFC107;
      color: white;
    }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-header">
    <h1>🧾 فاتورة</h1>
    <p>رقم الفاتورة: <strong>${order.order_number}</strong></p>
    <p>التاريخ: <strong>${new Date(order.created_at).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}</strong></p>
    <span class="status-badge status-${order.status === 'delivered' ? 'delivered' : 'pending'}">
      ${getStatusText(order.status)}
    </span>
  </div>

  <div class="info-section">
    <div class="info-box">
      <h3>📍 معلومات المتجر</h3>
      <p><strong>الاسم:</strong> ${order.vendor?.name || order.vendor?.name_ar || 'غير متوفر'}</p>
      ${order.vendor?.phone ? `<p><strong>الهاتف:</strong> ${order.vendor.phone}</p>` : ''}
      ${order.vendor?.email ? `<p><strong>البريد:</strong> ${order.vendor.email}</p>` : ''}
      ${order.vendor?.address ? `<p><strong>العنوان:</strong> ${order.vendor.address}</p>` : ''}
    </div>

    <div class="info-box">
      <h3>👤 معلومات العميل</h3>
      <p><strong>الاسم:</strong> ${order.customer?.full_name || 'غير متوفر'}</p>
      ${order.customer?.phone ? `<p><strong>الهاتف:</strong> ${order.customer.phone}</p>` : ''}
      ${order.customer?.email ? `<p><strong>البريد:</strong> ${order.customer.email}</p>` : ''}
      ${order.delivery_address ? `<p><strong>عنوان التوصيل:</strong> ${order.delivery_address}</p>` : ''}
    </div>
  </div>

  ${order.driver ? `
  <div class="info-section">
    <div class="info-box">
      <h3>🚗 معلومات السائق</h3>
      <p><strong>الاسم:</strong> ${order.driver.full_name || 'غير متوفر'}</p>
      ${order.driver.phone ? `<p><strong>الهاتف:</strong> ${order.driver.phone}</p>` : ''}
    </div>
  </div>
  ` : ''}

  <h2 style="margin-top: 30px;">📦 تفاصيل الطلب</h2>
  <table class="items-table">
    <thead>
      <tr>
        <th>المنتج</th>
        <th>الكمية</th>
        <th>السعر</th>
        <th>الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${(order.items || []).map((item: any) => `
        <tr>
          <td>${item.name || item.name_ar || 'منتج'}</td>
          <td>${item.quantity}</td>
          <td>${item.price?.toFixed(2) || '0.00'} ${order.currency || 'د.أ'}</td>
          <td>${((item.price || 0) * (item.quantity || 0)).toFixed(2)} ${order.currency || 'د.أ'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td>المجموع الفرعي:</td>
        <td><strong>${order.subtotal?.toFixed(2) || '0.00'} ${order.currency || 'د.أ'}</strong></td>
      </tr>
      ${order.delivery_fee ? `
      <tr>
        <td>رسوم التوصيل:</td>
        <td><strong>${order.delivery_fee.toFixed(2)} ${order.currency || 'د.أ'}</strong></td>
      </tr>
      ` : ''}
      ${order.tax ? `
      <tr>
        <td>الضريبة:</td>
        <td><strong>${order.tax.toFixed(2)} ${order.currency || 'د.أ'}</strong></td>
      </tr>
      ` : ''}
      ${order.discount ? `
      <tr>
        <td>الخصم:</td>
        <td><strong>-${order.discount.toFixed(2)} ${order.currency || 'د.أ'}</strong></td>
      </tr>
      ` : ''}
      <tr class="total-row">
        <td>المجموع الكلي:</td>
        <td><strong>${order.total?.toFixed(2) || '0.00'} ${order.currency || 'د.أ'}</strong></td>
      </tr>
    </table>
  </div>

  ${order.delivery_notes ? `
  <div style="margin-top: 30px; padding: 15px; background: #f9f9f9; border-radius: 5px;">
    <h3 style="margin-top: 0;">📝 ملاحظات التوصيل:</h3>
    <p>${order.delivery_notes}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p>شكراً لتسوقكم معنا! 🛍️</p>
    <p>تم إنشاء هذه الفاتورة بواسطة منصة بوابتي</p>
    <p style="margin-top: 10px;">
      <button class="no-print" onclick="(typeof window !== 'undefined' ? window.print : undefined)()" style="padding: 10px 30px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
        🖨️ طباعة الفاتورة
      </button>
    </p>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error generating invoice:', { error: errorMessage });
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

function getStatusText(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pending': '⏳ قيد الانتظار',
    'confirmed': '✅ مؤكد',
    'preparing': '👨‍🍳 قيد التحضير',
    'ready': '✔️ جاهز',
    'picked_up': '📦 تم الاستلام',
    'on_the_way': '🚗 في الطريق',
    'delivered': '✅ تم التوصيل',
    'cancelled': '❌ ملغي',
  };
  return statusMap[status] || status;
}
