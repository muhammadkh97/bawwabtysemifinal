-- استخراج قيم enum order_status
SELECT 
    enumlabel as "قيم order_status"
FROM pg_enum
WHERE enumtypid = 'order_status'::regtype
ORDER BY enumsortorder;

-- استخراج قيم enum payment_status
SELECT 
    enumlabel as "قيم payment_status"
FROM pg_enum
WHERE enumtypid = 'payment_status'::regtype
ORDER BY enumsortorder;
