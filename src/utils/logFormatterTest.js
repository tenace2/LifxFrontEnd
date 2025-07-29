// Test file to demonstrate the enhanced log formatting
// This shows how your sample log data will be processed and displayed

import { formatRawLogOutput, extractMcpInfo } from './logFormatter.js';

// Your sample log data
const sampleLogData = `{
  "output": "{\\"jsonrpc\\":\\"2.0\\",\\"id\\":\\"req_1753794522183_5m554i0pa\\",\\"result\\":{\\"content\\":[{\\"type\\":\\"text\\",\\"text\\":\\"{\\\\\\"results\\\\\\":[{\\\\\\"id\\\\\\":\\\\\\"d073d58529b9\\\\\\",\\\\\\"status\\\\\\":\\\\\\"ok\\\\\\",\\\\\\"label\\\\\\":\\\\\\"Color A19\\\\\\"}],\\\\\\"message\\\\\\":\\\\\\"Successfully updated 1 lights\\\\\\"}\\"}]}}",
  "pid": 241,
  "logType": "system"
}`;

console.log('=== ORIGINAL LOG DATA ===');
console.log(sampleLogData);

console.log('\n=== FORMATTED WITH SYNTAX HIGHLIGHTING ===');
const formatted = formatRawLogOutput(sampleLogData);
console.log(formatted);

console.log('\n=== EXTRACTED MCP INFO ===');
const mcpInfo = extractMcpInfo(JSON.parse(sampleLogData));
console.log(JSON.stringify(mcpInfo, null, 2));
