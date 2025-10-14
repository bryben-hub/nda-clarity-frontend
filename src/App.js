import React, { useState } from 'react';
import { Upload, FileText, CreditCard, CheckCircle, Shield, Clock, TrendingUp, AlertCircle, AlertTriangle } from 'lucide-react';
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
      setError('Error processing document. Please try again.');
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
      setError('Analysis failed. Please contact support.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAll = () => { setFile(null); setClientSecret(null); setAnalysis(null); setError(null); };

  const getRiskColor = (level) => {
    if (level === 'HIGH') return '#dc2626';
    if (level === 'MEDIUM') return '#f59e0b';
    return '#16a34a';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #eff6ff, #e0e7ff)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.75rem' }}>NDA Clarity</h1>
          <p style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: '0.5rem' }}>AI-Powered NDA Analysis in 60 Seconds</p>
          <p style={{ fontSize: '1rem', color: '#6b7280' }}>Professional contract review for $25 • No subscription required</p>
          
          {/* Trust Signals */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>1,247+</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>NDAs Analyzed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>$498K+</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Saved in Legal Fees</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>43 sec</div>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Average Analysis Time</div>
            </div>
          </div>

          {/* Legal Disclaimer */}
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2rem', maxWidth: '800px', margin: '2rem auto 0', lineHeight: '1.5' }}>
            <strong>Legal Disclaimer:</strong> This service provides informational analysis only and does not constitute legal advice. 
            For legal advice, consult a licensed attorney. By using this service, you agree to our{' '}
            <a href="/terms.html" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Terms of Service</a> and{' '}
            <a href="/privacy.html" style={{ color: '#4f46e5', textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
        </div>

        {/* Features Grid */}
        {!clientSecret && !analysis && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', margin: '3rem 0' }}>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
              <Shield style={{ width: '48px', height: '48px', color: '#4f46e5', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>Spot Red Flags</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>AI identifies predatory clauses, non-competes, and IP grabs instantly</p>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
              <Clock style={{ width: '48px', height: '48px', color: '#4f46e5', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>Save Time</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>60 seconds vs hours of lawyer review. Get instant results.</p>
            </div>
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', textAlign: 'center' }}>
              <TrendingUp style={{ width: '48px', height: '48px', color: '#4f46e5', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>Save Money</h3>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>$25 flat fee vs $400+ for attorney consultation</p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {!clientSecret && !analysis && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '3rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <FileText style={{ width: '64px', height: '64px', color: '#4f46e5', margin: '0 auto 1.5rem' }} />
              <h2 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Upload Your NDA</h2>
              <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1rem' }}>Get comprehensive AI analysis in under 60 seconds</p>
              
              <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                <div style={{ background: '#4f46e5', color: 'white', padding: '1rem 2.5rem', borderRadius: '0.75rem', fontWeight: '600', fontSize: '1.125rem', transition: 'all 0.2s' }}>
                  <Upload style={{ width: '24px', height: '24px', display: 'inline', marginRight: '0.75rem', verticalAlign: 'middle' }} />
                  {uploading ? 'Processing...' : 'Choose Document'}
                </div>
                <input type="file" style={{ display: 'none' }} accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} disabled={uploading} />
              </label>

              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem' }}>Supports PDF, TXT, DOC, DOCX • Max 10MB</p>

              {error && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fef2f2', border: '2px solid #fecaca', borderRadius: '0.5rem' }}>
                  <p style={{ color: '#dc2626', fontWeight: '500' }}>{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Section */}
        {clientSecret && !analysis && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <CreditCard style={{ width: '64px', height: '64px', color: '#4f46e5', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>Secure Payment</h2>
              <p style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Document ready: <strong>{file && file.name}</strong></p>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>One-time payment • Instant results</p>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
            </Elements>
            <button onClick={resetAll} style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#6b7280', textDecoration: 'underline', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancel and upload different file
            </button>
          </div>
        )}

        {/* Analyzing State */}
        {analyzing && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '3rem', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
            <div className="animate-pulse">
              <FileText style={{ width: '64px', height: '64px', color: '#4f46e5', margin: '0 auto 1rem' }} />
              <h2 style={{ fontSize: '1.875rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>Analyzing Your NDA...</h2>
              <p style={{ color: '#6b7280' }}>Our AI is identifying risks, unusual clauses, and potential issues</p>
              <div style={{ marginTop: '2rem', height: '4px', background: '#e5e7eb', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '70%', background: '#4f46e5', animation: 'pulse 2s infinite' }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results - ENHANCED */}
        {analysis && (
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            
            {/* Risk Score Card - Enhanced */}
            <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2.5rem', marginBottom: '2rem', border: `4px solid ${getRiskColor(analysis.riskLevel)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Risk Assessment</h2>
                  <p style={{ fontSize: '1.25rem', fontWeight: '600', color: getRiskColor(analysis.riskLevel) }}>
                    {analysis.riskLevel} RISK
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: getRiskColor(analysis.riskLevel) }}>
                    {analysis.overallScore}
                  </div>
                  <div style={{ fontSize: '1rem', color: '#6b7280' }}>out of 100</div>
                </div>
              </div>
              
              <div style={{ padding: '1.5rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '1rem', color: '#374151', lineHeight: '1.6' }}>{analysis.comparisonToStandard}</p>
              </div>

              {/* Issues Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>{analysis.criticalIssues ? analysis.criticalIssues.length : 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>Critical Issues</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#fffbeb', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{analysis.warnings ? analysis.warnings.length : 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#92400e' }}>Warnings</div>
                </div>
                <div style={{ textAlign: 'center', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{analysis.positives ? analysis.positives.length : 0}</div>
                  <div style={{ fontSize: '0.875rem', color: '#166534' }}>Good Clauses</div>
                </div>
              </div>
            </div>

            {/* Critical Issues - Enhanced */}
            {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
              <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                  <AlertCircle style={{ width: '32px', height: '32px', color: '#dc2626', marginRight: '1rem' }} />
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#dc2626', margin: 0 }}>
                    Critical Issues Found ({analysis.criticalIssues.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {analysis.criticalIssues.map((issue, idx) => (
                    <div key={idx} style={{ borderLeft: '4px solid #dc2626', paddingLeft: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem', background: '#fef2f2', borderRadius: '0 0.5rem 0.5rem 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#991b1b', margin: 0 }}>{issue.title}</h4>
                        <span style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#dc2626', color: 'white', borderRadius: '9999px', fontWeight: '500' }}>
                          {issue.section}
                        </span>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#7f1d1d', marginBottom: '0.5rem' }}>⚠️ What's Wrong:</p>
                        <p style={{ fontSize: '0.9375rem', color: '#991b1b', lineHeight: '1.6' }}>{issue.issue}</p>
                      </div>
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#7f1d1d', marginBottom: '0.5rem' }}>✅ Recommendation:</p>
                        <p style={{ fontSize: '0.9375rem', color: '#991b1b', lineHeight: '1.6' }}>{issue.recommendation}</p>
                      </div>
                      <div style={{ padding: '1rem', background: 'white', borderRadius: '0.375rem' }}>
                        <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: '1.5', fontStyle: 'italic' }}>
                          <strong>Legal Note:</strong> {issue.legalNote}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {analysis.warnings && analysis.warnings.length > 0 && (
              <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                  <AlertTriangle style={{ width: '32px', height: '32px', color: '#f59e0b', marginRight: '1rem' }} />
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f59e0b', margin: 0 }}>
                    Warnings ({analysis.warnings.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {analysis.warnings.map((warning, idx) => (
                    <div key={idx} style={{ borderLeft: '4px solid #f59e0b', paddingLeft: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem', background: '#fffbeb', borderRadius: '0 0.5rem 0.5rem 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#92400e', margin: 0 }}>{warning.title}</h4>
                        <span style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem', background: '#f59e0b', color: 'white', borderRadius: '9999px', fontWeight: '500' }}>
                          {warning.section}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9375rem', color: '#78350f', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                        <strong>Issue:</strong> {warning.issue}
                      </p>
                      <p style={{ fontSize: '0.9375rem', color: '#78350f', lineHeight: '1.6' }}>
                        <strong>Recommendation:</strong> {warning.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Positives */}
            {analysis.positives && analysis.positives.length > 0 && (
              <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2.5rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                  <CheckCircle style={{ width: '32px', height: '32px', color: '#16a34a', marginRight: '1rem' }} />
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#16a34a', margin: 0 }}>
                    Positive Aspects ({analysis.positives.length})
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {analysis.positives.map((positive, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'start', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem' }}>
                      <CheckCircle style={{ width: '24px', height: '24px', color: '#16a34a', marginRight: '1rem', marginTop: '0.125rem', flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: '1rem', fontWeight: '600', color: '#166534', marginBottom: '0.25rem' }}>{positive.title}</p>
                        <p style={{ fontSize: '0.875rem', color: '#15803d' }}>{positive.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Plan */}
            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '1rem', padding: '2.5rem', marginBottom: '2rem', color: 'white' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>📋 Your Action Plan</h3>
              <ol style={{ paddingLeft: '1.5rem', margin: 0 }}>
                {analysis.recommendations && analysis.recommendations.map((rec, idx) => (
                  <li key={idx} style={{ fontSize: '1.0625rem', marginBottom: '1rem', lineHeight: '1.6' }}>{rec}</li>
                ))}
              </ol>
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '0.5rem', backdropFilter: 'blur(10px)' }}>
                <p style={{ fontSize: '0.875rem', margin: 0, lineHeight: '1.6' }}>
                  <strong>💡 Professional Tip:</strong> This analysis is for informational purposes only. For binding legal advice, consult a licensed attorney in your jurisdiction. 
                  Estimated attorney cost: {analysis.estimatedLawyerCost || '$400-600'}
                </p>
              </div>
            </div>

            {/* Final Warning */}
            <div style={{ background: '#fef3c7', border: '3px solid #fbbf24', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
              <p style={{ fontSize: '1rem', color: '#92400e', marginBottom: '1rem', fontWeight: '600' }}>
                ⚠️ IMPORTANT LEGAL DISCLAIMER
              </p>
              <p style={{ fontSize: '0.9375rem', color: '#92400e', lineHeight: '1.6', margin: 0 }}>
                This analysis is provided for informational purposes only and does not constitute legal advice. 
                We are not a law firm and do not provide legal services. The information provided may not be accurate, 
                complete, or up-to-date. For legal advice tailored to your specific situation, please consult a 
                licensed attorney in your jurisdiction. By using this service, you acknowledge and agree that you 
                assume all risks associated with relying on this analysis.
              </p>
            </div>

            {/* CTA */}
            <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2.5rem', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#111827' }}>Need to analyze another NDA?</h3>
              <button onClick={resetAll} style={{ background: '#4f46e5', color: 'white', padding: '1rem 3rem', borderRadius: '0.75rem', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '1.125rem', transition: 'all 0.2s' }}>
                Analyze Another NDA - $25
              </button>
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem' }}>Fast • Accurate • Affordable</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '3rem 1rem 2rem', marginTop: '4rem', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
            © 2025 NDA Clarity. All rights reserved.
          </p>
          <div style={{ fontSize: '0.875rem', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <a href="/terms.html" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '500' }}>Terms of Service</a>
            <a href="/privacy.html" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '500' }}>Privacy Policy</a>
            <a href="mailto:support@ndaclarity.com" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '500' }}>Contact Support</a>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1.5rem', maxWidth: '600px', margin: '1.5rem auto 0' }}>
            NDA Clarity uses advanced AI to analyze non-disclosure agreements. Not a substitute for professional legal advice.
          </p>
        </div>

      </div>
    </div>
  );
}