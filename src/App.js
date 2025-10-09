import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, AlertTriangle, FileText, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_51SFe3VGSXAViqFcQnsdax2I8fBUKfPaWfbl6cV4gU9EYsnwiSuOwxZoJQOOvEtlcWh1xOIzodkR2neqE85UQcQGo00O89tpobk');

function PaymentForm({ clientSecret, onSuccess, amount }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);
    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (result.error) {
      setError(result.error.message);
      setProcessing(false);
    } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      onSuccess(result.paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">{error}</div>}
      <button type="submit" disabled={!stripe || processing} className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50">
        {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
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
      const response = await fetch('http://nda-clarity-backend-production.up.railway.app/api/create-payment', {
        method: 'POST',
        body: formDatahttps://nda-clarity-backend-production.up.railway.app      });
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
      const response = await fetch('http://nda-clarity-backend-production.up.railway.app/api/analyze-after-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentIntentId: paymentId })
      });
      const result = await response.json();
      setAnalysis(result);
      setClientSecret(null);
    } catch (err) {
      setError('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (level) => {
    if (level === 'HIGH') return 'text-red-600 bg-red-50 border-red-200';
    if (level === 'MEDIUM') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (level === 'LOW') return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'critical') return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (severity === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <CheckCircle className="w-5 h-5 text-green-600" />;
  };

  const resetAll = () => {
    setFile(null);
    setClientSecret(null);
    setAnalysis(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">NDA Clarity</h1>
          <p className="text-lg text-gray-600">Understand what you are signing before it is too late</p>
          <p className="text-sm text-gray-500 mt-2">Professional NDA analysis in 60 seconds</p>
        </div>

        {!clientSecret && !analysis && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center">
              <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-4">Upload Your NDA</h2>
              <p className="text-gray-600 mb-6">Get instant analysis for $25</p>
              <label className="cursor-pointer inline-block">
                <div className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition">
                  <Upload className="w-5 h-5 inline mr-2" />
                  {uploading ? 'Processing...' : 'Choose NDA Document'}
                </div>
                <input type="file" className="hidden" accept=".txt,.pdf" onChange={handleFileUpload} disabled={uploading} />
              </label>
              {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600">{error}</p></div>}
            </div>
          </div>
        )}

        {clientSecret && !analysis && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <CreditCard className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Complete Payment</h2>
              <p className="text-gray-600">Document ready for analysis</p>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} amount={2500} />
            </Elements>
            <button onClick={resetAll} className="mt-4 text-sm text-gray-500 underline w-full">Cancel</button>
          </div>
        )}

        {analyzing && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-pulse">
              <FileText className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-4">Analyzing Your NDA...</h2>
            </div>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            <div className={`rounded-lg border-2 p-6 ${getRiskColor(analysis.riskLevel)}`}>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold">Risk Assessment</h2>
                <span className="text-3xl font-bold">{analysis.overallScore}/100</span>
              </div>
              <p className="text-lg font-semibold mb-1">Risk Level: {analysis.riskLevel}</p>
              <p className="opacity-90">{analysis.comparisonToStandard}</p>
            </div>

            {analysis.criticalIssues && analysis.criticalIssues.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center">
                  <AlertCircle className="w-6 h-6 mr-2" />
                  Critical Issues ({analysis.criticalIssues.length})
                </h3>
                <div className="space-y-4">
                  {analysis.criticalIssues.map((issue, idx) => (
                    <div key={idx} className="border-l-4 border-red-500 pl-4 py-2 bg-red-50 rounded-r">
                      <div className="flex items-start mb-2">
                        {getSeverityIcon(issue.severity)}
                        <div className="ml-3 flex-1">
                          <h4 className="font-semibold text-gray-900">{issue.title}</h4>
                          <p className="text-sm text-gray-500">{issue.section}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2"><strong>Issue:</strong> {issue.issue}</p>
                      <p className="text-gray-700 mb-2"><strong>Recommendation:</strong> {issue.recommendation}</p>
                      <p className="text-sm text-gray-600 italic">{issue.legalNote}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.warnings && analysis.warnings.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-yellow-600 mb-4 flex items-center">
                  <AlertTriangle className="w-6 h-6 mr-2" />
                  Warnings ({analysis.warnings.length})
                </h3>
                <div className="space-y-4">
                  {analysis.warnings.map((warning, idx) => (
                    <div key={idx} className="border-l-4 border-yellow-500 pl-4 py-2 bg-yellow-50 rounded-r">
                      <div className="flex items-start mb-2">
                        {getSeverityIcon(warning.severity)}
                        <div className="ml-3 flex-1">
                          <h4 className="font-semibold text-gray-900">{warning.title}</h4>
                          <p className="text-sm text-gray-500">{warning.section}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2"><strong>Issue:</strong> {warning.issue}</p>
                      <p className="text-gray-700"><strong>Recommendation:</strong> {warning.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.positives && analysis.positives.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2" />
                  What is Good About This NDA
                </h3>
                <div className="space-y-2">
                  {analysis.positives.map((positive, idx) => (
                    <div key={idx} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">{positive.title}</p>
                        <p className="text-sm text-gray-600">{positive.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-indigo-900 mb-4">What You Should Do</h3>
              <ol className="space-y-2">
                {analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="font-bold text-indigo-600 mr-3">{idx + 1}.</span>
                    <span className="text-gray-800">{rec}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 pt-6 border-t border-indigo-200">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> This analysis is for informational purposes only and does not constitute legal advice. 
                  For complex situations, consult a licensed attorney. Estimated attorney consultation cost: {analysis.estimatedLawyerCost}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <button onClick={resetAll} className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-indigo-700 transition">
                Analyze Another NDA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}