/**
 * QR Code and OTP utilities for order handoff system
 * Handles generation, validation, and verification
 */

import { supabase } from './supabase'

export interface QRCodeData {
  type: 'pickup' | 'delivery'
  order_id: string
  otp: string
  timestamp: string
}

export interface OTPData {
  code: string
  expiresAt: Date
}

/**
 * Generate pickup codes (QR + OTP) for driver to pick up from vendor
 */
export async function generatePickupCodes(orderId: string): Promise<{
  qrCode: string
  otp: string
  expiresAt: Date
} | null> {
  try {
    const { data, error } = await supabase.rpc('generate_pickup_codes', {
      order_uuid: orderId,
    })

    if (error) throw error

    return {
      qrCode: data[0].qr_code,
      otp: data[0].otp,
      expiresAt: new Date(data[0].expires_at),
    }
  } catch (error) {
    console.error('Error generating pickup codes:', error)
    return null
  }
}

/**
 * Generate delivery codes (QR + OTP) for customer to receive from driver
 */
export async function generateDeliveryCodes(orderId: string): Promise<{
  qrCode: string
  otp: string
  expiresAt: Date
} | null> {
  try {
    const { data, error } = await supabase.rpc('generate_delivery_codes', {
      order_uuid: orderId,
    })

    if (error) throw error

    return {
      qrCode: data[0].qr_code,
      otp: data[0].otp,
      expiresAt: new Date(data[0].expires_at),
    }
  } catch (error) {
    console.error('Error generating delivery codes:', error)
    return null
  }
}

/**
 * Verify pickup using OTP code
 */
export async function verifyPickupWithOTP(
  orderId: string,
  otp: string,
  driverId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('verify_pickup_otp', {
      order_uuid: orderId,
      provided_otp: otp,
      driver_id: driverId,
    })

    if (error) throw error
    return data === true
  } catch (error) {
    console.error('Error verifying pickup OTP:', error)
    return false
  }
}

/**
 * Verify delivery using OTP code
 */
export async function verifyDeliveryWithOTP(
  orderId: string,
  otp: string,
  customerId: string,
  signature?: string,
  photo?: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('verify_delivery_otp', {
      order_uuid: orderId,
      provided_otp: otp,
      customer_id: customerId,
      signature_data: signature || null,
      photo_url: photo || null,
    })

    if (error) throw error
    return data === true
  } catch (error) {
    console.error('Error verifying delivery OTP:', error)
    return false
  }
}

/**
 * Verify pickup using QR code data
 */
export async function verifyPickupWithQR(
  qrData: string,
  driverId: string
): Promise<boolean> {
  try {
    const parsed: QRCodeData = JSON.parse(qrData)

    if (parsed.type !== 'pickup') {
      throw new Error('Invalid QR code type')
    }

    return await verifyPickupWithOTP(parsed.order_id, parsed.otp, driverId)
  } catch (error) {
    console.error('Error verifying pickup QR:', error)
    return false
  }
}

/**
 * Verify delivery using QR code data
 */
export async function verifyDeliveryWithQR(
  qrData: string,
  customerId: string,
  signature?: string,
  photo?: string
): Promise<boolean> {
  try {
    const parsed: QRCodeData = JSON.parse(qrData)

    if (parsed.type !== 'delivery') {
      throw new Error('Invalid QR code type')
    }

    return await verifyDeliveryWithOTP(
      parsed.order_id,
      parsed.otp,
      customerId,
      signature,
      photo
    )
  } catch (error) {
    console.error('Error verifying delivery QR:', error)
    return false
  }
}

/**
 * Check if OTP has expired
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * Format OTP for display (XXX-XXX)
 */
export function formatOTP(otp: string): string {
  if (otp.length !== 6) return otp
  return `${otp.slice(0, 3)}-${otp.slice(3)}`
}

/**
 * Get time remaining until OTP expires
 */
export function getOTPTimeRemaining(expiresAt: Date): string {
  const now = new Date()
  const diff = expiresAt.getTime() - now.getTime()

  if (diff <= 0) return 'منتهي الصلاحية'

  const minutes = Math.floor(diff / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)

  if (minutes > 0) {
    return `${minutes} دقيقة و ${seconds} ثانية`
  }
  return `${seconds} ثانية`
}

/**
 * Get handoff history for an order
 */
export async function getOrderHandoffs(orderId: string) {
  try {
    const { data, error } = await supabase
      .from('order_handoffs')
      .select(`
        *,
        to_user:to_user_id (name, email),
        from_user:from_user_id (name, email)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching handoffs:', error)
    return []
  }
}

/**
 * Create manual handoff record (for admin/support)
 */
export async function createManualHandoff(
  orderId: string,
  type: 'pickup' | 'delivery',
  toUserId: string,
  fromUserId: string,
  notes: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('order_handoffs').insert({
      order_id: orderId,
      handoff_type: type,
      method: 'manual',
      to_user_id: toUserId,
      from_user_id: fromUserId,
      notes,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error creating manual handoff:', error)
    return false
  }
}

/**
 * Validate QR code structure
 */
export function validateQRData(qrData: string): {
  valid: boolean
  data?: QRCodeData
  error?: string
} {
  try {
    const parsed = JSON.parse(qrData)

    if (!parsed.type || !['pickup', 'delivery'].includes(parsed.type)) {
      return { valid: false, error: 'نوع QR غير صالح' }
    }

    if (!parsed.order_id || typeof parsed.order_id !== 'string') {
      return { valid: false, error: 'معرف الطلب غير صالح' }
    }

    if (!parsed.otp || !/^\d{6}$/.test(parsed.otp)) {
      return { valid: false, error: 'رمز OTP غير صالح' }
    }

    return { valid: true, data: parsed }
  } catch (error) {
    return { valid: false, error: 'بيانات QR تالفة' }
  }
}

/**
 * Generate random 6-digit OTP (client-side fallback)
 */
export function generateClientOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
