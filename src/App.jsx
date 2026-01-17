import { useState, useRef } from 'react'

const ISA_OPTIONS = ['ISA', 'NON-ISA']
const FAST_TRACK_OPTIONS = ['Yes', 'No']

// Cloudflare Worker endpoint - update this after deploying your worker
const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || 'https://riscv-jira-worker.tech-admin-042.workers.dev/api/submit'

function App() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    affiliation: '',
    summary: '',
    description: '',
    isaType: '',
    fastTrack: '',
    githubUrl: '',
    extensions: '',
  })
  const [errors, setErrors] = useState({})
  const [submitStatus, setSubmitStatus] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateGithubUrl = (url) => {
    if (!url) return true // Optional field
    const pattern = /^https?:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+\/?.*$/
    return pattern.test(url)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!formData.affiliation.trim()) {
      newErrors.affiliation = 'Affiliation is required'
    }
    if (!formData.summary.trim()) {
      newErrors.summary = 'Specification name is required'
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Proposal details are required'
    }
    if (!formData.isaType) {
      newErrors.isaType = 'Please select ISA or NON-ISA'
    }
    if (!formData.fastTrack) {
      newErrors.fastTrack = 'Please select Fast Track option'
    }
    if (formData.githubUrl && !validateGithubUrl(formData.githubUrl)) {
      newErrors.githubUrl = 'Invalid GitHub URL (e.g., https://github.com/owner/repo)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setSubmitStatus(null)

    // Build the submission data
    const submissionData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      affiliation: formData.affiliation,
      summary: formData.summary,
      description: formData.description,
      isaType: formData.isaType,
      fastTrack: formData.fastTrack,
      githubUrl: formData.githubUrl || null,
      extensions: formData.extensions ? formData.extensions.split(/[,\s]+/).filter(Boolean) : [],
    }

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Your proposal has been submitted successfully!',
          jiraKey: result.jiraKey,
          jiraUrl: result.jiraUrl,
        })
      } else {
        setSubmitStatus({
          type: 'error',
          message: result.error || 'Failed to submit proposal. Please try again.',
        })
      }
    } catch (error) {
      console.error('Submission error details:', {
        message: error.message,
        stack: error.stack,
        type: error.name,
        original: error
      })
      setSubmitStatus({
        type: 'error',
        message: `Network error: ${error.message}. Please check console for details.`,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      affiliation: '',
      summary: '',
      description: '',
      isaType: '',
      fastTrack: '',
      githubUrl: '',
      extensions: '',
    })
    setErrors({})
    setSubmitStatus(null)
  }

  // Success screen
  if (submitStatus?.type === 'success') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Proposal Submitted!</h2>
              <p className="text-gray-600 mb-6">{submitStatus.message}</p>

              {submitStatus.jiraKey && (
                <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Tracking Information:</h3>
                  <p className="text-sm text-gray-600">
                    Your proposal has been assigned ticket{' '}
                    <a
                      href={submitStatus.jiraUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-berkeley-blue font-medium hover:underline"
                    >
                      {submitStatus.jiraKey}
                    </a>
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
                <h3 className="font-semibold text-blue-800 mb-2">What happens next:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                  <li>Your proposal will be reviewed by the RISC-V team</li>
                  <li>You may be contacted for additional information</li>
                  <li>Updates will be posted to the Jira ticket</li>
                </ol>
              </div>

              <button
                onClick={resetForm}
                className="bg-berkeley-blue text-white px-6 py-2 rounded-lg hover:bg-berkeley-blue-dark transition-colors"
              >
                Submit Another Proposal
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Error screen
  if (submitStatus?.type === 'error') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Submission Failed</h2>
              <p className="text-gray-600 mb-6">{submitStatus.message}</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setSubmitStatus(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Go Back & Edit
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-california-gold text-berkeley-blue font-semibold px-6 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md">
          {/* Submitter Information */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-berkeley-blue mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-california-gold text-berkeley-blue rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Submitter Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-california-gold focus:border-california-gold outline-none transition-colors ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="John"
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-california-gold focus:border-california-gold outline-none transition-colors ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Doe"
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-california-gold focus:border-california-gold outline-none transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="john.doe@example.com"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div className="md:col-span-2">
                <label htmlFor="affiliation" className="block text-sm font-medium text-gray-700 mb-1">
                  Affiliation <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="affiliation"
                  name="affiliation"
                  value={formData.affiliation}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-california-gold focus:border-california-gold outline-none transition-colors ${errors.affiliation ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Organization or Company Name"
                />
                {errors.affiliation && <p className="text-red-500 text-xs mt-1">{errors.affiliation}</p>}
              </div>
            </div>
          </div>

          {/* Specification Details */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-berkeley-blue mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-california-gold text-berkeley-blue rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Specification Details
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-1">
                  Specification Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-california-gold focus:border-california-gold outline-none transition-colors ${errors.summary ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Name of the proposed specification"
                />
                {errors.summary && <p className="text-red-500 text-xs mt-1">{errors.summary}</p>}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Proposal Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-california-gold focus:border-california-gold outline-none transition-colors resize-y ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Explains the motivation for and goals of the proposed extension. Describes the notable use cases. Indicates the proposed extension name which must be consistent with the 'ISA Extension Naming Conventions' chapter of the Unprivileged ISA spec and the 'ISA string branding, naming, and versioning' policy."
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ISA or NON-ISA <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {ISA_OPTIONS.map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="isaType"
                          value={option}
                          checked={formData.isaType === option}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-california-gold focus:ring-california-gold border-gray-300"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.isaType && <p className="text-red-500 text-xs mt-1">{errors.isaType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propose this to be pursued as a Fast-Track? <span className="text-red-500">*</span>
                    <span className="relative inline-block ml-1 group">
                      <svg className="w-4 h-4 text-gray-400 inline cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-berkeley-blue text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-64 text-center z-10 pointer-events-none">
                        This fast track process is a means to create a relatively small architecture extension without the overheads of creating and running a Task Group over several quarters or more.
                      </span>
                    </span>
                  </label>
                  <div className="flex gap-4 mt-2">
                    {FAST_TRACK_OPTIONS.map(option => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="fastTrack"
                          value={option}
                          checked={formData.fastTrack === option}
                          onChange={handleInputChange}
                          className="w-4 h-4 text-california-gold focus:ring-california-gold border-gray-300"
                        />
                        <span className="text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.fastTrack && <p className="text-red-500 text-xs mt-1">{errors.fastTrack}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-berkeley-blue mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-california-gold text-berkeley-blue rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Additional Information
              <span className="text-sm font-normal text-gray-500">(Optional)</span>
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Repository URL
                </label>
                <input
                  type="url"
                  id="githubUrl"
                  name="githubUrl"
                  value={formData.githubUrl}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-california-gold focus:border-california-gold outline-none transition-colors ${errors.githubUrl ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="https://github.com/owner/repository"
                />
                {errors.githubUrl && <p className="text-red-500 text-xs mt-1">{errors.githubUrl}</p>}
              </div>

              <div>
                <label htmlFor="extensions" className="block text-sm font-medium text-gray-700 mb-1">
                  Extensions
                </label>
                <input
                  type="text"
                  id="extensions"
                  name="extensions"
                  value={formData.extensions}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-california-gold focus:border-california-gold outline-none transition-colors"
                  placeholder="e.g., Zvabc, Zcbcc, Zfoo (comma or space separated)"
                />
                <p className="text-gray-500 text-xs mt-1">Enter extension names separated by commas or spaces</p>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="p-6 bg-gray-50 rounded-b-lg">
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-2 bg-california-gold text-berkeley-blue font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Proposal'
                )}
              </button>
            </div>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="bg-white border-b-4 border-california-gold shadow-lg">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <img
            src="./riscv_logo.png"
            alt="RISC-V Logo"
            className="h-12 w-auto"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          <div>
            <h1 className="text-2xl font-bold text-berkeley-blue">New RISC-V Extension Proposal</h1>
          </div>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-berkeley-blue-dark text-white py-6 mt-12">
      <div className="max-w-4xl mx-auto px-4 text-center text-sm">
        <p className="text-gray-400">New RISC-V Extension Proposal</p>
      </div>
    </footer>
  )
}

export default App
