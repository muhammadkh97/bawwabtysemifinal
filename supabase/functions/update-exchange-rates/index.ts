import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExchangeRate {
  currency: string;
  rate: number;
}

/**
 * Supabase Edge Function لتحديث أسعار الصرف من APIs عالمية
 * يمكن تشغيلها يدوياً أو عبر Cron Job كل 24 ساعة
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )


    // جلب الأسعار من multiple APIs للموثوقية
    const rates = await fetchExchangeRates()

    if (!rates || rates.length === 0) {
      throw new Error('Failed to fetch exchange rates from all sources')
    }

    // تحديث قاعدة البيانات
    const { data, error } = await supabaseClient.rpc('update_exchange_rates', {
      p_rates: rates,
      p_source: 'ExchangeRate-API',
    })

    if (error) {
      console.error('❌ Database update error:', error)
      throw error
    }


    return new Response(
      JSON.stringify({
        success: true,
        count: data,
        rates: rates,
        timestamp: new Date().toISOString(),
        message: `تم تحديث ${data} سعر صرف بنجاح`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('❌ Error updating exchange rates:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

/**
 * جلب أسعار الصرف من APIs متعددة مع fallback
 */
async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  const supportedCurrencies = ['USD', 'ILS', 'EUR', 'GBP', 'AED', 'EGP', 'JOD', 'KWD', 'QAR', 'OMR', 'BHD']
  
  // محاولة 1: ExchangeRate-API (مجاني، بدون API key)
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/SAR', {
      headers: { 'User-Agent': 'Bawabty-Marketplace/1.0' }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.rates) {
      const rates: ExchangeRate[] = supportedCurrencies
        .filter(currency => data.rates[currency])
        .map(currency => ({
          currency,
          rate: parseFloat(data.rates[currency].toFixed(6)),
        }))

      return rates
    }
  } catch (error) {
    console.warn('⚠️ ExchangeRate-API failed:', error.message)
  }

  // محاولة 2: Frankfurter (مجاني، البنك المركزي الأوروبي)
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=SAR', {
      headers: { 'User-Agent': 'Bawabty-Marketplace/1.0' }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.rates) {
      const rates: ExchangeRate[] = supportedCurrencies
        .filter(currency => data.rates[currency])
        .map(currency => ({
          currency,
          rate: parseFloat(data.rates[currency].toFixed(6)),
        }))

      return rates
    }
  } catch (error) {
    console.warn('⚠️ Frankfurter API failed:', error.message)
  }

  // محاولة 3: Currency API (fawazahmed0 - مجاني)
  try {
    const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/sar.json', {
      headers: { 'User-Agent': 'Bawabty-Marketplace/1.0' }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()

    if (data.sar) {
      const rates: ExchangeRate[] = supportedCurrencies
        .filter(currency => data.sar[currency.toLowerCase()])
        .map(currency => ({
          currency,
          rate: parseFloat(data.sar[currency.toLowerCase()].toFixed(6)),
        }))

      if (rates.length > 0) {
        return rates
      }
    }
  } catch (error) {
    console.warn('⚠️ Currency API failed:', error.message)
  }

  // محاولة 4: حساب أسعار تقديرية بناءً على USD (Fallback النهائي)
  console.warn('⚠️ All APIs failed, using estimated rates as fallback')
  try {
    // أسعار تقريبية معروفة (يتم تحديثها يدوياً)
    const estimatedRates = {
      USD: 0.27,
      EUR: 0.24,
      GBP: 0.21,
      AED: 0.98,
      EGP: 13.2,
      JOD: 0.19,
      KWD: 0.08,
      QAR: 0.97,
      OMR: 0.10,
      BHD: 0.10,
      ILS: 0.95,
    }

    const rates: ExchangeRate[] = Object.entries(estimatedRates).map(([currency, rate]) => ({
      currency,
      rate: parseFloat(rate.toFixed(6)),
    }))

    return rates
  } catch (error) {
    console.error('❌ All methods failed:', error)
    return []
  }
}
