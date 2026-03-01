const core = require('@actions/core');
const fs = require('fs');
const PROMPT = `You are an expert at summarizing complex discussions into concise and actionable summaries. Your goal is to provide a clear understanding of the issue, the different perspectives discussed, and the proposed solutions.

**Issue:** {issue_title}

**Context:** {issue_context}

**Discussion Highlights:** {discussion_highlights}

**Key Arguments/Perspectives:** {key_arguments}

**Proposed Solutions:** {proposed_solutions}

**Instructions:**

Based on the information above, generate a concise issue summary that includes:

*   A brief description of the issue.
*   A summary of the key arguments and perspectives presented in the discussion.
*   A clear outline of the proposed solutions.
*   (Optional) Identify any remaining open questions or areas of disagreement.

**Output Format:**

**Issue Summary:**

[Concise summary of the issue, arguments, and proposed solutions. Aim for brevity and clarity.]

**Open Questions/Disagreements (Optional):**

[List any remaining open questions or areas where disagreement persists.]`;
async function run() {
  try {
    const key = core.getInput('gemini_api_key');
    const token = core.getInput('service_token');
    const ctx = { repoName: process.env.GITHUB_REPOSITORY || '', event: process.env.GITHUB_EVENT_NAME || '' };
    try { Object.assign(ctx, JSON.parse(fs.readFileSync('package.json', 'utf8'))); } catch {}
    let prompt = PROMPT;
    for (const [k, v] of Object.entries(ctx)) prompt = prompt.replace(new RegExp('{' + k + '}', 'g'), String(v || ''));
    let result;
    if (key) {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 2000 } })
      });
      result = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (token) {
      const r = await fetch('https://action-factory.walshd1.workers.dev/generate/issue-summary-generator', {
        method: 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(ctx)
      });
      result = (await r.json()).content || '';
    } else throw new Error('Need gemini_api_key or service_token');
    console.log(result);
    core.setOutput('result', result);
  } catch (e) { core.setFailed(e.message); }
}
run();
