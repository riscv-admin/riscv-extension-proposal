/**
 * Cloudflare Worker for RISC-V Extension Proposal Jira Integration
 *
 * This worker receives form submissions and creates Jira issues
 * in the RVS project with Specification issue type.
 */

// Jira custom field IDs
const CUSTOM_FIELDS = {
  ISA_TYPE: 'customfield_10042',      // ISA or NON-ISA
  FAST_TRACK: 'customfield_10041',    // Fast Track boolean
  GITHUB_URL: 'customfield_10043',    // GitHub URL
  EXTENSIONS: 'customfield_10044',    // Extensions list
};

/**
 * Handle CORS preflight and add CORS headers
 */
function corsHeaders(origin, allowedOrigin) {
  // Allow localhost for development and the configured origin for production
  const isAllowed = origin === allowedOrigin ||
                    origin?.startsWith('http://localhost:') ||
                    origin?.startsWith('http://127.0.0.1:');

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Convert plain text to Atlassian Document Format (ADF)
 */
function textToADF(text) {
  if (!text) {
    return {
      type: 'doc',
      version: 1,
      content: []
    };
  }

  const paragraphs = text.split('\n\n').filter(p => p.trim());

  return {
    type: 'doc',
    version: 1,
    content: paragraphs.map(paragraph => ({
      type: 'paragraph',
      content: [{
        type: 'text',
        text: paragraph.trim()
      }]
    }))
  };
}

/**
 * Create a Jira issue
 */
async function createJiraIssue(env, formData) {
  const { JIRA_USER_EMAIL, JIRA_API_TOKEN, JIRA_SERVER_URL, JIRA_PROJECT_KEY } = env;

  // Build the description with proposer info
  const proposerInfo = `**Proposer Information:**
- Name: ${formData.firstName} ${formData.lastName}
- Email: ${formData.email}
- Affiliation: ${formData.affiliation || 'Not specified'}

**Proposal Details:**
${formData.description || 'No details provided.'}`;

  // Build the issue payload
  const issueData = {
    fields: {
      project: {
        key: JIRA_PROJECT_KEY
      },
      summary: formData.summary,
      description: textToADF(proposerInfo),
      issuetype: {
        name: 'Specification'
      },
      // ISA/NON-ISA field
      [CUSTOM_FIELDS.ISA_TYPE]: {
        value: formData.isaType || 'ISA'
      },
      // Fast Track field (boolean-like select)
      [CUSTOM_FIELDS.FAST_TRACK]: {
        value: formData.fastTrack === true || formData.fastTrack === 'true' ? 'Yes' : 'No'
      }
    }
  };

  // Add GitHub URL if provided
  if (formData.githubUrl) {
    issueData.fields[CUSTOM_FIELDS.GITHUB_URL] = formData.githubUrl;
  }

  // Add Extensions if provided
  if (formData.extensions && formData.extensions.length > 0) {
    // Extensions is a multi-value text field
    const extensionsList = Array.isArray(formData.extensions)
      ? formData.extensions
      : formData.extensions.split(',').map(e => e.trim()).filter(e => e);

    if (extensionsList.length > 0) {
      issueData.fields[CUSTOM_FIELDS.EXTENSIONS] = extensionsList;
    }
  }

  // Create the issue via Jira API
  const auth = btoa(`${JIRA_USER_EMAIL}:${JIRA_API_TOKEN}`);

  const response = await fetch(`${JIRA_SERVER_URL}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(issueData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Jira API error:', errorText);
    throw new Error(`Jira API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  return {
    key: result.key,
    id: result.id,
    url: `${JIRA_SERVER_URL}/browse/${result.key}`
  };
}

/**
 * Validate the form data
 */
function validateFormData(data) {
  const errors = [];

  if (!data.firstName?.trim()) {
    errors.push('First name is required');
  }
  if (!data.lastName?.trim()) {
    errors.push('Last name is required');
  }
  if (!data.email?.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }
  if (!data.summary?.trim()) {
    errors.push('Specification name is required');
  }
  if (!data.description?.trim()) {
    errors.push('Proposal details are required');
  }
  if (data.githubUrl && !data.githubUrl.startsWith('https://github.com/')) {
    errors.push('GitHub URL must start with https://github.com/');
  }

  return errors;
}

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // Only accept POST requests to /api/submit
    const url = new URL(request.url);
    if (request.method !== 'POST' || !url.pathname.endsWith('/api/submit')) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    try {
      // Parse the request body
      const formData = await request.json();

      // Validate the form data
      const validationErrors = validateFormData(formData);
      if (validationErrors.length > 0) {
        return new Response(JSON.stringify({
          success: false,
          errors: validationErrors
        }), {
          status: 400,
          headers: { ...cors, 'Content-Type': 'application/json' }
        });
      }

      // Create the Jira issue
      const result = await createJiraIssue(env, formData);

      return new Response(JSON.stringify({
        success: true,
        jiraKey: result.key,
        jiraUrl: result.url
      }), {
        status: 200,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Error processing request:', error);

      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to create Jira issue. Please try again later.'
      }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};
