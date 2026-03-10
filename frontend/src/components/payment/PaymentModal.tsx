/**
 * Payment Modal - Mayar API Integration
 * Handles SaaS/PaaS payments in the metaverse
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, CreditCard, Zap, Building2 } from 'lucide-react';

interface PaymentModalProps {
  onClose: () => void;
  user: {
    id: string;
    walletAddress: string;
    username: string;
  } | null;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: string;
  features: string[];
  recommended?: boolean;
}

interface PaymentStatus {
  status: 'idle' | 'processing' | 'success' | 'error';
  message: string;
  transactionId?: string;
}

export default function PaymentModal({ onClose, user }: PaymentModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [_selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'idle',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch subscription plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/api/plans`);
        
        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans);
        } else {
          // Fallback plans
          setPlans([
            {
              id: 'free',
              name: 'Free',
              description: 'Basic access to AODS metaverse',
              price: 0,
              currency: 'IDR',
              billingCycle: 'monthly',
              features: ['Basic 3D Access', 'Limited Assets', 'Community Support']
            },
            {
              id: 'pro',
              name: 'Pro',
              description: 'Professional metaverse tools',
              price: 99000,
              currency: 'IDR',
              billingCycle: 'monthly',
              features: ['Advanced 3D', 'Unlimited Assets', 'AI Assistant', 'VR Access'],
              recommended: true
            },
            {
              id: 'enterprise',
              name: 'Enterprise',
              description: 'Full enterprise orchestration',
              price: 499000,
              currency: 'IDR',
              billingCycle: 'monthly',
              features: ['All Features', 'Dedicated Support', 'Custom Integrations', 'SLA Guarantee']
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Process payment through Mayar
  const processPayment = async (plan: Plan) => {
    if (!user) {
      setPaymentStatus({
        status: 'error',
        message: 'Please connect your wallet first'
      });
      return;
    }

    setPaymentStatus({ status: 'processing', message: 'Initializing payment...' });
    setSelectedPlan(plan);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      // Create payment request
      const response = await fetch(`${apiUrl}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          userId: user.id,
          walletAddress: user.walletAddress,
          amount: plan.price,
          currency: plan.currency,
          description: `AODS ${plan.name} Subscription`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const paymentData = await response.json();
      
      // In sandbox mode, simulate payment flow
      if (paymentData.sandboxMode) {
        setPaymentStatus({
          status: 'processing',
          message: 'Sandbox mode: Simulating payment...'
        });

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate success (90% success rate in sandbox)
        const success = Math.random() > 0.1;

        if (success) {
          setPaymentStatus({
            status: 'success',
            message: 'Payment successful!',
            transactionId: paymentData.transactionId
          });

          // Notify backend of successful payment
          await fetch(`${apiUrl}/api/payments/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: paymentData.transactionId,
              status: 'success'
            })
          });
        } else {
          setPaymentStatus({
            status: 'error',
            message: 'Payment failed. Please try again.'
          });
        }
      } else {
        // Production mode: Redirect to Mayar payment page
        if (paymentData.paymentUrl) {
          window.open(paymentData.paymentUrl, '_blank');
          setPaymentStatus({
            status: 'processing',
            message: 'Complete payment in the new window'
          });
        }
      }
    } catch (error) {
      setPaymentStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Payment failed'
      });
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
            Upgrade Your AODS Experience
          </DialogTitle>
        </DialogHeader>

        {paymentStatus.status === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mb-4" />
            <p className="text-lg">{paymentStatus.message}</p>
          </div>
        )}

        {paymentStatus.status === 'success' && (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
            <p className="text-xl font-semibold text-green-400">{paymentStatus.message}</p>
            {paymentStatus.transactionId && (
              <p className="text-sm text-slate-400 mt-2">
                Transaction ID: {paymentStatus.transactionId}
              </p>
            )}
            <Button onClick={onClose} className="mt-6">
              Continue to Metaverse
            </Button>
          </div>
        )}

        {paymentStatus.status === 'error' && (
          <div className="flex flex-col items-center justify-center py-8">
            <XCircle className="w-16 h-16 text-red-400 mb-4" />
            <p className="text-xl font-semibold text-red-400">{paymentStatus.message}</p>
            <Button onClick={() => setPaymentStatus({ status: 'idle', message: '' })} className="mt-6">
              Try Again
            </Button>
          </div>
        )}

        {paymentStatus.status === 'idle' && (
          <>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id}
                    className={`relative ${
                      plan.recommended 
                        ? 'border-cyan-400 border-2' 
                        : 'border-slate-700'
                    } bg-slate-800`}
                  >
                    {plan.recommended && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-purple-500">
                        Recommended
                      </Badge>
                    )}
                    
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center gap-2">
                        {plan.id === 'free' && <Zap className="w-5 h-5" />}
                        {plan.id === 'pro' && <CreditCard className="w-5 h-5" />}
                        {plan.id === 'enterprise' && <Building2 className="w-5 h-5" />}
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="text-3xl font-bold text-white mb-4">
                        {formatPrice(plan.price, plan.currency)}
                        <span className="text-sm font-normal text-slate-400">/{plan.billingCycle}</span>
                      </div>
                      
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <CardFooter>
                      <Button
                        onClick={() => processPayment(plan)}
                        disabled={!user}
                        className={`w-full ${
                          plan.recommended
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600'
                            : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      >
                        {plan.price === 0 ? 'Get Started' : 'Subscribe'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {!user && (
              <p className="text-center text-amber-400 mt-4">
                Connect your wallet to subscribe
              </p>
            )}

            <div className="mt-6 p-4 bg-slate-800 rounded-lg">
              <p className="text-sm text-slate-400 text-center">
                Powered by <span className="text-cyan-400 font-semibold">Mayar</span> Payment Gateway
              </p>
              <p className="text-xs text-slate-500 text-center mt-1">
                Sandbox Mode Active - No real charges will be made
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
