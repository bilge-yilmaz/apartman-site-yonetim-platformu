'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  Title,
  Text,
  TextInput,
  Select,
  SelectItem,
  Button,
  Grid,
} from '@tremor/react'
import { PaymentInputsWrapper, usePaymentInputs } from 'react-payment-inputs';
import images from 'react-payment-inputs/images';

interface PaymentDetails {
  _id: string;
  amount: number;
  description?: string; 
  status: string;
}

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params.id as string

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [cardHolder, setCardHolder] = useState('');

  const { 
    meta, 
    wrapperProps, 
    getCardImageProps, 
    getCardNumberProps, 
    getExpiryDateProps, 
    getCVCProps 
  } = usePaymentInputs();

  useEffect(() => {
    if (!paymentId) return;

    const fetchPaymentData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/payments/${paymentId}`);
        if (!response.ok) {
          throw new Error('Ödeme bilgileri alınamadı.');
        }
        const data = await response.json();
        
        if (data.status.toLowerCase() !== 'pending') { 
          alert('Bu ödeme zaten yapılmış veya ödeme yapılamaz durumda.');
          router.push('/resident/payments');
          return;
        }
        setPaymentDetails(data);
      } catch (err: any) {
        setError(err.message || 'Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [paymentId, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (meta.error) {
      setError('Lütfen kart bilgilerinizi kontrol edin: ' + meta.error);
      setIsSubmitting(false);
      return;
    }

    console.log('Ödeme bilgileri (Hook meta):', meta);
    console.log('Kart Sahibi:', cardHolder);

    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'PAID' }), 
      });

      if (!response.ok) {
        throw new Error('Ödeme durumu güncellenemedi.');
      }

      alert('Ödeme başarıyla tamamlandı!');
      router.push('/resident/payments'); 

    } catch (err: any) {
      setError(err.message || 'Ödeme sırasında bir hata oluştu.');
      setIsSubmitting(false);
    } 
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Text color="red">Hata: {error}</Text>
      </div>
    )
  }

  if (!paymentDetails) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Text>Ödeme detayları bulunamadı.</Text>
      </div>
    )
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear + i);

  const getErrorMessage = (field?: string) => {
    if (meta.touchedInputs[field as keyof typeof meta.touchedInputs] && meta.erroredInputs[field as keyof typeof meta.erroredInputs]) {
      return meta.erroredInputs[field as keyof typeof meta.erroredInputs];
    }
    return undefined;
  }

  return (
    <div className="p-4 md:p-10 mx-auto max-w-2xl">
      <Card className="p-6">
        <Title className="mb-6 text-center text-2xl font-semibold">Ödeme Bilgileri</Title>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-md text-center">
          <Text className="text-gray-700">Ödenecek Tutar:</Text>
          <Text className="text-2xl font-bold text-blue-700 mt-1">
            ₺{paymentDetails.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Text className="mb-1">Kart Sahibi Adı</Text>
            <TextInput
              placeholder="Ad Soyad"
              required
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
            />
          </div>
          <div className="space-y-3">
            <Text className="mb-1">Kart Bilgileri</Text>
            <svg {...getCardImageProps({ images })} style={{ marginBottom: '5px', height: '24px' }} /> 
            <PaymentInputsWrapper {...wrapperProps}>
              <input {...getCardNumberProps({ onChange: (e) => console.log(e.target.value) })} className="tremor-TextInput-input w-full rounded-tremor-default border px-3 py-2 text-tremor-default shadow-tremor-input focus:border-tremor-brand-subtle focus:outline-none focus:ring-2 focus:ring-tremor-brand-muted dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content-emphasis dark:shadow-dark-tremor-input focus:dark:ring-dark-tremor-brand-muted" />
              <input {...getExpiryDateProps()} className="tremor-TextInput-input w-full rounded-tremor-default border px-3 py-2 text-tremor-default shadow-tremor-input focus:border-tremor-brand-subtle focus:outline-none focus:ring-2 focus:ring-tremor-brand-muted dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content-emphasis dark:shadow-dark-tremor-input focus:dark:ring-dark-tremor-brand-muted" />
              <input {...getCVCProps()} className="tremor-TextInput-input w-full rounded-tremor-default border px-3 py-2 text-tremor-default shadow-tremor-input focus:border-tremor-brand-subtle focus:outline-none focus:ring-2 focus:ring-tremor-brand-muted dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content-emphasis dark:shadow-dark-tremor-input focus:dark:ring-dark-tremor-brand-muted" />
            </PaymentInputsWrapper>
            {meta.error && meta.touchedInputs.cardNumber && <Text color="red" className="mt-1 text-xs">{getErrorMessage('cardNumber')}</Text>}
            {meta.error && meta.touchedInputs.expiryDate && <Text color="red" className="mt-1 text-xs">{getErrorMessage('expiryDate')}</Text>}
            {meta.error && meta.touchedInputs.cvc && <Text color="red" className="mt-1 text-xs">{getErrorMessage('cvc')}</Text>} 
          </div>
          {error && (
              <Text color="red" className="text-center">Hata: {error}</Text>
          )}
          <Button 
            type="submit" 
            className="w-full mt-6" 
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Ödemeyi Tamamla
          </Button>
        </form>
      </Card>
    </div>
  )
}
