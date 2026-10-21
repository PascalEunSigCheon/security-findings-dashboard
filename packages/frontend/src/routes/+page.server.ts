import { API_URL } from '$app/env/private';

const query = `
query {
  vulnerabilities {
    id
    source
    title
    description
    severity
    cvssScore
    publishedAt
    sourceUrl
  }
}
`;

export async function load() {
	console.log('-- gett ----');
	console.log(API_URL);
	const response = await fetch(API_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ query })
	});
	if (!response.ok) {
		throw new Error(`GraphQL HTTP error: ${response.status}`);
	}
	const result = await response.json();
	return {
		vulnerabilities: result.data.vulnerabilities
	};
}
