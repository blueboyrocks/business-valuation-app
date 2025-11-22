/**
 * Manually submit tool outputs for a stuck run
 */

const OpenAI = require('openai').default;

require('dotenv').config({ path: '.env.local' });
process.env.OPENAI_API_KEY = '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';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  defaultHeaders: {
    'OpenAI-Beta': 'assistants=v2'
  }
});

const threadId = 'thread_fkLy5DgA98hrnskEJ090EO5C';
const runId = 'run_9B4QeM7DXwDyyiFlu7jwwGbf';

async function submitOutputs() {
  console.log('Retrieving run status...');
  const run = await openai.beta.threads.runs.retrieve(runId, { thread_id: threadId });
  
  console.log(`Status: ${run.status}`);
  
  if (run.status === 'requires_action' && run.required_action?.type === 'submit_tool_outputs') {
    const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
    
    console.log(`\nFound ${toolCalls.length} tool calls:`);
    toolCalls.forEach(tc => console.log(`  - ${tc.function.name}`));
    
    const toolOutputs = toolCalls.map(toolCall => ({
      tool_call_id: toolCall.id,
      output: JSON.stringify({ success: true })
    }));
    
    console.log('\nSubmitting tool outputs...');
    await openai.beta.threads.runs.submitToolOutputs(runId, {
      thread_id: threadId,
      tool_outputs: toolOutputs
    });
    
    console.log('✅ Tool outputs submitted successfully!');
    console.log('The run should now continue processing.');
  } else {
    console.log(`Run is in ${run.status} status, no action needed.`);
  }
}

submitOutputs().catch(console.error);
