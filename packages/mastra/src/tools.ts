import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || process.env.default_x_api_key || 'changeme-dev-key';

export async function member_search(query: string) {
  const res = await axios.get(`${API_URL}/members`, {
    params: { query },
    headers: { 'x-api-key': API_KEY },
  });
  return res.data;
}

export async function checklist_check(memberId: string) {
  const res = await axios.get(`${API_URL}/members/${memberId}/checklist`, {
    headers: { 'x-api-key': API_KEY },
  });
  return res.data;
}

export async function validate_member(memberId: string) {
  const res = await axios.post(`${API_URL}/members/${memberId}/validate`, {}, {
    headers: { 'x-api-key': API_KEY },
  });
  return res.data;
}

export async function generate_tracciato(memberIds?: string[]) {
  const res = await axios.post(`${API_URL}/tracciato/batches`, { memberIds }, {
    headers: { 'x-api-key': API_KEY },
  });
  return res.data;
}
