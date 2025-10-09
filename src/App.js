import React, { useState } from 'react';
import { Upload, FileText, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51SFe3VGSXAViqFcQnsdax2I8fBUKfPaWfbl6cV4gU9EYsnwiSuOwxZoJQOOvEtlcWh1xOIzodkR2neqE85UQcQGo00O89tpobk');

function PaymentForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);
    const result = await stripe.confirmPayment({ elements, redirect: 'if_required' });
    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      onSuccess(result.paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <PaymentElement />
      {error && <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.25rem', color: '#dc2626', fontSize: '0.875rem' }}>{error}</div>}
      <button type="submit" disabled={!stripe || processing} style={{ width: '100%', background: processing ? '#9ca3af' : '#4f46e5', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '500', border: 'none', cursor: processing ? 'not-allowed' : 'pointer' }}>
        {processing ? 'Processing...' : 'Pay $25.00'}
      </button>
    </form>
  );
}

export default function NDAAnalyzer() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const response = await fetch('https://nda-clarity-backend-production.up.railway.app/api/create-payment', { method: 'POST', body: formData });
      if (!response.ok) throw new Error('Failed');
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError('Error processing document');
    } finally {
      setUploading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId) => {
    setAnalyzing(true);
    try {
      const response = await fetch('https://nda-clarity-backend-production.up.railway.app/api/analyze-after-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ paymentIntentId: paymentId }) });
      const result = await response.json();
      setAnalysis(result);
      setClientSecret(null);
    } catch (err) {
      setError('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAll = () => { setFile(null); setClientSecret(null); setAnalysis(null); setError(null); };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)', padding: '1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem', paddingTop: '2rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>NDA Clarity</h1>
          <p style={{ fontSize: '1.125rem', color: '#4b5563' }}>Understand what you are signing</p>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>$25 per analysis</p>
        </div>

        {!clientSecret && !analysis && (
          <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <FileText style={{ width: '64px', height: '64px', color: '#4f46e5', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Upload Your NDA</h2>
              <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>Get instant analysis</p>
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                <div style={{ background: '#4f46e5', color: 'white', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: '500' }}>
                  <Upload style={{ width: '20px', height: '20px', display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  {uploading ? 'Processing...' : 'Choose NDA'}
                </div>
                <input type="file" style={{ display: 'none' }} accept=".txt,.pdf" onChange={handleFileUpload} disabled={uploading} />
              </label>
              {error && <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '0.5rem' }}><p style={{ color: '#dc2626' }}>{error}</p></div>}
            </div>
          </div>
        )}

        {clientSecret && !analysis && (
          <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <CreditCard style={{ width: '64px', height: '64px', color: '#4f46e5', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Complete Payment</h2>
              <p style={{ color: '#4b5563' }}>Analyzing: {file && file.name}</p>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
            </Elements>
            <button onClick={resetAll} style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280', textDecoration: 'underline', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
          </div>
        )}

        {analyzing && (
          <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem', textAlign: 'center' }}>
            <FileText style={{ width: '64px', height: '64px', color: '#4f46e5', margin: '0 auto 1rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Analyzing Your NDA...</h2>
          </div>
        )}

        {analysis && (
          <div>
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Analysis Complete!</h2>
              <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>Risk Score: {analysis.overallScore}/100</p>
              <p style={{ marginTop: '0.5rem' }}>{analysis.comparisonToStandard}</p>
            </div>
            <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '1.5rem', textAlign: 'center' }}>
              <button onClick={resetAll} style={{ background: '#4f46e5', color: 'white', padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: '500', border: 'none', cursor: 'pointer' }}>
                Analyze Another NDA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}