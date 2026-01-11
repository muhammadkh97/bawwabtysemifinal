/**
 * Logger Utility - للتسجيل الآمن في بيئات مختلفة
 * يعمل فقط في Development، مخفي تماماً في Production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  /**
   * تسجيل رسالة debug - للتطوير فقط
   */
  debug(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.log(`🔍 [DEBUG] ${message}`, data || '');
    }
  }

  /**
   * تسجيل رسالة معلومات
   */
  info(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
  }

  /**
   * تسجيل تحذير
   */
  warn(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, data || '');
    }
  }

  /**
   * تسجيل خطأ - يظهر دائماً لأنه مهم
   */
  error(message: string, error?: Error | LogData) {
    // في Production، نرسل للـ error tracking service
    if (!this.isDevelopment) {
      // TODO: أرسل للـ Sentry أو error tracking service
      // this.sendToErrorTracking(message, error);
      return;
    }

    // في Development، نعرض التفاصيل الكاملة
    console.error(`❌ [ERROR] ${message}`, error || '');
    
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
  }

  /**
   * تسجيل نجاح عملية
   */
  success(message: string, data?: LogData) {
    if (this.isDevelopment) {
      console.log(`✅ [SUCCESS] ${message}`, data || '');
    }
  }

  /**
   * تسجيل بداية عملية
   */
  start(operation: string) {
    if (this.isDevelopment) {
      console.log(`🚀 [START] ${operation}`);
    }
  }

  /**
   * تسجيل نهاية عملية
   */
  end(operation: string, duration?: number) {
    if (this.isDevelopment) {
      const durationText = duration ? ` (${duration}ms)` : '';
      console.log(`🏁 [END] ${operation}${durationText}`);
    }
  }

  /**
   * قياس وقت تنفيذ دالة
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    this.start(operation);
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.end(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${operation} failed after ${duration}ms`, error as Error);
      throw error;
    }
  }

  /**
   * إرسال للـ error tracking service (للمستقبل)
   */
  private sendToErrorTracking(message: string, error?: Error | LogData) {
    // TODO: تكامل مع Sentry أو Bugsnag
    // Sentry.captureException(error, {
    //   tags: { message }
    // });
  }
}

// تصدير instance واحد
export const logger = new Logger();

// تصدير كـ default للاستخدام السهل
export default logger;
